import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, CheckCircle, Star, Clock, Shield, Zap, Heart, Users } from 'lucide-react';

const SetterFusionLanding = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // États OAuth
    const [connectedAccounts, setConnectedAccounts] = useState({
        google: false,
        facebook: false
    });
    const [isConnecting, setIsConnecting] = useState({
        google: false,
        facebook: false
    });

    // Écouter les messages de la popup OAuth
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.origin !== window.location.origin) return;

            const { type, provider, data, error } = event.data;

            if (type === 'OAUTH_SUCCESS') {
                setConnectedAccounts(prev => ({
                    ...prev,
                    [provider]: true
                }));
                setIsConnecting(prev => ({
                    ...prev,
                    [provider]: false
                }));
                console.log(`${provider} connecté avec succès:`, data);

                // Notification de succès
                alert(`${provider} connecté avec succès !`);
            } else if (type === 'OAUTH_ERROR') {
                setIsConnecting(prev => ({
                    ...prev,
                    [provider]: false
                }));
                console.error(`Erreur ${provider}:`, error);
                alert(`Erreur lors de la connexion ${provider}: ${error}`);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // Fonction pour initier la connexion OAuth
    const handleOAuthConnect = (provider) => {
        setIsConnecting(prev => ({
            ...prev,
            [provider]: true
        }));

        let authUrl = '';
        const redirectUri = `${window.location.origin}/oauth/callback/${provider}`;

        if (provider === 'google') {
            const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
            const scopes = [
                'openid',
                'email',
                'profile',
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/gmail.send',
                'https://www.googleapis.com/auth/calendar',
                'https://www.googleapis.com/auth/drive.readonly'
            ].join(' ');

            authUrl = `https://accounts.google.com/oauth2/auth?` +
                `client_id=${clientId}&` +
                `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                `scope=${encodeURIComponent(scopes)}&` +
                `response_type=code&` +
                `access_type=offline&` +
                `prompt=consent`;

        } else if (provider === 'facebook') {
            const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
            const scopes = [
                'email',
                'pages_manage_posts',
                'pages_read_engagement',
                'business_management',
                'instagram_basic',
                'instagram_manage_comments'
            ].join(',');

            authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
                `client_id=${appId}&` +
                `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                `scope=${encodeURIComponent(scopes)}&` +
                `response_type=code&` +
                `state=security_token`;
        }

        // Ouvrir la popup OAuth
        const popup = window.open(
            authUrl,
            `${provider}_oauth`,
            'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Vérifier si la popup est fermée manuellement
        const checkClosed = setInterval(() => {
            if (popup.closed) {
                clearInterval(checkClosed);
                setIsConnecting(prev => ({
                    ...prev,
                    [provider]: false
                }));
            }
        }, 1000);
    };

    // Components
    const GlassCard = ({ children, className = "", delay = 0 }) => (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay }}
            className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl hover:bg-white/10 transition-all duration-500 ${className}`}
        >
            {children}
        </motion.div>
    );

    const LiquidButton = ({ children, onClick, variant = "primary", size = "normal" }) => {
        const variants = {
            primary: "bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 hover:from-purple-500 hover:via-blue-500 hover:to-pink-500",
            secondary: "backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20"
        };

        const sizes = {
            normal: "px-8 py-4 text-base",
            large: "px-12 py-6 text-lg"
        };

        return (
            <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(139, 92, 246, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={onClick}
                className={`relative ${sizes[size]} rounded-2xl font-semibold text-white transition-all duration-300 overflow-hidden ${variants[variant]} animate-glow`}
            >
                <span className="relative z-10">{children}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000" />
            </motion.button>
        );
    };

    // Section OAuth
    const OAuthSection = () => (
        <section className="py-20 px-6 relative">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-5xl font-bold mb-6">
                        <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            Connectez vos comptes
                        </span>
                        <br />
                        <span className="text-white">en toute sécurité</span>
                    </h2>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                        Autorisez notre assistant IA à agir en votre nom de manière respectueuse et professionnelle.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Google OAuth */}
                    <GlassCard className="border-blue-500/30 hover:border-blue-400/50">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center">
                                <span className="text-2xl">🔵</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                    Google Workspace
                                </h3>
                                <p className="text-blue-300 text-sm">Gmail, Calendar, Drive</p>
                            </div>
                            {connectedAccounts.google && (
                                <CheckCircle className="w-8 h-8 text-green-400" />
                            )}
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                <CheckCircle className="w-4 h-4 text-blue-400" />
                                <span>Lecture et envoi d'emails</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                <CheckCircle className="w-4 h-4 text-blue-400" />
                                <span>Gestion du calendrier</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                <CheckCircle className="w-4 h-4 text-blue-400" />
                                <span>Accès aux documents Drive</span>
                            </div>
                        </div>

                        <button
                            onClick={() => handleOAuthConnect('google')}
                            disabled={isConnecting.google || connectedAccounts.google}
                            className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
                                connectedAccounts.google
                                    ? 'bg-green-600 text-white cursor-not-allowed'
                                    : isConnecting.google
                                        ? 'bg-blue-600/50 text-white cursor-wait'
                                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                            }`}
                        >
                            {connectedAccounts.google ? (
                                <span className="flex items-center justify-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    Connecté à Google
                                </span>
                            ) : isConnecting.google ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                                    Connexion en cours...
                                </span>
                            ) : (
                                'Connecter Google'
                            )}
                        </button>
                    </GlassCard>

                    {/* Facebook OAuth */}
                    <GlassCard className="border-pink-500/30 hover:border-pink-400/50">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-pink-600 via-purple-600 to-orange-600 rounded-2xl flex items-center justify-center">
                                <span className="text-2xl">📘</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                                    Facebook Business
                                </h3>
                                <p className="text-pink-300 text-sm">Pages + Instagram</p>
                            </div>
                            {connectedAccounts.facebook && (
                                <CheckCircle className="w-8 h-8 text-green-400" />
                            )}
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                <CheckCircle className="w-4 h-4 text-pink-400" />
                                <span>Publication sur les pages</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                <CheckCircle className="w-4 h-4 text-pink-400" />
                                <span>Gestion des commentaires</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                <CheckCircle className="w-4 h-4 text-pink-400" />
                                <span>Accès Instagram Business</span>
                            </div>
                        </div>

                        <button
                            onClick={() => handleOAuthConnect('facebook')}
                            disabled={isConnecting.facebook || connectedAccounts.facebook}
                            className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
                                connectedAccounts.facebook
                                    ? 'bg-green-600 text-white cursor-not-allowed'
                                    : isConnecting.facebook
                                        ? 'bg-pink-600/50 text-white cursor-wait'
                                        : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white'
                            }`}
                        >
                            {connectedAccounts.facebook ? (
                                <span className="flex items-center justify-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    Connecté à Facebook
                                </span>
                            ) : isConnecting.facebook ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                                    Connexion en cours...
                                </span>
                            ) : (
                                'Connecter Facebook'
                            )}
                        </button>
                    </GlassCard>
                </div>

                {(connectedAccounts.google || connectedAccounts.facebook) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mt-8"
                    >
                        <div className="inline-block bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
                            <p className="text-green-400 font-semibold">
                                🎉 Parfait ! Vos comptes sont connectés. Notre assistant IA peut maintenant vous aider.
                            </p>
                        </div>
                        <br />
                        <LiquidButton onClick={() => setIsModalOpen(true)}>
                            Continuer vers l'étape suivante
                        </LiquidButton>
                    </motion.div>
                )}
            </div>
        </section>
    );

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden relative">
            {/* Fixed background */}
            <div className="fixed inset-0">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: `url('/Fluid Wallpaper  · 01 · Normal.png')`,
                    }}
                />
                <div className="absolute inset-0 bg-black/50" />
            </div>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center px-6">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1 }}
                        className="space-y-8"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="backdrop-blur-sm bg-blue-500/10 border border-blue-500/20 rounded-full px-6 py-2 inline-block"
                        >
                            <span className="text-blue-300 text-sm font-medium">Développé par et pour les professionnels de l'accompagnement</span>
                        </motion.div>

                        <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                            <span className="text-white">Libérez votre temps pour</span>
                            <br />
                            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 bg-clip-text text-transparent">
                                ce qui compte vraiment
                            </span>
                        </h1>

                        <p className="text-xl text-gray-300 leading-relaxed max-w-2xl">
                            Notre assistant IA s'occupe de la prospection et de la prise de rendez-vous,
                            pendant que vous vous concentrez sur votre passion : accompagner vos clients.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <LiquidButton onClick={() => setIsModalOpen(true)}>
                                Découvrir comment nous pouvons vous aider
                            </LiquidButton>
                            <LiquidButton variant="secondary">
                                En savoir plus sur notre approche
                            </LiquidButton>
                        </div>

                        <div className="text-sm text-gray-400">
                            Échange gratuit de 30 minutes pour comprendre vos besoins
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="relative flex justify-center"
                    >
                        <motion.div
                            animate={{
                                y: [0, -20, 0],
                                scale: [1, 1.05, 1],
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="relative"
                        >
                            <img
                                src="../../public/Adobe Express - file.png"
                                alt="Assistant IA Bienveillant"
                                className="w-96 h-96 lg:w-[800px] lg:h-[800px] object-contain drop-shadow-2xl"
                                style={{
                                    filter: 'drop-shadow(0 20px 40px rgba(139, 92, 246, 0.3))'
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-blue-500/30 to-pink-500/20 rounded-full blur-3xl scale-130 -z-10" />
                        </motion.div>
                    </motion.div>
                </div>

                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
                >
                    <ChevronDown className="w-8 h-8 text-purple-400" />
                </motion.div>
            </section>

            {/* Understanding Section */}
            <section className="py-20 px-6 relative">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-5xl font-bold mb-6">
                            <span className="text-white">Nous comprenons vos</span>
                            <br />
                            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                défis quotidiens
                            </span>
                        </h2>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                            En tant que professionnels de l'accompagnement, vous jonglez entre votre passion pour aider
                            et les réalités administratives de votre activité.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Clock className="w-8 h-8 text-blue-400" />,
                                title: "Temps limité",
                                description: "Vous aimeriez passer plus de temps avec vos clients et moins sur les tâches administratives"
                            },
                            {
                                icon: <Users className="w-8 h-8 text-green-400" />,
                                title: "Prospection délicate",
                                description: "Vous cherchez des moyens respectueux d'entrer en contact avec de nouveaux clients potentiels"
                            },
                            {
                                icon: <Heart className="w-8 h-8 text-purple-400" />,
                                title: "Équilibre personnel",
                                description: "Vous souhaitez développer votre activité sans sacrifier votre bien-être personnel"
                            }
                        ].map((challenge, index) => (
                            <GlassCard key={index} delay={index * 0.2} className="text-center hover:scale-105 transition-transform duration-300">
                                <div className="flex justify-center mb-4">{challenge.icon}</div>
                                <h3 className="text-xl font-bold text-white mb-3">{challenge.title}</h3>
                                <p className="text-gray-300">{challenge.description}</p>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* Section OAuth - NOUVELLE SECTION */}
            <OAuthSection />

            {/* Solution Section */}
            <section className="py-20 px-6 relative">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-5xl font-bold mb-6">
                            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                                Notre vision
                            </span>
                            <br />
                            <span className="text-white">de l'automatisation éthique</span>
                        </h2>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                            Nous développons des outils qui amplifient votre expertise humaine sans jamais la remplacer.
                            L'IA s'occupe des tâches répétitives, vous gardez l'essentiel : la relation humaine.
                        </p>
                    </motion.div>

                    <div className="grid lg:grid-cols-2 gap-8 mb-12">
                        <GlassCard className="border-blue-500/30 hover:border-blue-400/50">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center">
                                    <span className="text-2xl">🤝</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                        Assistant Facebook
                                    </h3>
                                    <p className="text-blue-300 text-sm">Interactions authentiques</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {[
                                    "Engage des conversations naturelles dans vos communautés professionnelles",
                                    "Pose des questions ouvertes pour comprendre les besoins réels",
                                    "Identifie les personnes qui pourraient bénéficier de votre accompagnement",
                                    "Propose vos services de manière délicate et non intrusive"
                                ].map((feature, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                                        <span className="text-gray-300">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>

                        <GlassCard className="border-pink-500/30 hover:border-pink-400/50">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-gradient-to-br from-pink-600 via-purple-600 to-orange-600 rounded-2xl flex items-center justify-center">
                                    <span className="text-2xl">💬</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                                        Assistant Instagram
                                    </h3>
                                    <p className="text-pink-300 text-sm">Approche empathique et personnalisée</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {[
                                    "Partage du contenu inspirant en lien avec vos valeurs",
                                    "Répond aux commentaires avec empathie et professionnalisme",
                                    "Initie des conversations privées respectueuses et utiles",
                                    "Guide naturellement vers une première consultation"
                                ].map((feature, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-pink-400 flex-shrink-0 mt-1" />
                                        <span className="text-gray-300">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="text-center"
                    >
                        <GlassCard className="inline-block border-green-500/30 bg-gradient-to-r from-green-500/10 to-blue-500/10">
                            <div className="flex items-center gap-3 mb-3">
                                <Shield className="w-6 h-6 text-green-400" />
                                <span className="text-lg font-bold text-green-400">Conformité et Éthique</span>
                                <Shield className="w-6 h-6 text-green-400" />
                            </div>
                            <p className="text-gray-300">
                                Tous nos assistants IA respectent les codes de déontologie professionnels et
                                les réglementations de protection des données.
                            </p>
                        </GlassCard>
                    </motion.div>
                </div>
            </section>

            {/* Process Section */}
            <section className="py-32 px-6 relative">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-20"
                    >
                        <h2 className="text-6xl font-bold mb-6">
                            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                Comment nous travaillons
                            </span>
                            <br />
                            <span className="text-white">ensemble</span>
                        </h2>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                            Notre approche est basée sur l'écoute, la compréhension de vos besoins spécifiques
                            et le respect de votre façon de travailler.
                        </p>
                    </motion.div>

                    <div className="grid lg:grid-cols-4 gap-8">
                        {[
                            {
                                step: "01",
                                title: "Écoute et compréhension",
                                description: "Nous prenons le temps de comprendre votre pratique, vos valeurs et vos objectifs",
                                icon: "👂",
                                color: "from-blue-500 to-cyan-500"
                            },
                            {
                                step: "02",
                                title: "Conception sur mesure",
                                description: "Nous adaptons notre assistant IA à votre style et à votre approche professionnelle",
                                icon: "🎨",
                                color: "from-purple-500 to-pink-500"
                            },
                            {
                                step: "03",
                                title: "Test et ajustement",
                                description: "Nous testons ensemble et affinons jusqu'à ce que tout corresponde à vos attentes",
                                icon: "🔧",
                                color: "from-orange-500 to-red-500"
                            },
                            {
                                step: "04",
                                title: "Accompagnement continu",
                                description: "Nous restons à vos côtés pour optimiser et faire évoluer vos outils",
                                icon: "🤝",
                                color: "from-green-500 to-emerald-500"
                            }
                        ].map((process, index) => (
                            <GlassCard key={index} delay={index * 0.2} className="text-center relative overflow-hidden group hover:scale-105 transition-all duration-500">
                                <div className="relative z-10">
                                    <div className="text-6xl mb-6">{process.icon}</div>
                                    <div className={`text-sm font-bold mb-2 bg-gradient-to-r ${process.color} bg-clip-text text-transparent`}>
                                        ÉTAPE {process.step}
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4 text-white">{process.title}</h3>
                                    <p className="text-gray-300 leading-relaxed">{process.description}</p>
                                </div>

                                <motion.div
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        opacity: [0.1, 0.3, 0.1]
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        delay: index * 0.5
                                    }}
                                    className={`absolute inset-0 bg-gradient-to-br ${process.color} opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500`}
                                />

                                {index < 3 && (
                                    <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-white/20 to-transparent" />
                                )}
                            </GlassCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-20 px-6 relative">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-5xl font-bold mb-6">
                            <span className="text-white">Nos valeurs</span>
                            <br />
                            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                                guident tout ce que nous faisons
                            </span>
                        </h2>
                    </motion.div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Heart className="w-12 h-12 text-red-400" />,
                                title: "Respect et Bienveillance",
                                description: "Chaque interaction doit être empreinte de respect mutuel et de bienveillance, que ce soit avec vous ou avec vos futurs clients."
                            },
                            {
                                icon: <Shield className="w-12 h-12 text-blue-400" />,
                                title: "Transparence Totale",
                                description: "Nous croyons en la transparence complète. Vous saurez toujours exactement comment nos outils fonctionnent et interagissent."
                            },
                            {
                                icon: <Star className="w-12 h-12 text-yellow-400" />,
                                title: "Excellence Humaine",
                                description: "Notre technologie existe pour amplifier votre excellence humaine, jamais pour s'y substituer. Vous restez au centre de votre pratique."
                            }
                        ].map((value, index) => (
                            <GlassCard key={index} delay={index * 0.2} className="text-center">
                                <div className="flex justify-center mb-6">{value.icon}</div>
                                <h3 className="text-2xl font-bold text-white mb-4">{value.title}</h3>
                                <p className="text-gray-300 leading-relaxed">{value.description}</p>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6 relative">
                <div className="max-w-4xl mx-auto text-center">
                    <GlassCard className="border-purple-500/30">
                        <h2 className="text-4xl font-bold mb-6">
                            <span className="text-white">Prêt à découvrir comment nous pouvons</span>
                            <br />
                            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                                vous accompagner dans votre développement ?
                            </span>
                        </h2>
                        <p className="text-xl text-gray-300 mb-8">
                            Échangeons simplement sur vos besoins et voyons ensemble si nos outils peuvent vous être utiles.
                            Aucune pression, juste une conversation bienveillante entre professionnels.
                        </p>

                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                            <div className="flex flex-col items-center gap-2">
                                <Clock className="w-8 h-8 text-blue-400" />
                                <span className="text-blue-400 font-semibold">30 minutes d'échange</span>
                                <span className="text-gray-400 text-sm">À votre rythme</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <Heart className="w-8 h-8 text-green-400" />
                                <span className="text-green-400 font-semibold">Sans engagement</span>
                                <span className="text-gray-400 text-sm">Juste pour apprendre</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <Shield className="w-8 h-8 text-purple-400" />
                                <span className="text-purple-400 font-semibold">Totalement confidentiel</span>
                                <span className="text-gray-400 text-sm">Vos informations restent privées</span>
                            </div>
                        </div>

                        <LiquidButton onClick={() => setIsModalOpen(true)} size="large">
                            Programmer un échange bienveillant
                        </LiquidButton>
                        <p className="text-sm text-gray-500 mt-4">
                            Nous respectons votre temps et ne vous contactons que si vous le souhaitez
                        </p>
                    </GlassCard>
                </div>
            </section>

            {/* Modal */}
            {isModalOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50"
                    onClick={() => setIsModalOpen(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            Prenons le temps d'échanger
                        </h3>
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-6">
                            <p className="text-blue-400 text-sm text-center">
                                Partagez-nous simplement vos coordonnées et nous organiserons un moment pour discuter
                            </p>
                        </div>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Votre prénom"
                                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                            />
                            <input
                                type="email"
                                placeholder="Votre email"
                                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                            />
                            <input
                                type="tel"
                                placeholder="Votre téléphone (optionnel)"
                                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                            />
                            <select className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:outline-none">
                                <option value="">Votre domaine d'activité</option>
                                <option value="coach-business">Coach en entreprise</option>
                                <option value="coach-vie">Coach de vie</option>
                                <option value="coach-sport">Coach sportif</option>
                                <option value="therapeute">Thérapeute</option>
                                <option value="consultant">Consultant</option>
                                <option value="autre">Autre</option>
                            </select>
                            <textarea
                                placeholder="En quelques mots, quel est votre principal défi actuel ? (optionnel)"
                                rows={3}
                                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none"
                            />
                            <div className="flex items-start gap-3">
                                <input type="checkbox" className="mt-1" />
                                <span className="text-sm text-gray-400">
                                    J'accepte d'être contacté pour organiser notre échange. Je peux me désinscrire à tout moment.
                                </span>
                            </div>
                            <LiquidButton onClick={() => setIsModalOpen(false)}>
                                Envoyer ma demande
                            </LiquidButton>
                            <p className="text-xs text-gray-500 text-center">
                                Nous vous recontacterons sous 24h pour organiser notre échange
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
};

export default SetterFusionLanding;