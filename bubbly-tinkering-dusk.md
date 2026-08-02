# Plan: Chat-First Trip Planning Flow

## Context
Currently the app uses a bottom-sheet wizard (4 steps: location/dates → who → budget → interests) triggered from a static home screen. The user wants to replace this with a conversational AI chat interface that starts immediately on launch. The user types a natural-language trip prompt; the AI parses it, identifies missing info, and asks follow-up questions by embedding the **existing form components** as inline chat cards. Once all info is gathered a "Make my Itinerary" CTA appears. The existing processing → results flow is preserved, but the processing screen gains a visible reasoning step.

Additional requests:
- A `+` button in the chat input opens an attachment menu including "Add a video link"
- Pasting a video URL triggers a simulated upload animation, shows a video card in chat, then AI asks for any changes

---

## Architecture Changes

### 1. New `MainScreen` values
```ts
type MainScreen = "chat" | "processing" | "results";
// "home" → "chat"
```

### 2. New `ChatMessage` union type
```ts
type ChatRole = "user" | "ai";

type ChatMessage =
  | { id: string; type: "text";         role: ChatRole; text: string }
  | { id: string; type: "reasoning";    text: string }            // collapsible AI think-aloud
  | { id: string; type: "card";         card: SheetStep }         // embedded form card
  | { id: string; type: "card-done";    card: SheetStep; summary: string } // confirmed card
  | { id: string; type: "video";        url: string; uploading: boolean }
  | { id: string; type: "cta" }                                   // "Make my Itinerary" button
```

### 3. New `ChatScreen` component (replaces `HomeScreen`)
Primary view when `mainScreen === "chat"`. Contains:
- Top: Cleartrip logo + status bar
- Middle: scrollable message list (`messagesEndRef` auto-scroll)
- Bottom: sticky chat input bar (text input + `+` button + send/voice)

**Initial state** on mount: one AI greeting message, then the input is focused.

### 4. Chat flow simulation (no real AI)
The logic lives in a `handleUserSend(text: string)` function:

```
Step 1 — User sends prompt
  → push user text message
  → push reasoning message (animated, 1.4s display)
  → push AI text: "Great pick! I just need a few details…"
  → determine which cards are needed based on parsed text:
      - if no destination keyword → push location-dates card
      - else if no "people/solo/partner/friends/family" keyword → push who card
      - else if no budget keyword → push budget card
      - else push interests card
  → after each card confirmed by user → push next needed card
  → once all cards confirmed → push cta message

Step 2 — CTA pressed → setMainScreen("processing")
```

Keyword parsing is a simple `includes()` simulation on the initial prompt.

### 5. Card confirmation
Each `card` message renders the existing form component inside a white rounded card bubble, with a "Confirm →" button at the bottom. On confirm:
- The `card` message is replaced with a `card-done` message (compact one-liner summary pill)
- The next missing card is queued

### 6. Reasoning bubble
`ReasoningBubble` component:
- Shows animated typing dots for 1.4 s
- Then fades in 2–3 lines of "thinking" text (simulated, e.g. "Parsing destination keywords… Checking for group size… Building preference profile…")
- Collapsible: user can tap to collapse/expand after it resolves

### 7. Plus menu & video attachment
`PlusMenu` — small popover above the `+` button:
- Options: 📎 Attach photo · 🎥 Add video link · 📍 Share location
- Tapping "Add video link" opens an inline URL input row that replaces the normal chat input
- On submit:
  1. Push `{ type: "video", url, uploading: true }` → simulated 2.2 s progress bar
  2. After upload: `uploading → false`, show YouTube/video thumbnail via `img` with a play icon overlay
  3. Push AI text: "Nice! I can use the vibe from this video to shape your itinerary. Any changes you'd like?"

### 8. Enhanced `ProcessingScreen`
Add a "Reasoning" phase before the existing text animation:
- New `phase: "reasoning" | "generating"` state
- In `"reasoning"` phase (2 s): show 4–5 streaming reasoning lines in a mono-style scrolling box (e.g. "→ Analysing Kerala travel data", "→ Matching tea garden activities to your preferences", "→ Optimising route via Kottayam corridor", "→ Pricing flights DEL→COK", "→ Finalising 5-day schedule")
- Then transitions to existing `"generating"` phase (the current text animation)

---

## Files to Modify

**`src/app/App.tsx`** — all changes here:

1. Change `type MainScreen = "home" | ...` → `"chat" | ...` (line 45)
2. Add `ChatMessage` union type after existing types
3. Remove `HomeScreen` component entirely (~lines 474–513)
4. Remove bottom-sheet related root state (`sheetOpen`, `sheetStep`) — sheet is gone
5. Add `ChatScreen` component (~180 lines) with message list, auto-scroll, input bar
6. Add `ReasoningBubble` component (~40 lines)
7. Add `PlusMenu` component (~50 lines)  
8. Add `VideoCard` component (~40 lines) with upload progress bar + thumbnail
9. Modify `ProcessingScreen` to add reasoning phase (~30 line change)
10. Update root `App` component:
    - Replace `HomeScreen` render with `ChatScreen`
    - Remove bottom-sheet JSX block (lines ~1690–1788)
    - Pass all existing form state (destination, dates, groupType, etc.) down to `ChatScreen` as before
    - Add `chatMessages` state array as root state
    - `handleUserSend` logic lives in root (drives the card sequencing)

---

## State that moves to root
```ts
const [chatMessages, setChatMessages] = useState<ChatMessage[]>([initialGreeting]);
const [chatInput, setChatInput] = useState("");
const [plusOpen, setPlusOpen] = useState(false);
const [videoInputMode, setVideoInputMode] = useState(false);
const [videoUrl, setVideoUrl] = useState("");
```

All existing form state (`destination`, `groupType`, etc.) stays at root — ChatScreen reads/writes it via props just as the sheet steps did.

---

## Key Reused Components (no signature change needed)
- `LocationDatesContent` (line 517) — embed as-is inside card bubble
- `WhoContent` (line 662) — embed as-is
- `BudgetContent` (line 773) — embed as-is
- `InterestsContent` (line 894) — embed as-is
- `ProcessingScreen` (line 981) — extend with reasoning phase
- `ResultsScreen` (line 1393) — no changes
- `BottomNav` (line 302) — stays
- `StatusBar` (line 276) — stays

---

## Verification
1. Launch app → see chat screen with AI greeting + focused input
2. Type "I want to visit Kerala in November" → reasoning bubble appears → AI responds → WhoContent card slides in
3. Fill Who card, tap Confirm → card collapses to summary pill → BudgetContent card appears
4. Fill Budget, confirm → InterestsContent card → fill → confirm → "Make my Itinerary" CTA appears
5. Tap CTA → ProcessingScreen with reasoning lines → then text animation → ResultsScreen
6. Tap `+` in input → popover appears with 3 options
7. Tap "Add video link" → URL input appears → paste any URL → upload progress → video thumbnail in chat → AI follow-up
8. No regressions: ResultsScreen tabs, transport cards, itinerary expand/collapse all work as before
