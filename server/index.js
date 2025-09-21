// server/index.js - Créer ce fichier
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // URL de Vite
    credentials: true
}));
app.use(express.json());

// Store temporaire pour les tokens (en production, utilise Supabase)
const userTokens = new Map();

// Endpoint pour échanger les codes OAuth
app.post('/api/oauth/exchange', async (req, res) => {
    try {
        const { provider, code, redirectUri } = req.body;

        if (provider === 'google') {
            // Échanger le code Google contre des tokens
            const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
            });

            const { access_token, refresh_token, expires_in } = tokenResponse.data;

            // Récupérer les infos utilisateur
            const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            });

            const userData = userResponse.data;

            // Stocker les tokens (temporairement en mémoire)
            const userId = userData.id;
            userTokens.set(userId, {
                provider: 'google',
                access_token,
                refresh_token,
                expires_in,
                user: userData,
                connected_at: new Date(),
            });

            // Déclencher le workflow n8n si configuré
            if (process.env.N8N_WEBHOOK_URL) {
                try {
                    await axios.post(process.env.N8N_WEBHOOK_URL, {
                        event: 'google_connected',
                        user: userData,
                        tokens: { access_token, expires_in }, // Ne pas envoyer le refresh_token
                    });
                } catch (n8nError) {
                    console.error('N8N webhook failed:', n8nError.message);
                }
            }

            res.json({
                success: true,
                provider: 'google',
                user: userData,
                message: 'Google connecté avec succès !',
            });

        } else if (provider === 'facebook') {
            // Échanger le code Facebook contre des tokens
            const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
                params: {
                    client_id: process.env.FACEBOOK_APP_ID,
                    client_secret: process.env.FACEBOOK_APP_SECRET,
                    redirect_uri: redirectUri,
                    code: code,
                },
            });

            const { access_token } = tokenResponse.data;

            // Récupérer les infos utilisateur et pages
            const userResponse = await axios.get('https://graph.facebook.com/me', {
                params: {
                    fields: 'id,name,email',
                    access_token: access_token,
                },
            });

            const userData = userResponse.data;

            // Récupérer les pages gérées par l'utilisateur
            const pagesResponse = await axios.get('https://graph.facebook.com/me/accounts', {
                params: {
                    access_token: access_token,
                },
            });

            const pagesData = pagesResponse.data;

            // Stocker les tokens
            const userId = userData.id;
            userTokens.set(userId, {
                provider: 'facebook',
                access_token,
                user: userData,
                pages: pagesData.data,
                connected_at: new Date(),
            });

            // Déclencher le workflow n8n
            if (process.env.N8N_WEBHOOK_URL) {
                try {
                    await axios.post(process.env.N8N_WEBHOOK_URL, {
                        event: 'facebook_connected',
                        user: userData,
                        pages: pagesData.data,
                    });
                } catch (n8nError) {
                    console.error('N8N webhook failed:', n8nError.message);
                }
            }

            res.json({
                success: true,
                provider: 'facebook',
                user: userData,
                pages: pagesData.data,
                message: 'Facebook connecté avec succès !',
            });

        } else {
            res.status(400).json({ error: 'Provider non supporté' });
        }

    } catch (error) {
        console.error('OAuth exchange error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Erreur lors de l\'échange OAuth',
            details: error.response?.data || error.message,
        });
    }
});

// Endpoint pour vérifier le statut des connexions
app.get('/api/oauth/status', (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: 'User ID requis' });
    }

    const tokens = userTokens.get(userId);

    if (tokens) {
        res.json({
            connected: true,
            provider: tokens.provider,
            user: tokens.user,
            connected_at: tokens.connected_at,
            pages: tokens.pages || null,
        });
    } else {
        res.json({
            connected: false,
        });
    }
});

// Endpoint pour déconnecter
app.post('/api/oauth/revoke', async (req, res) => {
    try {
        const { userId, provider } = req.body;

        const tokens = userTokens.get(userId);

        if (tokens) {
            // Révoquer les tokens côté provider
            if (provider === 'google' && tokens.access_token) {
                await axios.post(`https://oauth2.googleapis.com/revoke?token=${tokens.access_token}`);
            } else if (provider === 'facebook' && tokens.access_token) {
                await axios.delete(`https://graph.facebook.com/me/permissions?access_token=${tokens.access_token}`);
            }

            // Supprimer de notre stockage
            userTokens.delete(userId);
        }

        res.json({ success: true, message: 'Déconnexion réussie' });
    } catch (error) {
        console.error('Revoke error:', error.message);
        res.status(500).json({ error: 'Erreur lors de la déconnexion' });
    }
});

// Endpoint pour déclencher n8n manuellement
app.post('/api/n8n/trigger', async (req, res) => {
    try {
        const { userId, workflow } = req.body;

        const tokens = userTokens.get(userId);

        if (!tokens) {
            return res.status(404).json({ error: 'Utilisateur non connecté' });
        }

        if (!process.env.N8N_WEBHOOK_URL) {
            return res.status(500).json({ error: 'N8N non configuré' });
        }

        await axios.post(process.env.N8N_WEBHOOK_URL, {
            event: 'manual_trigger',
            workflow: workflow,
            user: tokens.user,
            provider: tokens.provider,
        });

        res.json({ success: true, message: 'Workflow déclenché' });
    } catch (error) {
        console.error('N8N trigger error:', error.message);
        res.status(500).json({ error: 'Erreur lors du déclenchement' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur OAuth démarré sur le port ${PORT}`);
    console.log(`🔗 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`🔧 N8N Webhook: ${process.env.N8N_WEBHOOK_URL || 'Non configuré'}`);
});

// .env - Créer ce fichier à la racine
FRONTEND_URL=http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=1088698854910-s99n9jvmvjiq015f8mb1nf5l5kjh39dt.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=TON_CLIENT_SECRET_GOOGLE

# Facebook OAuth
FACEBOOK_APP_ID=TON_APP_ID_FACEBOOK
FACEBOOK_APP_SECRET=TON_APP_SECRET_FACEBOOK

# Serveur
PORT=3001