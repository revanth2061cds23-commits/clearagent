"use client"

import React, { Children } from "react"
import { motion } from "motion/react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type CirclingElementsProps = {
  children: React.ReactNode
  radius?: number
  duration?: number // in seconds
  easing?: string
  direction?: "normal" | "reverse"
  className?: string
  pauseOnHover?: boolean
}

export const CirclingElements: React.FC<CirclingElementsProps> = ({
  children,
  radius = 1,
  duration = 10,
  easing = "linear",
  direction = "normal",
  className,
  pauseOnHover = false,
}) => {
  return (
    <div className={cn("relative z-0 group/circling", className)}>
      {Children.map(children, (child, index) => {
        const offset = (index * 360) / Children.count(children)

        const animationProps = {
          "--circling-duration": duration,
          "--circling-radius": radius,
          "--circling-offset": offset,
          "--circling-direction": direction === "reverse" ? -1 : 1,
          animation: `circling ${duration}s ${easing} infinite`,
          animationName: "circling",
          animationDuration: `${duration}s`,
          animationTimingFunction: easing,
          animationIterationCount: "infinite",
        } as React.CSSProperties

        return (
          <motion.div
            key={index}
            style={animationProps}
            className={cn(
              "transform-gpu absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none",
              pauseOnHover &&
                "group-hover/circling:![animation-play-state:paused]"
            )}
          >
            {child}
          </motion.div>
        )
      })}
    </div>
  )
}
