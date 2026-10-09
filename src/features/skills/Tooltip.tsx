import { type ReactNode, useId, useState } from 'react'

interface TooltipProps {
  text: string
  label?: string
  children: ReactNode
}

export function Tooltip({ text, label, children }: TooltipProps) {
  const tooltipId = useId()
  const [open, setOpen] = useState(false)

  return (
    <span
      tabIndex={0}
      aria-label={label}
      aria-describedby={tooltipId}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false)
      }}
      className="relative inline-block cursor-help rounded focus-visible:outline-2 focus-visible:outline-sky-400"
    >
      {children}
      <span
        id={tooltipId}
        role="tooltip"
        hidden={!open}
        className="absolute right-0 bottom-full z-10 mb-1 w-64 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-left text-xs font-normal whitespace-normal text-zinc-100 shadow-lg"
      >
        {text}
      </span>
    </span>
  )
}
