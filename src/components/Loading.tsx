import { useEffect, useState } from 'react'

/** The hosted API sleeps when idle: a request slower than this is most likely a cold start. */
const COLD_START_HINT_DELAY_MS = 3000

export function Loading({ what }: { what: string }) {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), COLD_START_HINT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <p role="status" className="text-zinc-400">
      Loading {what}…{slow && ' Waking up the server, this can take up to a minute.'}
    </p>
  )
}
