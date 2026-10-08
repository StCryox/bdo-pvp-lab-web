import type { RouteObject } from 'react-router'
import { Layout } from './components/Layout'
import { NotFoundPage } from './features/not-found/NotFoundPage'

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [{ path: '*', element: <NotFoundPage /> }],
  },
]
