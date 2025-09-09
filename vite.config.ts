import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    base: '/',
    plugins: [react()],
    // SPA fallback for routing in preview mode
    preview: {
        port: 4173,
        strictPort: true,
    },
    build: {
        // Code splitting optimization
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom'],
                    'motion-vendor': ['framer-motion'],
                    'icons-vendor': ['lucide-react']
                }
            }
        },
        // Compression
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        }
    },
    // Performance optimizations
    optimizeDeps: {
        include: ['react', 'react-dom', 'framer-motion', 'lucide-react']
    }
}) 