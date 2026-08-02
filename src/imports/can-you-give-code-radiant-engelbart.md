# Plan: Export the 3 components as standalone files

## Context

The user wants to reuse the three animated components from App.tsx in another project. All three are currently inlined in a single file. The goal is to extract each into its own self-contained `.tsx` file so they can be copied into any React + Tailwind CSS v4 + `motion/react` project.

## Components to extract

### 1. `TextRotate`
- Animates through an array of text strings, character by character, with spring physics.
- Depends on: `motion/react` (`AnimatePresence`, `motion`, `MotionProps`, `Transition`, `AnimatePresenceProps`), React (`forwardRef`, `useCallback`, `useEffect`, `useImperativeHandle`, `useMemo`, `useState`).
- Exports: default `TextRotate` component + named `TextRotateRef` interface.
- Usage in App: `<TextRotate texts={["flights","hotels","sightseeing"]} ... />`

### 2. `CirclingElements`
- Wraps children and orbits them in a circle using a CSS `@keyframes circling` animation.
- Depends on: React (`Children`), a `cn` helper.
- The CSS keyframe (`@keyframes circling`) must be present in the project's global CSS (currently in `src/index.css`).
- No `motion/react` dependency after the earlier fix (now uses plain `<div>`).
- Usage in App: `<CirclingElements radius={85} duration={20} ...>`

### 3. `AgentReasoning`
- Cycles through a list of travel-agent result strings with a slide + shimmer animation.
- Depends on: `motion/react` (`AnimatePresence`, `motion`), React (`useState`, `useEffect`).
- The CSS keyframe `@keyframes shineSweep` must be present in global CSS.
- The `agentLines` array is currently hardcoded — it should be a prop in the extracted version so it's reusable.

## Output files

| File | Contents |
|---|---|
| `src/components/TextRotate.tsx` | `TextRotate` component + `TextRotateRef` interface, self-contained |
| `src/components/CirclingElements.tsx` | `CirclingElements` component, self-contained |
| `src/components/AgentReasoning.tsx` | `AgentReasoning` component with `lines` prop |

Each file will have a comment at the top listing the required CSS keyframes the consumer must add to their global stylesheet.

## CSS note (for the consumer)

Add these keyframes to the project's global CSS:

```css
/* Required by CirclingElements */
@keyframes circling {
  0% {
    transform: rotate(calc(var(--circling-offset) * 1deg))
      translate(calc(var(--circling-radius) * 1px), 0)
      rotate(calc(var(--circling-offset) * -1deg));
  }
  100% {
    transform: rotate(calc(360deg + (var(--circling-offset) * 1deg)))
      translate(calc(var(--circling-radius) * 1px), 0)
      rotate(calc(-360deg + (var(--circling-offset) * -1deg)));
  }
}

/* Required by AgentReasoning */
@keyframes shineSweep {
  0%   { transform: translateX(-150%); }
  60%  { transform: translateX(250%); }
  100% { transform: translateX(250%); }
}
```

## What changes

- **Create** `src/components/TextRotate.tsx` — extracted verbatim from App.tsx lines 34–253, with its own imports and the `cn` / `splitIntoCharacters` helpers inlined.
- **Create** `src/components/CirclingElements.tsx` — extracted from App.tsx lines 255–312, `cn` helper inlined.
- **Create** `src/components/AgentReasoning.tsx` — extracted from App.tsx lines 343–390, with `agentLines` converted to a `lines: string[]` prop (defaults to the current Kerala travel lines).
- **No changes to App.tsx** — it continues to work as-is; optionally it could import from the new files but that's not required.

## Verification

After creating the files, confirm:
1. Each file has no TypeScript errors (`tsc --noEmit` shows no errors in the new files).
2. Each file's imports are self-contained (no references to App.tsx internals).
3. The CSS keyframe note is included in each relevant file as a comment.
