import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './lib/theme'
import { createRouter } from './router'
import './styles/globals.css'

const queryClient = new QueryClient()
const router = createRouter()

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
            </QueryClientProvider>
        </ThemeProvider>
    </StrictMode>
)
