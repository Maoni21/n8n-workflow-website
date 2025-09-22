// api/oauth/status.js

import userTokens from '../_lib/tokenStore.js';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    try {
        const { userId } = req.query;

        if (!userId) {
            res.status(400).json({ error: 'User ID requis' });
            return;
        }

        const tokens = userTokens.get(userId);

        if (tokens) {
            res.status(200).json({
                connected: true,
                provider: tokens.provider,
                user: tokens.user,
                connected_at: tokens.connected_at,
                pages: tokens.pages || null,
            });
        } else {
            res.status(200).json({
                connected: false,
            });
        }

    } catch (error) {
        console.error('Status error:', error.message);
        res.status(500).json({ error: 'Erreur lors de la vérification du statut' });
    }
}