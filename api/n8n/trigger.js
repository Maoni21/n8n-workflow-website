// api/n8n/trigger.js
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
        const { userId, workflow } = req.body;

        const tokens = userTokens.get(userId);

        if (!tokens) {
            res.status(404).json({ error: 'Utilisateur non connecté' });
            return;
        }

        if (!process.env.N8N_WEBHOOK_URL) {
            res.status(500).json({ error: 'N8N non configuré' });
            return;
        }

        await axios.post(process.env.N8N_WEBHOOK_URL, {
            event: 'manual_trigger',
            workflow: workflow,
            user: tokens.user,
            provider: tokens.provider,
        });

        res.status(200).json({ success: true, message: 'Workflow déclenché' });

    } catch (error) {
        console.error('N8N trigger error:', error.message);
        res.status(500).json({ error: 'Erreur lors du déclenchement' });
    }
}