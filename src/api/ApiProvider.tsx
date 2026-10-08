import type { ReactNode } from 'react'
import { ApiContext } from './apiContext'
import type { ApiClient } from './client'

interface ApiProviderProps {
  client: ApiClient
  children: ReactNode
}

export function ApiProvider({ client, children }: ApiProviderProps) {
  return <ApiContext value={client}>{children}</ApiContext>
}
