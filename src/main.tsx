import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import './index.css'
import './styles/studio.css'
import './styles/workflows.css'
import './styles/public.css'
import './styles/experience.css'
import './styles/design-editor.css'
import './styles/studio-lab.css'

const firstTheme = window.localStorage.getItem('auraflow-theme-v3')
document.documentElement.dataset.theme = firstTheme === 'dark' ? 'dark' : 'light'
document.documentElement.style.colorScheme = firstTheme === 'dark' ? 'dark' : 'light'
import './styles/business.css'
import './styles/messaging.css'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
  },
})

createRoot(document.getElementById('root')!).render(
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: 'rgb(var(--aura-surface))',
                  border: '1px solid var(--line)',
                  color: 'rgb(var(--aura-ink))',
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </HelmetProvider>,
)
