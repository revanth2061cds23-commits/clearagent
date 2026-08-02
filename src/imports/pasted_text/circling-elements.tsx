# Circling Elements

> A component that creates a circling effect on its children.

## Table of Contents

- [Installation](#installation)
  - [Cli](#cli)
  - [Manual](#manual)
    - [circling-elements](#circling-elements)
  - [globals.css](#globalscss)
- [Usage](#usage)
- [Understanding the component](#understanding-the-component)
- [Examples](#examples)
  - [Easing & direction](#easing-direction)
- [Credits](#credits)
- [Props](#props)
- [Credits](#credits)

Example:

```tsx
import React from "react"
import Image from "next/image"
import { exampleImages } from "@/utils/demo-images"

import useScreenSize from "@/hooks/use-screen-size"
import CirclingElements from "@/components/fancy/blocks/circling-elements"

const CirclingElementsDemo: React.FC = () => {
  const screenSize = useScreenSize()

  return (
    <div className="w-dvw h-dvh bg-[#efefef] flex items-center justify-center">
      <CirclingElements
        radius={screenSize.lessThan(`md`) ? 80 : 120}
        duration={10}
        easing="linear"
        pauseOnHover={true}
      >
        {exampleImages.map((image, index) => (
          <div
            key={index}
            className="w-20 h-20 md:w-28 md:h-28 hover:scale-125 duration-200 ease-out cursor-pointer"
          >
            <Image src={image.url} fill alt="image" className="object-cover" />
          </div>
        ))}
      </CirclingElements>
    </div>
  )
}

export default CirclingElementsDemo

```

Inspiration from [Bakken & Bæck](https://www.instagram.com/p/DBG5fLdiN4Q/?img_index=1)

## Installation

### Cli

```bash
npx shadcn add @fancy/circling-elements
```

### Manual

Copy and paste the following code into your project:

#### circling-elements

```tsx
"use client"

import { Children } from "react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"

type CirclingElementsProps = {
  children: React.ReactNode
  radius?: number
  duration?: number // in seconds
  easing?: string
  direction?: "normal" | "reverse"
  className?: string
  pauseOnHover?: boolean
}

const CirclingElements: React.FC<CirclingElementsProps> = ({
  children,
  radius = 100,
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
              "transform-gpu animate-circling absolute -translate-x-1/2 -translate-y-1/2",
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

export default CirclingElements

```

Add the following animation and keyframes to your `globals.css` file:

### globals.css

```css
{
/* ... */
  @theme: {
    --animate-circling: circling;
    @keyframes circling {
      0% {
        transform: rotate(calc(var(--offset) * 1deg)) translate(calc(var(--radius) * 1px), 0) rotate(calc(var(--offset) * -1deg));
      }
      100% {
        transform: rotate(calc(360deg + (var(--offset) * 1deg))) translate(calc(var(--radius) * 1px), 0) rotate(calc(-360deg + (var(--offset) * -1deg)));
      }
    },
  },
};
```

## Usage

You only need to wrap your elements with the `CirclingElements` component, everything else is taken care of by the component itself.

## Understanding the component

Under the hood, the component wraps all the children in a `relative` container, then sets all children to `absolute` to allow the circling movement.

The animation is achieved through CSS keyframes that create a circular motion. At the start (0%), each element is rotated by its offset angle, translated outward by the radius, and counter-rotated to maintain orientation. At the end (100%), it completes a full 360-degree rotation while maintaining the same radius and orientation. The `--circling-direction` variable allows reversing the animation direction.

The keyframes use CSS calc() to dynamically compute the transforms based on the following variables:

- `--circling-offset` (element's starting angle)
- `--circling-radius` (circle size)
- `--circling-direction` (1 or -1 for direction)

## Examples

### Easing & direction

You can set custom easings and reverse direction for the animation, as you can see in this demo.

Example:

```tsx
import React from "react"
import Image from "next/image"
import { exampleImages } from "@/utils/demo-images"

import useScreenSize from "@/hooks/use-screen-size"
import CirclingElements from "@/components/fancy/blocks/circling-elements"

const CirclingElementsDemo: React.FC = () => {
  const screenSize = useScreenSize()

  return (
    <div className="relative w-dvw h-dvh bg-[#efefef] flex items-center justify-center">
      <CirclingElements
        radius={screenSize.lessThan(`md`) ? 100 : 180}
        duration={8}
        direction="reverse"
        easing="0.944, 0.008, 0.147, 1.002"
      >
        {[...exampleImages, ...exampleImages].map((image, index) => (
          <div
            key={index}
            className="w-20 h-20 md:w-28 md:h-28 absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-125 duration-200 ease-out"
          >
            <Image
              src={image.url}
              fill
              alt="image"
              className="object-cover shadow-2xl "
            />
          </div>
        ))}
      </CirclingElements>
    </div>
  )
}

export default CirclingElementsDemo

```

## Credits

Ported to Framer by [Achille Ernoult](https://x.com/achilleernlt)

## Props

| Prop | Type | Default | Description |
|----------|----------|----------|----------|
| children* | `ReactNode` | - | The elements to be circled |
| radius | `number` | `100` | The radius of the circle in pixels |
| duration | `number` | `10` | The duration of one complete rotation in seconds |
| easing | `string` | `linear` | The easing function for the animation. Refer to the official [mdn docs](https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function) for more details |
| direction | `"normal" | "reverse"` | `normal` | The direction of the animation. Set to `"reverse"` to reverse the animation |
| pauseOnHover | `boolean` | `false` | Pause the animation on hover |
| className | `string` | - | Additional CSS classes for the container |

## Credits

Inspiration for the demo from [Bakken & Bæck](https://www.instagram.com/p/DBG5fLdiN4Q/?img_index=1)

---

*This documentation is also available in [interactive format](https://fancycomponents.dev/docs/components/components/blocks/circling-elements).*