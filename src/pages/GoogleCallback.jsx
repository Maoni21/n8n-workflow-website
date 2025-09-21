// src/pages/GoogleCallback.jsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const GoogleCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            const error = searchParams.get('error');

            if (error) {
                console.error('OAuth Error:', error);
                // Communiquer l'erreur au parent (popup)
                if (window.opener) {
                    window.opener.postMessage({
                        type: 'OAUTH_ERROR',
                        provider: 'google',
                        error: error
                    }, window.location.origin);
                    window.close();
                } else {
                    navigate('/?error=oauth_failed');
                }
                return;
            }

            if (code) {
                try {
                    // Échanger le code contre des tokens
                    const response = await fetch('/api/oauth/exchange', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            provider: 'google',
                            code: code,
                            redirectUri: `${window.location.origin}/oauth/callback/google`
                        }),
                    });

                    const data = await response.json();

                    if (response.ok) {
                        // Succès - communiquer au parent
                        if (window.opener) {
                            window.opener.postMessage({
                                type: 'OAUTH_SUCCESS',
                                provider: 'google',
                                data: data
                            }, window.location.origin);
                            window.close();
                        } else {
                            navigate('/?success=google_connected');
                        }
                    } else {
                        throw new Error(data.error || 'Exchange failed');
                    }
                } catch (error) {
                    console.error('Exchange error:', error);
                    if (window.opener) {
                        window.opener.postMessage({
                            type: 'OAUTH_ERROR',
                            provider: 'google',
                            error: error.message
                        }, window.location.origin);
                        window.close();
                    } else {
                        navigate('/?error=exchange_failed');
                    }
                }
            }
        };

        handleCallback();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Connexion à Google en cours...</p>
            </div>
        </div>
    );
};

export default GoogleCallback;