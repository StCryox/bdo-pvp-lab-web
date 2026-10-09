import { type CSSProperties, type ReactNode, useId, useState } from 'react'

interface TooltipProps {
  text: string
  label?: string
  children: ReactNode
}

const TOOLTIP_WIDTH = 256
const GAP = 4

// Fixed on the viewport: the skills table scrolls horizontally, which would clip
// a tooltip positioned inside it. Opens towards the larger side of the screen.
function placement(trigger: DOMRect): CSSProperties {
  const vertical =
    trigger.top > window.innerHeight / 2
      ? { bottom: window.innerHeight - trigger.top + GAP }
      : { top: trigger.bottom + GAP }
  const horizontal =
    trigger.right < TOOLTIP_WIDTH
      ? { left: trigger.left }
      : { right: window.innerWidth - trigger.right }
  return { position: 'fixed', width: TOOLTIP_WIDTH, ...vertical, ...horizontal }
}

export function Tooltip({ text, label, children }: TooltipProps) {
  const tooltipId = useId()
  const [style, setStyle] = useState<CSSProperties>()
  const open = (trigger: HTMLElement) => setStyle(placement(trigger.getBoundingClientRect()))
  const close = () => setStyle(undefined)

  return (
    <span
      tabIndex={0}
      aria-label={label}
      aria-describedby={tooltipId}
      onMouseEnter={(event) => open(event.currentTarget)}
      onMouseLeave={close}
      onFocus={(event) => open(event.currentTarget)}
      onBlur={close}
      onKeyDown={(event) => {
        if (event.key === 'Escape') close()
      }}
      className="inline-block cursor-help rounded focus-visible:outline-2 focus-visible:outline-sky-400"
    >
      {children}
      <span
        id={tooltipId}
        role="tooltip"
        hidden={style === undefined}
        style={style}
        className="z-50 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-left text-xs font-normal whitespace-normal text-zinc-100 shadow-lg"
      >
        {text}
      </span>
    </span>
  )
}
