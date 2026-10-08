import { QueryClient } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { createApiClient } from './api/client'
import { routes } from './router'

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App
      queryClient={new QueryClient()}
      apiClient={createApiClient(import.meta.env.VITE_API_BASE_URL)}
      router={createBrowserRouter(routes)}
    />
  </StrictMode>,
)
