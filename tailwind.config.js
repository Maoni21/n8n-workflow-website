/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'purple-glass': 'rgba(139, 92, 246, 0.1)',
        'magenta-glass': 'rgba(168, 85, 247, 0.15)',
        'blue-glass': 'rgba(59, 130, 246, 0.1)',
      },
      backgroundImage: {
        'fluid-gradient': 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 25%, #C026D3 50%, #3B82F6 75%, #FBBF24 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'morph': 'morph 8s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        morph: {
          '0%, 100%': { 'border-radius': '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { 'border-radius': '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },
        glow: {
          'from': { 'box-shadow': '0 0 20px rgba(139, 92, 246, 0.5)' },
          'to': { 'box-shadow': '0 0 30px rgba(168, 85, 247, 0.8), 0 0 40px rgba(192, 38, 211, 0.3)' },
        },
      },
    },
  },
  plugins: [],
}