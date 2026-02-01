import tanstackRouter from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
    plugins: [
        tanstackRouter({
            routesDirectory: './app/routes',
            generatedRouteTree: './app/routeTree.gen.ts',
        }),
        react(),
        tsconfigPaths(),
    ],
    server: {
        port: 3000,
        proxy: {
            '/api': 'http://localhost:3001',
        },
    },
    build: {
        outDir: 'dist',
    },
})
