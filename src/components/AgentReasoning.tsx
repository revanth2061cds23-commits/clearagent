import React, { useState, useEffect } from "react"
import { AnimatePresence, motion } from "motion/react"

/*
  CSS Keyframes required for this component:
  Add this to your global CSS:

  @keyframes shineSweep {
    0%   { transform: translateX(-150%); }
    60%  { transform: translateX(250%); }
    100% { transform: translateX(250%); }
  }
*/

export interface AgentReasoningProps {
  lines?: string[]
}

const DEFAULT_LINES = [
  "Finding perfect flight options...",
  "Searching luxury resorts...",
  "Building your itinerary...",
]

export function AgentReasoning({ lines = DEFAULT_LINES }: AgentReasoningProps) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (idx >= lines.length - 1) return
    const t = setTimeout(() => setIdx((i) => i + 1), 1800)
    return () => clearTimeout(t)
  }, [idx, lines.length])

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex items-center justify-center w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border border-[var(--teal)]">
        <div
          className="absolute inset-0 z-0 bg-[var(--teal-soft)]"
          style={{
            backgroundImage:
              "linear-gradient(90deg, transparent, rgba(46,110,106,0.1), transparent)",
            animation: "shineSweep 2s infinite linear",
          }}
        />
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--teal)"
          strokeWidth="2.5"
          className="relative z-10"
        >
          <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />
        </svg>
      </div>

      <div className="relative h-[20px] overflow-hidden flex-1 min-w-[200px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 font-medium text-[13px] tracking-wide"
            style={{ color: "var(--teal)" }}
          >
            {lines[idx]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}