/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
                  colors: {
        primary: {
          50: '#e6f7ff',
          100: '#b3ebff',
          200: '#80dfff',
          300: '#4dd3ff',
          400: '#1ac7ff',
          500: '#00c6fb',
          600: '#00a3d1',
          700: '#0080a7',
          800: '#005d7d',
          900: '#003a53',
        },
        secondary: {
          50: '#e6f3ff',
          100: '#b3ddff',
          200: '#80c7ff',
          300: '#4db1ff',
          400: '#1a9bff',
          500: '#056ccd',
          600: '#0459aa',
          700: '#034687',
          800: '#023364',
          900: '#012041',
        },
                dark: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                }
            },
            animation: {
                'gradient': 'gradient 15s ease infinite',
                'float': 'float 6s ease-in-out infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                gradient: {
                    '0%, 100%': {
                        'background-size': '200% 200%',
                        'background-position': 'left center'
                    },
                    '50%': {
                        'background-size': '200% 200%',
                        'background-position': 'right center'
                    },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                }
            }
        },
    },
    plugins: [],
} 