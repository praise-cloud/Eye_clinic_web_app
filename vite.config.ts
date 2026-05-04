import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Eye Clinic Management',
        short_name: 'EyeClinic',
        description: 'KORENE Eye Clinic Management System',
        theme_color: '#1D7FE8',
        background_color: '#F8FAFC',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Cache static assets with validation
            urlPattern: /\.(?:js|css|woff2|png|svg|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
              }
            }
          },
          {
            // Network-first for API calls with short cache
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60 // 5 minutes
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            // Network-only for auth endpoints (never cache)
            urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/v1\/.*/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'auth-cache',
              expiration: { maxEntries: 0, maxAgeSeconds: 0 }
            }
          },
          {
            // Cache-first for realtime connections
            urlPattern: /^https:\/\/.*\.supabase\.co\/realtime\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'realtime-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 2 * 60 // 2 minutes
              }
            }
          }
        ],
        // Add cleanup and background sync
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true
      }
    })
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          utils: ['date-fns', 'clsx', 'tailwind-merge']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  preview: {
    port: 4173,
    host: true
  }
    },)