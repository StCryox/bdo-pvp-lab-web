import { type ReactNode, type SubmitEvent, useState } from 'react'
import { isValidLogin } from '../../api/credentials'

const LOGGED_IN_KEY = 'bdo-pvp-lab:logged-in'

const inputClass = 'w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1'

interface LoginGateProps {
  storage: Storage
  children: ReactNode
}

export function LoginGate({ storage, children }: LoginGateProps) {
  const [loggedIn, setLoggedIn] = useState(() => storage.getItem(LOGGED_IN_KEY) === 'true')
  const [failed, setFailed] = useState(false)

  if (loggedIn) return children

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (isValidLogin(String(form.get('login')), String(form.get('password')))) {
      storage.setItem(LOGGED_IN_KEY, 'true')
      setLoggedIn(true)
    } else {
      setFailed(true)
    }
  }

  return (
    <main className="mx-auto mt-24 max-w-xs p-6">
      <h1 className="mb-6 text-center text-lg font-semibold text-white">BDO PvP Lab</h1>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-400">Login</span>
          <input name="login" autoComplete="username" required className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-400">Password</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </label>
        {failed && (
          <p role="alert" className="text-sm text-red-300">
            Wrong login or password
          </p>
        )}
        <button
          type="submit"
          className="w-full rounded bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500"
        >
          Log in
        </button>
      </form>
    </main>
  )
}
