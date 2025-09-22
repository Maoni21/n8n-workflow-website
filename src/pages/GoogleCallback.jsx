// src/pages/GoogleCallback.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const GoogleCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('Connexion en cours...');

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const code = searchParams.get('code');
                const error = searchParams.get('error');
                const errorDescription = searchParams.get('error_description');

                if (error) {
                    console.error('[GoogleCallback] OAuth Error:', error, errorDescription);
                    setStatus('error');
                    setMessage(`Erreur OAuth: ${errorDescription || error}`);

                    // Communiquer l'erreur au parent (popup)
                    if (window.opener && !window.opener.closed) {
                        try {
                            window.opener.postMessage({
                                type: 'OAUTH_ERROR',
                                provider: 'google',
                                error: error,
                                errorDescription: errorDescription
                            }, 'https://www.smartflow.autos');

                            setTimeout(() => {
                                window.close();
                            }, 2000);
                        } catch (postMessageError) {
                            console.log('[GoogleCallback] PostMessage bloqué, redirection...', postMessageError);
                            setTimeout(() => {
                                window.location.href = `https://www.smartflow.autos/?error=oauth_failed&provider=google`;
                            }, 2000);
                        }
                    } else {
                        // Pas de popup, redirection directe
                        setTimeout(() => {
                            navigate('/?error=oauth_failed&provider=google');
                        }, 2000);
                    }
                    return;
                }

                if (!code) {
                    setStatus('error');
                    setMessage('Code d\'autorisation manquant');

                    if (window.opener && !window.opener.closed) {
                        try {
                            window.opener.postMessage({
                                type: 'OAUTH_ERROR',
                                provider: 'google',
                                error: 'no_code'
                            }, 'https://www.smartflow.autos');
                            setTimeout(() => window.close(), 2000);
                        } catch (postMessageError) {
                            setTimeout(() => {
                                window.location.href = 'https://www.smartflow.autos/?error=oauth_failed&provider=google';
                            }, 2000);
                        }
                    } else {
                        setTimeout(() => {
                            navigate('/?error=oauth_failed&provider=google');
                        }, 2000);
                    }
                    return;
                }

                setMessage('Échange du code d\'autorisation...');

                // Échanger le code contre des tokens
                const response = await fetch('/api/oauth/exchange', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        provider: 'google',
                        code: code,
                        redirectUri: `${window.location.origin}/oauth/callback/google`
                    }),
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    console.log('[GoogleCallback] Connexion Google réussie:', data.user.email);
                    setStatus('success');
                    setMessage(`Connexion réussie ! Bonjour ${data.user.name}`);

                    // Communiquer le succès au parent
                    if (window.opener && !window.opener.closed) {
                        try {
                            window.opener.postMessage({
                                type: 'OAUTH_SUCCESS',
                                provider: 'google',
                                data: {
                                    user: data.user,
                                    userId: data.userId,
                                    provider: 'google'
                                }
                            }, 'https://www.smartflow.autos');

                            setTimeout(() => {
                                window.close();
                            }, 1500);
                        } catch (postMessageError) {
                            console.log('[GoogleCallback] PostMessage bloqué, redirection...', postMessageError);
                            // Alternative: redirection avec paramètres
                            const params = new URLSearchParams({
                                oauth: 'success',
                                provider: 'google',
                                user: JSON.stringify(data.user)
                            });
                            window.location.href = `https://www.smartflow.autos/?${params.toString()}`;
                        }
                    } else {
                        // Pas de popup, redirection directe avec succès
                        const params = new URLSearchParams({
                            success: 'google_connected',
                            user: JSON.stringify(data.user)
                        });
                        navigate(`/?${params.toString()}`);
                    }
                } else {
                    throw new Error(data.error || 'Erreur lors de l\'échange OAuth');
                }

            } catch (error) {
                console.error('[GoogleCallback] Erreur:', error.message);
                setStatus('error');
                setMessage(`Erreur: ${error.message}`);

                // Communiquer l'erreur
                if (window.opener && !window.opener.closed) {
                    try {
                        window.opener.postMessage({
                            type: 'OAUTH_ERROR',
                            provider: 'google',
                            error: 'exchange_failed',
                            errorMessage: error.message
                        }, 'https://www.smartflow.autos');
                        setTimeout(() => window.close(), 3000);
                    } catch (postMessageError) {
                        setTimeout(() => {
                            window.location.href = 'https://www.smartflow.autos/?error=oauth_failed&provider=google';
                        }, 3000);
                    }
                } else {
                    setTimeout(() => {
                        navigate('/?error=oauth_failed&provider=google');
                    }, 3000);
                }
            }
        };

        // Démarrer le processus de callback
        handleCallback();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                <div className="mb-6">
                    {status === 'loading' && (
                        <div className="text-blue-600">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">Connexion Google</h2>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="text-green-600">
                            <div className="text-6xl mb-4">✅</div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">Connexion Réussie !</h2>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-red-600">
                            <div className="text-6xl mb-4">❌</div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">Erreur de Connexion</h2>
                        </div>
                    )}
                </div>

                <p className="text-gray-600 mb-4">{message}</p>

                {status === 'loading' && (
                    <div className="text-sm text-gray-500">
                        Finalisation de la connexion avec Google...
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-sm text-gray-500">
                        Fermeture automatique dans quelques secondes...
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-3">
                        <div className="text-sm text-gray-500">
                            Redirection automatique dans quelques secondes...
                        </div>
                        <button
                            onClick={() => {
                                if (window.opener && !window.opener.closed) {
                                    window.close();
                                } else {
                                    navigate('/');
                                }
                            }}
                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                            Fermer
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GoogleCallback;