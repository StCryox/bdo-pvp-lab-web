import { useQuery } from '@tanstack/react-query'
import { NavLink, Outlet } from 'react-router'
import { useApiClient } from '../api/apiContext'
import { metaQuery } from '../api/queries'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-3 py-1.5 text-sm ${isActive ? 'bg-zinc-800 font-medium text-white' : 'text-zinc-400 hover:text-white'}`

function ExtractInfo() {
  const { data, error, isPending } = useQuery(metaQuery(useApiClient()))

  if (isPending) return <p className="text-sm text-zinc-500">Loading extract info…</p>
  if (error)
    return <p className="text-sm text-amber-400">Extract info unavailable: {error.message}</p>
  return (
    <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400">
      <div className="flex gap-1.5">
        <dt>Extract</dt>
        <dd className="font-mono text-zinc-200">{data.extract_id}</dd>
      </div>
      <div className="flex gap-1.5">
        <dt>Game builds</dt>
        <dd className="font-mono text-zinc-200">{data.game_builds.join(', ')}</dd>
      </div>
    </dl>
  )
}

export function Layout() {
  return (
    <>
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 p-4">
          <NavLink to="/" className="text-lg font-semibold text-white">
            BDO PvP Lab
          </NavLink>
          <nav aria-label="Main" className="flex gap-1">
            <NavLink to="/" end className={navLinkClass}>
              Classes
            </NavLink>
            <NavLink to="/data-quality" className={navLinkClass}>
              Data quality
            </NavLink>
          </nav>
          <div className="ml-auto">
            <ExtractInfo />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-6">
        <Outlet />
      </main>
    </>
  )
}
