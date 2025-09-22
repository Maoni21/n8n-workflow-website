// api/oauth/revoke.js
import axios from 'axios';

// Store temporaire (même que dans exchange.js)
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

        res.status(200).json({ success: true, message: 'Déconnexion réussie' });

    } catch (error) {
        console.error('Revoke error:', error.message);
        res.status(500).json({ error: 'Erreur lors de la déconnexion' });
    }
}