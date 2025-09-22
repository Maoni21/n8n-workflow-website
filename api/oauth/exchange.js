// api/oauth/exchange.js
export default async function handler(req, res) {
    // CORS Headers pour smartflow.autos
    res.setHeader('Access-Control-Allow-Origin', 'https://www.smartflow.autos');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Gestion des requêtes OPTIONS (preflight)
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

        if (!provider || !code || !redirectUri) {
            return res.status(400).json({
                error: 'Paramètres manquants: provider, code, redirectUri requis'
            });
        }

        console.log(`[OAuth] Exchange ${provider} - Code reçu`);

        if (provider === 'google') {
            // Échange du code contre des tokens Google
            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    client_id: process.env.GOOGLE_CLIENT_ID,
                    client_secret: process.env.GOOGLE_CLIENT_SECRET,
                    code: code,
                    grant_type: 'authorization_code',
                    redirect_uri: redirectUri,
                }),
            });

            const tokenData = await tokenResponse.json();

            if (!tokenResponse.ok) {
                console.error('[OAuth] Google token error:', tokenData);
                return res.status(400).json({
                    error: tokenData.error_description || 'Erreur lors de l\'échange du token Google'
                });
            }

            // Récupération des informations utilisateur
            const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                },
            });

            const userData = await userResponse.json();

            if (!userResponse.ok) {
                console.error('[OAuth] Google user info error:', userData);
                return res.status(400).json({
                    error: 'Erreur lors de la récupération des informations utilisateur'
                });
            }

            // Stocker les tokens (temporairement en mémoire - à remplacer par Supabase)
            const userId = userData.id;
            const userTokens = {
                userId: userId,
                provider: 'google',
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                expires_at: new Date(Date.now() + tokenData.expires_in * 1000),
                user: {
                    id: userData.id,
                    email: userData.email,
                    name: userData.name,
                    picture: userData.picture,
                },
                connected_at: new Date(),
                scopes: tokenData.scope?.split(' ') || [],
            };

            console.log(`[OAuth] Google connecté: ${userData.email}`);

            res.status(200).json({
                success: true,
                provider: 'google',
                user: userTokens.user,
                userId: userId,
                message: 'Connexion Google réussie',
            });

        } else if (provider === 'facebook') {
            // Échange du code contre des tokens Facebook
            const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: new URLSearchParams({
                    client_id: process.env.FACEBOOK_APP_ID,
                    client_secret: process.env.FACEBOOK_APP_SECRET,
                    code: code,
                    redirect_uri: redirectUri,
                }),
            });

            const tokenData = await tokenResponse.json();

            if (!tokenResponse.ok || tokenData.error) {
                console.error('[OAuth] Facebook token error:', tokenData);
                return res.status(400).json({
                    error: tokenData.error?.message || 'Erreur lors de l\'échange du token Facebook'
                });
            }

            // Récupération des informations utilisateur Facebook
            const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,email,picture&access_token=${tokenData.access_token}`);
            const userData = await userResponse.json();

            if (!userResponse.ok || userData.error) {
                console.error('[OAuth] Facebook user info error:', userData);
                return res.status(400).json({
                    error: userData.error?.message || 'Erreur lors de la récupération des informations utilisateur Facebook'
                });
            }

            // Récupération des pages Facebook (optionnel)
            let pagesData = null;
            try {
                const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${tokenData.access_token}`);
                const pages = await pagesResponse.json();
                if (pagesResponse.ok && !pages.error) {
                    pagesData = pages.data;
                }
            } catch (error) {
                console.log('[OAuth] Pas de pages Facebook disponibles:', error.message);
            }

            // Stocker les tokens (temporairement en mémoire - à remplacer par Supabase)
            const userId = userData.id;
            const userTokens = {
                userId: userId,
                provider: 'facebook',
                access_token: tokenData.access_token,
                expires_at: new Date(Date.now() + tokenData.expires_in * 1000),
                user: {
                    id: userData.id,
                    email: userData.email,
                    name: userData.name,
                    picture: userData.picture?.data?.url,
                },
                pages: pagesData,
                connected_at: new Date(),
            };

            console.log(`[OAuth] Facebook connecté: ${userData.name}`);

            res.status(200).json({
                success: true,
                provider: 'facebook',
                user: userTokens.user,
                userId: userId,
                pages: pagesData,
                message: 'Connexion Facebook réussie',
            });

        } else {
            res.status(400).json({ error: 'Provider non supporté' });
        }

    } catch (error) {
        console.error('[OAuth] Erreur exchange:', error.message);
        res.status(500).json({
            error: 'Erreur interne du serveur',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}