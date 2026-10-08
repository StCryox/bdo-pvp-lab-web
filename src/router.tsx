import type { RouteObject } from 'react-router'
import { Layout } from './components/Layout'
import { ClassesPage } from './features/classes/ClassesPage'
import { ClassSkillsPage } from './features/skills/ClassSkillsPage'
import { NotFoundPage } from './features/not-found/NotFoundPage'

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <ClassesPage /> },
      { path: 'classes/:classSlug', element: <ClassSkillsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
