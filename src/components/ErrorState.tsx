import { ApiError } from '../api/client'

export function ErrorState({ error }: { error: Error }) {
  const detail = error instanceof ApiError ? error.problem.detail : undefined
  return (
    <div role="alert" className="rounded border border-red-800 bg-red-950/50 p-4">
      <p className="font-medium text-red-300">{error.message}</p>
      {detail && <p className="mt-1 text-sm text-red-200">{detail}</p>}
    </div>
  )
}
