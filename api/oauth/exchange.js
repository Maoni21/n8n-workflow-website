// api/oauth/exchange.js
import axios from 'axios';

// Store temporaire pour les tokens (en attendant Supabase)
const userTokens = new Map();

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    try {
        const { provider, code, redirectUri } = req.body;

        if (provider === 'google') {
            // Échanger le code Google contre des tokens
            const tokenPayload = new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
            });

            const tokenResponse = await axios.post(
                'https://oauth2.googleapis.com/token',
                tokenPayload.toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                },
            );

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
                        tokens: { access_token, expires_in },
                    });
                } catch (n8nError) {
                    console.error('N8N webhook failed:', n8nError.message);
                }
            }

            res.status(200).json({
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

            res.status(200).json({
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
}