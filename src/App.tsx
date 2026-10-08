import { type QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type DataRouter, RouterProvider } from 'react-router'
import { ApiProvider } from './api/ApiProvider'
import type { ApiClient } from './api/client'

interface AppProps {
  queryClient: QueryClient
  apiClient: ApiClient
  router: DataRouter
}

export default function App({ queryClient, apiClient, router }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ApiProvider client={apiClient}>
        <RouterProvider router={router} />
      </ApiProvider>
    </QueryClientProvider>
  )
}
