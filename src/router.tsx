import type { RouteObject } from 'react-router'
import { Layout } from './components/Layout'
import { ClassesPage } from './features/classes/ClassesPage'
import { ClassSkillsPage } from './features/skills/ClassSkillsPage'
import { SkillDetailPage } from './features/skills/SkillDetailPage'
import { DataQualityPage } from './features/data-quality/DataQualityPage'
import { NotFoundPage } from './features/not-found/NotFoundPage'

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <ClassesPage /> },
      { path: 'classes/:classSlug', element: <ClassSkillsPage /> },
      { path: 'classes/:classSlug/skills/:skillId', element: <SkillDetailPage /> },
      { path: 'data-quality', element: <DataQualityPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
