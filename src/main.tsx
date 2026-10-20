import { QueryClient } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { createApiClient } from './api/client'
import { retryNetworkErrors } from './api/retry'
import { LoginGate } from './features/login/LoginGate'
import { routes } from './router'

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <LoginGate storage={window.sessionStorage}>
      <App
        queryClient={
          new QueryClient({ defaultOptions: { queries: { retry: retryNetworkErrors } } })
        }
        apiClient={createApiClient(import.meta.env.VITE_API_BASE_URL)}
        router={createBrowserRouter(routes)}
      />
    </LoginGate>
  </StrictMode>,
)
