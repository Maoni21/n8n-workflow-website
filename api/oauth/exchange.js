// api/oauth/exchange.js
export default async function handler(req, res) {
    // CORS pour smartflow.autos
    res.setHeader('Access-Control-Allow-Origin', 'https://www.smartflow.autos');
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
            // Import axios dynamiquement
            const axios = (await import('axios')).default;

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

            // TODO: Stocker en Supabase plus tard
            console.log('Google user connected:', userData.email);

            // Déclencher n8n si configuré
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
            const axios = (await import('axios')).default;

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

            // Récupérer les infos utilisateur
            const userResponse = await axios.get('https://graph.facebook.com/me', {
                params: {
                    fields: 'id,name,email',
                    access_token: access_token,
                },
            });

            const userData = userResponse.data;

            // Récupérer les pages gérées
            const pagesResponse = await axios.get('https://graph.facebook.com/me/accounts', {
                params: {
                    access_token: access_token,
                },
            });

            const pagesData = pagesResponse.data;

            console.log('Facebook user connected:', userData.email);

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