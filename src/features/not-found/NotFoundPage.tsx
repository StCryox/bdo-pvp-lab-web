import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-zinc-400">This page does not exist.</p>
      <Link to="/" className="text-sky-400 underline hover:text-sky-300">
        Back to classes
      </Link>
    </section>
  )
}
