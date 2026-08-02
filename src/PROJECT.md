# Cleartrip AI Trip Planner — Project Context

## What This Is

A mobile-first AI-powered travel planning prototype built for Cleartrip, India's leading travel platform. The app demonstrates a conversational trip-planning experience: users either describe a trip from scratch or paste a YouTube travel video link, and the AI reasons through destinations, logistics, itinerary, and costs to produce a fully-structured trip plan.

The prototype is scoped to a Kerala, India trip (5 days, Nov 17–21) as the primary demo flow.

---

## Environment

- **Framework**: React 18 + Vite 6
- **Styling**: Tailwind CSS v4 (no `tailwind.config.js` — uses `@theme inline` in CSS)
- **Animation**: `motion` package (`motion/react` subpath) — referred to as Motion, not Framer Motion
- **Icons**: `lucide-react`
- **Build**: Figma Make environment — do NOT run `vite build`, do NOT create `index.html`, dev server is always running
- **Package manager**: `pnpm`

---

## File Structure

```
src/
  app/
    App.tsx              ← entire app lives here (screens, components, data, state)
    components/
      figma/             ← ImageWithFallback utility
      ui/                ← shadcn/radix primitives (unused in main app)
  components/
    CirclingElements.tsx ← orbiting image ring used in the loader screen
    TextRotate.tsx       ← character-level animated text cycling component
  styles/
    fonts.css            ← font imports only (Google Fonts: Inter)
    index.css            ← imports fonts, tailwind, theme
    tailwind.css         ← @import tailwindcss + tw-animate-css
    theme.css            ← CSS custom properties + @theme inline tokens + @keyframes
  imports/               ← Figma-exported assets (SVGs, PNGs via figma:asset scheme)
```

---

## Brand & Design Tokens

Defined in `src/styles/theme.css` and mirrored as the `C` object in `App.tsx`:

| Token | Value | Usage |
|---|---|---|
| `coral` | `#F85010` | Primary CTAs, brand accent |
| `teal` | `#2E6E6A` | AI-powered elements |
| `coralSoft` | `#FEEDE2` | Warm wash behind CTAs |
| `ink` | `#16130F` | Primary text |
| `sub` | `#6B6259` | Secondary / muted text |
| `ground` | `#FDFBF8` | App background |
| `hair` | `#EFE9E1` | Borders, dividers |
| `good` | `#1E7A4C` | Savings, confirmations |
| `cardBg` | `#FFFFFF` | Card surfaces |
| `cardBorder` | `#EBEBEB` | Card borders |

Typography scale lives in the `T` object in `App.tsx` (pixel values as strings).

**Button corner radius**: `rounded-xl` (12px) — matching Cleartrip's design system. Full-pill (`rounded-full`) is reserved for chip/badge elements, circular icon buttons, and input pills only.

---

## App Screens & Flow

### Screen State Machine

```
MainScreen = "home" | "processing" | "results" | "video-processing"
```

### 1. Home Screen (`HomeScreen`)
- Cleartrip logo + feature bullets
- Two CTAs: **Create a Trip** (standard flow) and **Plan a trip with a video** (video flow)
- Bottom nav bar

### 2. Standard Flow — Preference Sheet
A bottom-sheet with 6 steps (spring-animated, `motion.div` sliding from `y: "100%"`):
1. **Location + Dates** — destination search with Kerala suggestions, fixed/flexible date picker
2. **Group** — Solo / Partner / Friends / Family selector with custom SVG icons
3. **Travellers** — stepper for group count, children toggle (Yes/No)
4. **Budget** — custom slider (₹5K–₹2L per person)
5. **Transport** — Flight / Train / Drive / Bus chips
6. **Interests** — image-card chip grid with AI context switching (chat input re-filters chips by category)

Progress: segmented bar at top of sheet. CTA advances steps or submits.

### 3. Processing Screen (`ProcessingScreen`)
Shown while "AI is building the plan":
- `CirclingElements` — 6 Kerala images orbiting at 90px radius around an orange breathing blob
- `TextRotate` — single-line animated text cycling through travel-related phrases
- Shimmer reasoning text — one line at a time with animated gradient sweep
- Auto-advances to Results after ~12s

### 4. Results Screen (`ResultsScreen`)
Two-tab layout (Stays & Travel / Day Itinerary):

**Stays & Travel (`LogisticsView`)**
- Flight card with outbound/return segments + per-person cost
- Hotel cards per day with alt-hotel accordion (expand to see cheaper/different options)
- Local transport per day (auto-rickshaw, cab, bus)
- Daily cost total row
- Per-person trip total

**Day Itinerary (`ItineraryView`)**
- 5 collapsible day cards with Kerala photography headers
- Activity timeline with colour-coded dot types (transport/hotel/sight/food/activity)
- "Updated" badge + "New" badge on activities after AI rewrite

**AI Chat Bar** (floating, always visible at bottom):
- Tap input → sends message → triggers itinerary rewrite flow
- Reasoning card expands upward inside the gradient zone above the input (no full-screen takeover)
- Dark scrim dims the results content behind the card while reasoning runs
- "Done" state shows change summary; tap anywhere to dismiss

### 5. Video Flow

**VideoLinkSheet** — bottom sheet with:
- URL input (single line)
- YouTube thumbnail preview — extracts video ID via regex, shows `img.youtube.com/vi/{id}/hqdefault.jpg`; falls back to a Kerala Unsplash photo
- Upload simulation progress bar overlaid on the thumbnail
- "Make the trip" CTA (enabled once upload simulation completes)

**VideoProcessingScreen** — full-screen over `ground` background:
- Animated coral blob icon
- 8 reasoning steps at staggered delays (~900ms each, ~7.5s total)
- Shimmer sweep on the active step
- On completion: dark overlay fades in over the reasoning screen, green circle with animated SVG checkmark pops in, "Plan extracted from the video / Now add your preferences" text
- After 4s, transitions to the standard preference sheet pre-filled with Kerala data

---

## Key Components

### `CirclingElements` (`src/components/CirclingElements.tsx`)
- 6 elements orbit a central point via CSS `@keyframes circling`
- Custom properties: `--circling-offset` (deg), `--circling-radius` (px, default 90)
- Image size: 82×82px, `rounded-xl`, no border/stroke
- Centre: orange radial gradient blob with breathing `scale` animation

### `TextRotate` (`src/components/TextRotate.tsx`)
- Character-level staggered animation using `AnimatePresence`
- `forwardRef` with `TextRotateRef` API (`next`, `previous`, `jumpTo`, `reset`)
- Key fix: no `layout` prop on root or inner span — prevents line-wrapping when used inline with other elements
- Root uses `flex-nowrap whitespace-nowrap` to keep "Searching for [pill]" on one line

### Shimmer Effect
- `linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)`
- `backgroundSize: "200% 100%"` animated via Motion `backgroundPosition`
- Used on reasoning text lines and rewrite card active step

---

## Major Features Built (Chronological)

1. **Home + preference sheet** — 6-step bottom sheet with spring physics
2. **Processing screen** — CirclingElements orbit + TextRotate cycling
3. **Results screen** — logistics view (flights, hotels, transport) + itinerary (5 collapsible days)
4. **Reasoning shimmer** — one-line-at-a-time AI reasoning with shimmer sweep in processing screen
5. **TextRotate rewrite** — forwardRef, character-level animation, no-layout fix for single-line constraint
6. **Selection states → black** — all chip/card selected states converted from coral to `C.ink`; primary CTAs stay coral
7. **Logistics enhancements** — per-day local transport pricing, hotel alt-options accordion, daily cost total row
8. **Video flow** — VideoLinkSheet + VideoProcessingScreen + completion overlay + preference sheet prefill
9. **YouTube thumbnail preview** — regex extraction of video ID, real thumbnail in upload sheet
10. **Video completion overlay** — dark scrim over reasoning screen, animated green tick, 4s display
11. **AI rewrite flow** — chat input triggers reasoning card that expands the bottom gradient zone upward; clipPath circle animation (later replaced with card-in-gradient approach); dark scrim behind card; change summary on completion; itinerary swaps to v2 data with "New" badges
12. **Button corner radius** — all full-width action buttons changed from `rounded-full` to `rounded-xl` to match Cleartrip design system reference

---

## Known Constraints

- **No `vite build`** in this environment — dev server is always running
- **No `index.html`** — entrypoint is auto-generated `__figma__entrypoint__.ts`
- **Tailwind v4** — no `tailwind.config.js`; use `@theme inline` in `theme.css` for tokens; avoid `outline-ring/50` in `@apply` (causes CSS color parsing error)
- **`motion/react`** subpath from the `motion` package — import as `import { motion, AnimatePresence } from "motion/react"`
- **pnpm** — not npm or yarn
- **Images**: Figma assets use `figma:asset/` virtual scheme (no path prefix); new images use `ImageWithFallback` component or Unsplash URLs
- **Font imports**: only in `src/styles/fonts.css`

---

## Data

All data is hardcoded mock data in `App.tsx`:

- `KERALA_SUGGESTIONS` / `DEFAULT_SUGGESTIONS` — destination autocomplete
- `LOGISTICS` — 5-day array with flight, hotel (including alts), transport per day, pricing
- `ITINERARY_DAYS` — v1 activities for 5 days
- `ITINERARY_DAYS_V2` — post-rewrite version (Day 3 gets cooking class at 12pm, other times shift)
- `CHIP_CONTEXTS` — interest chips grouped by AI-detected category (beaches, mountains, food, culture, wellness, adventure)
- `VIDEO_REASONING_STEPS` — 8 steps for video processing screen
- `REWRITE_STEPS` — 6 steps for itinerary rewrite card
