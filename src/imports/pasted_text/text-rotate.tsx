# Text Rotate

> A text component that switches the rendered text from a list.

## Table of Contents

- [Installation](#installation)
  - [Cli](#cli)
  - [Manual](#manual)
    - [text-rotate](#text-rotate)
- [Understanding the component](#understanding-the-component)
- [Examples](#examples)
  - [Custom animation variations](#custom-animation-variations)
  - [SplitBy variations](#splitby-variations)
  - [Stagger](#stagger)
  - [Manual control](#manual-control)
  - [Different animation per segment](#different-animation-per-segment)
- [Notes](#notes)
- [Props](#props)
  - [TextRotateProps](#textrotateprops)
  - [TextRotateRef](#textrotateref)

Example:

```tsx
"use client"

import { LayoutGroup, motion } from "motion/react"

import TextRotate from "@/components/fancy/text/text-rotate"

export default function Preview() {
  return (
    <div className="w-dvw h-dvh text-2xl sm:text-3xl md:text-5xl flex flex-row items-center justify-center font-overused-grotesk bg-white dark:text-muted text-foreground font-light overflow-hidden p-12 sm:p-20 md:p-24">
      <LayoutGroup>
        <motion.p className="flex whitespace-pre" layout>
          <motion.span
            className="pt-0.5 sm:pt-1 md:pt-2"
            layout
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
          >
            Make it{" "}
          </motion.span>
          <TextRotate
            texts={[
              "work!",
              "fancy ✽",
              "right",
              "fast",
              "fun",
              "rock",
              "🕶️🕶️🕶️",
            ]}
            mainClassName="text-white px-2 sm:px-2 md:px-3 bg-[#ff5941] overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg"
            staggerFrom={"last"}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-120%" }}
            staggerDuration={0.025}
            splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            rotationInterval={2000}
          />
        </motion.p>
      </LayoutGroup>
    </div>
  )
}

```

## Installation

### Cli

```bash
npx shadcn add @fancy/text-rotate
```

### Manual

#### text-rotate

```tsx
"use client"

import {
  ElementType,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react"
import {
  AnimatePresence,
  AnimatePresenceProps,
  motion,
  MotionProps,
  Transition,
} from "motion/react"

import { cn } from "@/lib/utils"

// handy function to split text into characters with support for unicode and emojis
const splitIntoCharacters = (text: string): string[] => {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" })
    return Array.from(segmenter.segment(text), ({ segment }) => segment)
  }
  // Fallback for browsers that don't support Intl.Segmenter
  return Array.from(text)
}

interface TextRotateProps {
  /**
   * Array of text strings to rotate through.
   * Required prop with no default value.
   */
  texts: string[]

  /**
   * render as HTML Tag
   */
  as?: ElementType

  /**
   * Time in milliseconds between text rotations.
   * @default 2000
   */
  rotationInterval?: number

  /**
   * Initial animation state or array of states.
   * @default { y: "100%", opacity: 0 }
   */
  initial?: MotionProps["initial"] | MotionProps["initial"][]

  /**
   * Animation state to animate to or array of states.
   * @default { y: 0, opacity: 1 }
   */
  animate?: MotionProps["animate"] | MotionProps["animate"][]

  /**
   * Animation state when exiting or array of states.
   * @default { y: "-120%", opacity: 0 }
   */
  exit?: MotionProps["exit"] | MotionProps["exit"][]

  /**
   * AnimatePresence mode
   * @default "wait"
   */
  animatePresenceMode?: AnimatePresenceProps["mode"]

  /**
   * Whether to run initial animation on first render.
   * @default false
   */
  animatePresenceInitial?: boolean

  /**
   * Duration of stagger delay between elements in seconds.
   * @default 0
   */
  staggerDuration?: number

  /**
   * Direction to stagger animations from.
   * @default "first"
   */
  staggerFrom?: "first" | "last" | "center" | number | "random"

  /**
   * Animation transition configuration.
   * @default { type: "spring", damping: 25, stiffness: 300 }
   */
  transition?: Transition

  /**
   * Whether to loop through texts continuously.
   * @default true
   */
  loop?: boolean

  /**
   * Whether to auto-rotate texts.
   * @default true
   */
  auto?: boolean

  /**
   * How to split the text for animation.
   * @default "characters"
   */
  splitBy?: "words" | "characters" | "lines" | string

  /**
   * Callback function triggered when rotating to next text.
   * @default undefined
   */
  onNext?: (index: number) => void

  /**
   * Class name for the main container element.
   * @default undefined
   */
  mainClassName?: string

  /**
   * Class name for the split level wrapper elements.
   * @default undefined
   */
  splitLevelClassName?: string

  /**
   * Class name for individual animated elements.
   * @default undefined
   */
  elementLevelClassName?: string
}

/**
 * Interface for the ref object exposed by TextRotate component.
 * Provides methods to control text rotation programmatically.
 * This allows external components to trigger text changes
 * without relying on the automatic rotation.
 */
export interface TextRotateRef {
  /**
   * Advance to next text in sequence.
   * If at the end, will loop to beginning if loop prop is true.
   */
  next: () => void

  /**
   * Go back to previous text in sequence.
   * If at the start, will loop to end if loop prop is true.
   */
  previous: () => void

  /**
   * Jump to specific text by index.
   * Will clamp index between 0 and texts.length - 1.
   */
  jumpTo: (index: number) => void

  /**
   * Reset back to first text.
   * Equivalent to jumpTo(0).
   */
  reset: () => void
}

/**
 * Internal interface for representing words when splitting text by characters.
 * Used to maintain proper word spacing and line breaks while allowing
 * character-by-character animation. This prevents words from breaking
 * across lines during animation.
 */
interface WordObject {
  /**
   * Array of individual characters in the word.
   * Uses Intl.Segmenter when available for proper Unicode handling.
   */
  characters: string[]

  /**
   * Whether this word needs a space after it.
   * True for all words except the last one in a sequence.
   */
  needsSpace: boolean
}

const TextRotate = forwardRef<TextRotateRef, TextRotateProps>(
  (
    {
      texts,
      as = "p",
      transition = { type: "spring", damping: 25, stiffness: 300 },
      initial = { y: "100%", opacity: 0 },
      animate = { y: 0, opacity: 1 },
      exit = { y: "-120%", opacity: 0 },
      animatePresenceMode = "wait",
      animatePresenceInitial = false,
      rotationInterval = 2000,
      staggerDuration = 0,
      staggerFrom = "first",
      loop = true,
      auto = true,
      splitBy = "characters",
      onNext,
      mainClassName,
      splitLevelClassName,
      elementLevelClassName,
      ...props
    },
    ref
  ) => {
    const [currentTextIndex, setCurrentTextIndex] = useState(0)

    // Splitting the text into animation segments
    const elements = useMemo(() => {
      const currentText = texts[currentTextIndex]
      if (splitBy === "characters") {
        const text = currentText.split(" ")
        return text.map((word, i) => ({
          characters: splitIntoCharacters(word),
          needsSpace: i !== text.length - 1,
        }))
      }
      return splitBy === "words"
        ? currentText.split(" ")
        : splitBy === "lines"
          ? currentText.split("\n")
          : currentText.split(splitBy)
    }, [texts, currentTextIndex, splitBy])

    // Helper function to calculate stagger delay for each text segment
    const getStaggerDelay = useCallback(
      (index: number, totalChars: number) => {
        const total = totalChars
        if (staggerFrom === "first") return index * staggerDuration
        if (staggerFrom === "last") return (total - 1 - index) * staggerDuration
        if (staggerFrom === "center") {
          const center = Math.floor(total / 2)
          return Math.abs(center - index) * staggerDuration
        }
        if (staggerFrom === "random") {
          const randomIndex = Math.floor(Math.random() * total)
          return Math.abs(randomIndex - index) * staggerDuration
        }
        return Math.abs(staggerFrom - index) * staggerDuration
      },
      [staggerFrom, staggerDuration]
    )

    // Helper function to handle index changes and trigger callback
    const handleIndexChange = useCallback(
      (newIndex: number) => {
        setCurrentTextIndex(newIndex)
        onNext?.(newIndex)
      },
      [onNext]
    )

    // Go to next text
    const next = useCallback(() => {
      const nextIndex =
        currentTextIndex === texts.length - 1
          ? loop
            ? 0
            : currentTextIndex
          : currentTextIndex + 1

      if (nextIndex !== currentTextIndex) {
        handleIndexChange(nextIndex)
      }
    }, [currentTextIndex, texts.length, loop, handleIndexChange])

    // Go back to previous text
    const previous = useCallback(() => {
      const prevIndex =
        currentTextIndex === 0
          ? loop
            ? texts.length - 1
            : currentTextIndex
          : currentTextIndex - 1

      if (prevIndex !== currentTextIndex) {
        handleIndexChange(prevIndex)
      }
    }, [currentTextIndex, texts.length, loop, handleIndexChange])

    // Jump to specific text by index
    const jumpTo = useCallback(
      (index: number) => {
        const validIndex = Math.max(0, Math.min(index, texts.length - 1))
        if (validIndex !== currentTextIndex) {
          handleIndexChange(validIndex)
        }
      },
      [texts.length, currentTextIndex, handleIndexChange]
    )

    // Reset back to first text
    const reset = useCallback(() => {
      if (currentTextIndex !== 0) {
        handleIndexChange(0)
      }
    }, [currentTextIndex, handleIndexChange])

    // Get animation props for each text segment. If array is provided, states will be mapped to text segments cyclically.
    const getAnimationProps = useCallback(
      (index: number) => {
        const getProp = (
          prop:
            | MotionProps["initial"]
            | MotionProps["initial"][]
            | MotionProps["animate"]
            | MotionProps["animate"][]
            | MotionProps["exit"]
            | MotionProps["exit"][]
        ) => {
          if (Array.isArray(prop)) {
            return prop[index % prop.length]
          }
          return prop
        }

        return {
          initial: getProp(initial) as MotionProps["initial"],
          animate: getProp(animate) as MotionProps["animate"],
          exit: getProp(exit) as MotionProps["exit"],
        }
      },
      [initial, animate, exit]
    )

    // Expose all navigation functions via ref
    useImperativeHandle(
      ref,
      () => ({
        next,
        previous,
        jumpTo,
        reset,
      }),
      [next, previous, jumpTo, reset]
    )

    // Auto-rotate text
    useEffect(() => {
      if (!auto) return
      const intervalId = setInterval(next, rotationInterval)
      return () => clearInterval(intervalId)
    }, [next, rotationInterval, auto])

    // Custom motion component to render the text as a custom HTML tag provided via prop
    const MotionComponent = useMemo(() => motion.create(as ?? "p"), [as])

    return (
      <MotionComponent
        className={cn("flex flex-wrap whitespace-pre-wrap", mainClassName)}
        transition={transition}
        layout
        {...props}
      >
        <span className="sr-only">{texts[currentTextIndex]}</span>

        <AnimatePresence
          mode={animatePresenceMode}
          initial={animatePresenceInitial}
        >
          <motion.span
            key={currentTextIndex}
            className={cn(
              "flex flex-wrap",
              splitBy === "lines" && "flex-col w-full"
            )}
            aria-hidden
            layout
          >
            {(splitBy === "characters"
              ? (elements as WordObject[])
              : (elements as string[]).map((el, i) => ({
                  characters: [el],
                  needsSpace: i !== elements.length - 1,
                }))
            ).map((wordObj, wordIndex, array) => {
              const previousCharsCount = array
                .slice(0, wordIndex)
                .reduce((sum, word) => sum + word.characters.length, 0)

              return (
                <span
                  key={wordIndex}
                  className={cn("inline-flex", splitLevelClassName)}
                >
                  {wordObj.characters.map((char, charIndex) => {
                    const totalIndex = previousCharsCount + charIndex
                    const animationProps = getAnimationProps(totalIndex)
                    return (
                      <span 
                      key={totalIndex}
                      className={cn(elementLevelClassName)}
                      >
                        <motion.span
                          {...animationProps}
                          key={charIndex}
                          transition={{
                            ...transition,
                            delay: getStaggerDelay(
                              previousCharsCount + charIndex,
                              array.reduce(
                                (sum, word) => sum + word.characters.length,
                                0
                              )
                            ),
                          }}
                          className={"inline-block"}
                        >
                          {char}
                        </motion.span>
                      </span>
                    )
                  })}
                  {wordObj.needsSpace && (
                    <span className="whitespace-pre"> </span>
                  )}
                </span>
              )
            })}
          </motion.span>
        </AnimatePresence>
      </MotionComponent>
    )
  }
)

TextRotate.displayName = "TextRotate"

export default TextRotate
```

## Understanding the component

1. For the animation, we switch the actual rendered text from the `texts` array. Either automatically, if the `auto` prop is set to `true`, or we can do it manually, by calling the `next()` or `previous()` methods exposed via a ref.

2. For animating out the previous text, and animating in the next, we use the `AnimatePresence` component from `motion/react`. The `initial`, `animate` and `exit` props can be used to define the three states of the text. Refer to the [motion documentation](https://motion.dev/docs/react/docs/react-animate-presence) for more details.

3. The current text is split into smaller pieces based on the `splitBy` prop, which will determine how the text will be animated:

   - `words`: Splits into individual words (e.g., "Hello world" → ["Hello", "world"])
   - `characters`: Splits into individual characters (e.g., "Hi" → ["H", "i"])
   - `lines`: Splits by newline characters (`\n`)
   - `string`: Splits by any custom string delimiter

4. Each piece of text is wrapped in two `<span>` elements: An outer `<span>` that acts as a container for a word or line of text and an inner `<span>` that holds the actual text. There are two reasons for this:

    1. When dealing with multi-line text, each line maintains its own reveal animation starting point. This means if you have text that spans multiple lines, each line will animate independently from its own baseline, rather than all elements animating from a single point (like the bottom of the entire paragraph).
    2. When using `characters` mode, characters from the same word stay together in a word container. This prevents unwanted line breaks in the middle of words - if a word needs to wrap to the next line, it will wrap as a complete unit rather than having some characters on one line and others on the next line. This maintains proper text flow and readability while still allowing character-by-character animation within each word.

## Examples

### Custom animation variations

You can customize the `animate`, `exit`, and `initial` props to create custom animation variations. For example, you can use the `filter` property to blur the text during the animation.

Example:

```tsx
"use client"

import TextRotate from "@/components/fancy/text/text-rotate"

export default function Preview() {
  return (
    <div className="w-dvw h-dvh text-2xl sm:text-3xl md:text-5xl flex flex-col items-center justify-center font-cotham text font-normal overflow-hidden p-12 gap-12 bg-white text-black">
      <TextRotate
        texts={[
          "The problem isn't how to make the world more technological. It's about how to make the world more humane again.",
          "When you use other people's software you live in somebody else's dream.",
        ]}
        mainClassName=" md:leading-10 flex whitespace-pre text-lg sm:text-xl md:text-5xl max-w-xl text-center"
        staggerFrom={"random"}
        animatePresenceMode="wait"
        splitBy="characters"
        initial={[
          { filter: "blur(20px)", opacity: 0 },
        ]}
        animate={[
          { filter: "blur(0px)", opacity: 1 },
        ]}
        exit={[
          { filter: "blur(20px)", opacity: 0 },
        ]}
        loop
        staggerDuration={0.01}
        splitLevelClassName=""
        elementLevelClassName="md:py-[4px]"
        transition={{ ease: [0.909, 0.151, 0.153, 0.86], duration: 1 }}
        rotationInterval={4000}
      />
    </div>
  )
}

```

### SplitBy variations

With the `splitBy` prop, you can control how the text is split into smaller pieces. It can be either `words`, `characters`, `lines`, or a custom `string` delimiter. In case of `lines`, you are responsible for adding the `\n` delimiter yourself.

The following example demonstrates the `words` (the quote) and `characters` (the author) mode. It should respect multiline texts.

Example:

```tsx
"use client"

import { LayoutGroup, motion } from "motion/react"

import TextRotate from "@/components/fancy/text/text-rotate"

export default function Preview() {
  return (
    <div className="w-dvw h-dvh flex flex-col items-start font-overused-grotesk  font-light overflow-hidden p-8 pt-20 sm:pt-16 sm:p-16 md:p-20 bg-white text-base sm:text-xl md:text-2xl leading-tight dark:text-muted text-foreground">
      <LayoutGroup>
        <TextRotate
          texts={[
            "A typeface family is an accomplishment on the order of a novel, a feature film screenplay, a computer language design and implementation, a major musical composition, a monumental sculpture, or other artistic or technical endeavors that consume a year or more of intensive creative effort.",
            "Typography is two-dimensional architecture, based on experience and imagination, and guided by rules and readability. And this is the purpose of typography: The arrangement of design elements within a given structure should allow the reader to easily focus on the message, without slowing down the speed of his reading.",
          ]}
          staggerFrom={"first"}
          staggerDuration={0.01}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          rotationInterval={4000}
          splitBy="words"
        />
        <motion.div
          className="bg-[#ff5941] w-2 h-2 sm:w-3 sm:h-3 rounded-full my-6"
          layout
        />
        <TextRotate
          texts={["Charles Bigelow", "Hermann Zapf"]}
          staggerFrom={"first"}
          staggerDuration={0.025}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          rotationInterval={4000}
          splitBy="characters"
        />
      </LayoutGroup>
    </div>
  )
}

```

### Stagger

With the `staggerFrom` prop, you can control the index of the letter/word/line where the stagger animation starts. Possible values are `"first"`, `"center"`, `"last"`, `"random"`, or a number.

Example:

```tsx
"use client"

import { exampleImages } from "@/utils/demo-images"

import TextRotate from "@/components/fancy/text/text-rotate"

export default function Preview() {
  return (
    <div className="w-dvw h-dvh text-base sm:text-xl md:text-2xl flex flex-row items-center justify-center font-overused-grotesk bg-white font-light overflow-hidden p-6 uppercase relative text-[#ff5941]">
      <div className="absolute inset-0 w-full h-full blur-3xl">
        <img
          src={exampleImages[0].url}
          alt="city"
          className="w-full h-full object-cover overflow-hidden"
        />
      </div>
      <div className="absolute inset-0 flex justify-center items-center">
        <div className=" grid grid-cols-2 gap-y-12 gap-x-8 w-full text-red font-bold">
          <TextRotate
            texts={["New York", "Los Angeles", "Chicago", "Miami"]}
            mainClassName="justify-center"
            staggerFrom="first"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-120%" }}
            staggerDuration={0.04}
            splitLevelClassName="overflow-hidden"
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            rotationInterval={2500}
          />

          <TextRotate
            texts={["São Paulo", "Rio de Janeiro", "Salvador", "Brasília"]}
            mainClassName="justify-center"
            staggerFrom="center"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-120%" }}
            staggerDuration={0.04}
            splitLevelClassName="overflow-hidden"
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            rotationInterval={2500}
          />

          <TextRotate
            texts={["Tokyo", "Osaka", "Kyoto", "Sapporo"]}
            mainClassName="justify-center"
            staggerFrom="last"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-120%" }}
            staggerDuration={0.04}
            splitLevelClassName="overflow-hidden"
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            rotationInterval={2500}
          />

          <TextRotate
            texts={["Mumbai", "Delhi", "Bangalore", "Chennai"]}
            mainClassName="justify-center"
            staggerFrom="random"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-120%" }}
            staggerDuration={0.04}
            splitLevelClassName="overflow-hidden"
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            rotationInterval={2500}
          />
        </div>
      </div>
    </div>
  )
}

```

### Manual control

If the `auto` prop is set to `false`, you can manually control the animation by calling the `next()` or `previous()` methods exposed via a ref.

Example:

```tsx
"use client"

import { useRef } from "react"
import { MoveLeft, MoveRight } from "lucide-react"
import { LayoutGroup, motion } from "motion/react"

import TextRotate, { TextRotateRef } from "@/components/fancy/text/text-rotate"

export default function Preview() {
  const textRotateRef = useRef<TextRotateRef>(null)

  return (
    <div className="w-dvw h-dvh flex flex-col items-center justify-center font-overused-grotesk bg-white text-foreground dark:text-muted font-light overflow-hidden p-8 sm:p-20 md:p-24 gap-8">
      <LayoutGroup>
        <motion.p className="" layout>
          <TextRotate
            ref={textRotateRef}
            texts={[
              "this is the first text",
              "this is the 2nd",
              "we're at third!",
              "4th! keep going",
              "5th.",
              "this is the end.",
            ]}
            mainClassName="text-lg sm:text-2xl md:text-4xl justify-center flex"
            staggerFrom={"first"}
            animatePresenceMode="sync"
            loop={true}
            auto={false}
            staggerDuration={0.0}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            rotationInterval={3000}
            splitBy="words"
          />
        </motion.p>
      </LayoutGroup>

      <div className="flex gap-4">
        <button
          onClick={() => textRotateRef.current?.previous()}
          className="px-2 py-2 text-foreground dark:text-muted"
        >
          <MoveLeft className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
        <button
          onClick={() => textRotateRef.current?.next()}
          className="px-2 py-2 text-foreground dark:text-muted"
        >
          <MoveRight className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  )
}

```

This can be handy for a lot of use cases, eg. a scroll-triggered animation.

Example:

```tsx
"use client"

import { useEffect, useRef } from "react"
import { exampleImages } from "@/utils/demo-images"
import { useInView } from "motion/react"

import TextRotate, { TextRotateRef } from "@/components/fancy/text/text-rotate"

function Item({
  index,
  image,
  link,
  onInView,
}: {
  index: number
  image: string
  link: string
  onInView: (inView: boolean) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, {
    margin: "-45% 0px -45% 0px",
  })

  useEffect(() => {
    onInView(isInView)
  }, [isInView, onInView])

  return (
    <section
      ref={ref}
      key={index + 1}
      className="h-full w-1/2 flex justify-center items-center snap-center"
    >
      <div className="w-16 h-16 sm:w-36 sm:h-36 md:w-40 md:h-40">
        <a href={link} target="_blank" rel="noreferrer">
          <img
            src={image}
            alt={`Example ${index + 2}`}
            className="w-full h-full object-cover"
          />
        </a>
      </div>
    </section>
  )
}

export default function Preview() {
  const textRotateRef = useRef<TextRotateRef>(null)

  const handleInView = (index: number, inView: boolean) => {
    console.log(index, inView)
    if (inView && textRotateRef.current) {
      textRotateRef.current.jumpTo(index)
    }
  }

  return (
    <div className="w-dvw h-dvh overflow-auto absolute snap-y snap-mandatory">
      <div className="sticky inset-0 h-full w-full flex items-center justify-end bg-white dark:text-muted text-foreground">
        <div className="w-2/3">
          <TextRotate
            ref={textRotateRef}
            texts={[...exampleImages.map((image) => image.author)]}
            mainClassName="text-sm sm:text-3xl md:text-4xl w-full justify-center flex pt-2"
            splitLevelClassName="overflow-hidden pb-2"
            staggerFrom={"first"}
            animatePresenceMode="wait"
            loop={false}
            auto={false}
            staggerDuration={0.005}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ type: "spring", duration: 0.6, bounce: 0 }}
          />
        </div>
      </div>
      <div className="absolute inset-0">
        {exampleImages.slice(1).map((image, index) => (
          <Item
            key={index}
            index={index}
            image={image.url}
            link={image.link}
            onInView={(inView) => handleInView(index, inView)}
          />
        ))}
      </div>
    </div>
  )
}

```

### Different animation per segment

For the `animate`, `exit`, and `initial` props, you can either pass one single object, or an array of objects. This allows you to map different animations to each segment of the text. If there are more segments than animations, we will cycle through the animations.

Example:

```tsx
"use client"

import TextRotate from "@/components/fancy/text/text-rotate"

export default function Preview() {
  return (
    <div className="w-dvw h-dvh text-2xl sm:text-3xl md:text-5xl flex flex-col items-center justify-center font-cotham text font-normal overflow-hidden p-12 gap-12 bg-white text-black">
      <TextRotate
        texts={[
          "The problem isn't how to make the world more technological. It's about how to make the world more humane again.",
          "The problem isn't how to make the world more technological. It's about how to make the world more humane again.",
        ]}
        mainClassName="overflow-hidden md:leading-10 flex whitespace-pre text-lg sm:text-xl md:text-5xl max-w-xl text-center"
        staggerFrom={"random"}
        animatePresenceMode="wait"
        splitBy="characters"
        initial={[{ x: "120%" }, { y: "120%" }, { x: "-120%" }, { y: "-120%" }]}
        animate={[{ x: 0 }, { y: 0 }, { x: 0 }, { y: 0 }]}
        exit={[{ x: "-120%" }, { y: "-120%" }, { x: "120%" }, { y: "120%" }]}
        loop
        staggerDuration={0.01}
        splitLevelClassName="overflow-hidden"
        elementLevelClassName="overflow-hidden md:py-[4px]"
        transition={{ ease: [0.909, 0.151, 0.153, 0.86], duration: 1 }}
        rotationInterval={4000}
      />
    </div>
  )
}
```

## Notes

If you're using `auto` mode, make sure that the `rotationInterval` prop is set to a value that's greater than the duration of initial/exit animations, otherwise we will switch to a new text before the animation is complete. 

## Props

### TextRotateProps

| Prop | Type | Default | Description |
|----------|----------|----------|----------|
| texts* | `string[]` | - | The text to be displayed and animated |
| as | `ElementType` | `p` | Render as HTML Tag |
| initial | `MotionProps["initial"] | MotionProps["initial"][]` | `{ y: "100%", opacity: 0 }` | Initial animation state or array of states. If array is provided, states will be mapped to text segments cyclically. |
| animate | `MotionProps["animate"] | MotionProps["animate"][]` | `{ y: 0, opacity: 1 }` | Animation state to animate to or array of states. If array is provided, states will be mapped to text segments cyclically. |
| exit | `MotionProps["exit"] | MotionProps["exit"][]` | `{ y: "-120%", opacity: 0 }` | Animation state when exiting or array of states. If array is provided, states will be mapped to text segments cyclically. |
| animatePresenceMode | `AnimatePresenceProps["mode"]` | `"wait"` | The mode for the AnimatePresence component. Refer to motion docs for more details |
| animatePresenceInitial | `boolean` | `false` | Whether to animate in the initial state for AnimatePresence. Refer to motion docs for more details |
| rotationInterval | `number` | `2000` | The interval in milliseconds between each rotation |
| transition | `ValueAnimationTransition` | `{ type: "spring", damping: 25, stiffness: 300 }` | Animation configuration for each letter. Refer to motion docs for more details |
| staggerDuration | `number` | `0` | Delay between each letter's animation start |
| staggerFrom | `"first" | "last" | "center" | "random" | number` | `"first"` | Starting index of the stagger effect |
| loop | `boolean` | `true` | Whether to loop through the texts |
| auto | `boolean` | `true` | Whether to start the animation automatically |
| splitBy | `"words" | "characters" | "lines" | string` | `"words"` | The split method for the text |
| onNext | `(index: number) => void` | - | Callback function for when the next text is rendered |
| mainClassName | `string` | - | Additional CSS classes for styling the container |
| splitLevelClassName | `string` | - | Additional CSS classes for styling the individual words or lines |
| elementLevelClassName | `string` | - | Additional CSS classes for styling the individual characters/words/lines |

### TextRotateRef

| Method | Description |
|----------|----------|
| next() | Goes to the next text |
| previous() | Goes back to the previous text |
| jumpTo(index: number) | Jumps to a specific text index |
| reset() | Resets the animation to the initial state |

---

*This documentation is also available in [interactive format](https://fancycomponents.dev/docs/components/components/text/text-rotate).*