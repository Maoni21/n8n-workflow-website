// src/pages/FacebookCallback.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const FacebookCallback = () => {
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
                const errorReason = searchParams.get('error_reason');

                if (error) {
                    console.error('[FacebookCallback] OAuth Error:', error, errorDescription, errorReason);
                    setStatus('error');

                    let errorMessage = 'Erreur de connexion Facebook';
                    if (error === 'access_denied') {
                        errorMessage = 'Accès refusé. Vous avez annulé la connexion.';
                    } else if (errorDescription) {
                        errorMessage = errorDescription;
                    }

                    setMessage(errorMessage);

                    // Communiquer l'erreur au parent (popup)
                    if (window.opener && !window.opener.closed) {
                        try {
                            window.opener.postMessage({
                                type: 'OAUTH_ERROR',
                                provider: 'facebook',
                                error: error,
                                errorDescription: errorDescription,
                                errorReason: errorReason
                            }, 'https://www.smartflow.autos');

                            setTimeout(() => {
                                window.close();
                            }, 2000);
                        } catch (postMessageError) {
                            console.log('[FacebookCallback] PostMessage bloqué, redirection...', postMessageError);
                            setTimeout(() => {
                                window.location.href = `https://www.smartflow.autos/?error=oauth_failed&provider=facebook`;
                            }, 2000);
                        }
                    } else {
                        // Pas de popup, redirection directe
                        setTimeout(() => {
                            navigate('/?error=oauth_failed&provider=facebook');
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
                                provider: 'facebook',
                                error: 'no_code'
                            }, 'https://www.smartflow.autos');
                            setTimeout(() => window.close(), 2000);
                        } catch (postMessageError) {
                            setTimeout(() => {
                                window.location.href = 'https://www.smartflow.autos/?error=oauth_failed&provider=facebook';
                            }, 2000);
                        }
                    } else {
                        setTimeout(() => {
                            navigate('/?error=oauth_failed&provider=facebook');
                        }, 2000);
                    }
                    return;
                }

                setMessage('Échange du code d\'autorisation Facebook...');

                // Échanger le code contre des tokens
                const response = await fetch('/api/oauth/exchange', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        provider: 'facebook',
                        code: code,
                        redirectUri: `${window.location.origin}/oauth/callback/facebook`
                    }),
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    console.log('[FacebookCallback] Connexion Facebook réussie:', data.user.name);
                    setStatus('success');
                    setMessage(`Connexion réussie ! Bonjour ${data.user.name}`);

                    // Ajouter les pages Facebook si disponibles
                    if (data.pages && data.pages.length > 0) {
                        setMessage(`Connexion réussie ! ${data.pages.length} page(s) Facebook détectée(s)`);
                    }

                    // Communiquer le succès au parent
                    if (window.opener && !window.opener.closed) {
                        try {
                            window.opener.postMessage({
                                type: 'OAUTH_SUCCESS',
                                provider: 'facebook',
                                data: {
                                    user: data.user,
                                    userId: data.userId,
                                    provider: 'facebook',
                                    pages: data.pages || []
                                }
                            }, 'https://www.smartflow.autos');

                            setTimeout(() => {
                                window.close();
                            }, 1500);
                        } catch (postMessageError) {
                            console.log('[FacebookCallback] PostMessage bloqué, redirection...', postMessageError);
                            // Alternative: redirection avec paramètres
                            const params = new URLSearchParams({
                                oauth: 'success',
                                provider: 'facebook',
                                user: JSON.stringify(data.user),
                                pages: JSON.stringify(data.pages || [])
                            });
                            window.location.href = `https://www.smartflow.autos/?${params.toString()}`;
                        }
                    } else {
                        // Pas de popup, redirection directe avec succès
                        const params = new URLSearchParams({
                            success: 'facebook_connected',
                            user: JSON.stringify(data.user),
                            pages: JSON.stringify(data.pages || [])
                        });
                        navigate(`/?${params.toString()}`);
                    }
                } else {
                    throw new Error(data.error || 'Erreur lors de l\'échange OAuth Facebook');
                }

            } catch (error) {
                console.error('[FacebookCallback] Erreur:', error.message);
                setStatus('error');
                setMessage(`Erreur: ${error.message}`);

                // Communiquer l'erreur
                if (window.opener && !window.opener.closed) {
                    try {
                        window.opener.postMessage({
                            type: 'OAUTH_ERROR',
                            provider: 'facebook',
                            error: 'exchange_failed',
                            errorMessage: error.message
                        }, 'https://www.smartflow.autos');
                        setTimeout(() => window.close(), 3000);
                    } catch (postMessageError) {
                        setTimeout(() => {
                            window.location.href = 'https://www.smartflow.autos/?error=oauth_failed&provider=facebook';
                        }, 3000);
                    }
                } else {
                    setTimeout(() => {
                        navigate('/?error=oauth_failed&provider=facebook');
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
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">Connexion Facebook</h2>
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
                        Finalisation de la connexion avec Facebook...
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

                {/* Informations de debug en développement */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-6 p-3 bg-gray-100 rounded text-xs text-left">
                        <strong>Debug Info:</strong><br/>
                        Status: {status}<br/>
                        Has Opener: {window.opener ? 'Yes' : 'No'}<br/>
                        Current URL: {window.location.href}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FacebookCallback;