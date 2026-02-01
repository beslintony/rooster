import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './lib/theme'
import { I18nProvider } from './lib/i18n'
import { createRouter } from './router'
import './styles/globals.css'

const queryClient = new QueryClient()
const router = createRouter()

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <I18nProvider>
            <ThemeProvider>
                <QueryClientProvider client={queryClient}>
                    <RouterProvider router={router} />
                </QueryClientProvider>
            </ThemeProvider>
        </I18nProvider>
    </StrictMode>
)

