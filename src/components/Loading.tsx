export function Loading({ what }: { what: string }) {
  return (
    <p role="status" className="text-zinc-400">
      Loading {what}…
    </p>
  )
}
