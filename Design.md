# Wheel Of Town (Web) — Design Doc

## UX Overview
Desktop-first experience with a 3D stage and wheel, a puzzle board, player panels, and host area.

### Primary Screens/States
1. Title/Start Screen
   - Logo, Start Game button, Settings (difficulty, sound, high-contrast)
2. Game Screen (Round)
   - 3D wheel and stage (center)
   - Puzzle board (top)
   - Player panels (bottom): Human left, AI middle/right with scores and turn indicator
   - Host area (left or right): Pat’s dialogue bubble; Vanna near the board
   - Action bar: Spin, Buy Vowel, Solve (contextual availability)
   - Letter selector (A–Z) and vowel indicators
3. End-of-Round Summary
   - Round winner, earnings, board reveal if unsolved
4. End-of-Game Summary
   - Final standings, replay option

### Key User Flows
1. Start → Settings (optional) → Start Game → Round 1
2. During own turn: Spin → Wheel settles → Consonant selection → Earn or next player
3. Buy Vowel → Deduct $250 → Reveal if present → Continue turn
5. Solve → Enter phrase in modal board-style input → Validate → If correct, round end; else turn passes
6. AI turns: automatic actions with brief delays and dialogue

## Interaction & Controls
- Spin: mouse drag on wheel (angular velocity based on drag) or click Spin button (randomized force within range)
- Letter guess: click a letter card or type on keyboard; disabled when invalid (already revealed or vowels when not buying)
- Solve: press Solve to open modal; type solution; Enter to submit; Escape to cancel
- Accessibility: all actions reachable via keyboard; focus rings; aria-live for announcements

## Visual Design
- Stage: dark-blue studio gradient background with subtle spotlight glow
- Wheel: classic, harmonious palette; gold rim and pointer; subtle shadow and 3D/metallic effects
- Decel zoom: during slow-down and for ~1s after stop, a zoomed overlay appears bottom-right to make the landing wedge easier to see; hides on next spin
- Puzzle board: green “reveal” tiles; spaces transparent; punctuation subtle blue
- Hosts: stylized characters (flat-shaded avatars) with idle/gesture animations
- Color palette: homage to classic show (gold accents, green board) + a11y safe
- Solve modal: board-style input grid, revealed letters locked, matches puzzle layout
- Typography: Inter for UI, Merriweather for headings/labels
- Confetti and celebratory effects for round/game win

## Sound Design
- SFX: spin whoosh, wedge ticks, correct chime, wrong buzzer, bankrupt sting, audience cheer
- Volume slider; mute toggle
- Status: Not yet implemented (MVP pending)

## Components (React)
- Layout
  - `AppShell` (top-level layout, settings panel)
  - `HUD` (scores, turn indicator, action bar)
- Core Game
  - `GameBoard` (puzzle tiles, category) — implemented with space/punct styling
  - `WheelStage3D` (three.js canvas, wheel, lights, camera) — oriented facing user
  - `LetterPicker` (A–Z grid, enabled/disabled states) — implemented
  - `ActionBar` (Spin, Buy Vowel, Solve) — implemented
  - `SolveDialog` (modal text input) — deferred; using prompt in MVP
  - `HostDialogue` (Pat messages) — implemented basic; `VannaAnimator` — deferred
  - `RoundSummary`, `GameSummary` — implemented
  - `Toast/Announcement` (aria-live region) — basic via host bubble

## State & Logic
High-level finite state machine:
- `Idle` → `RoundStart` → `TurnHuman` | `TurnAI` → `Spin` → `AwaitConsonant` → `Reveal` → `ContinueTurn | PassTurn` → `RoundEnd` → `NextRound | GameEnd`
- Buy Vowel: `Turn*` → `BuyVowel` → `Reveal` → back to `Turn*`
- Solve: `Turn*` → `SolveAttempt` → `RoundEnd | TurnPass`

Board state:
- Masked phrase with known spaces/punctuation visible
- Set of revealed letters; guessed letters history; remaining consonants/vowels

Wheel state:
- Angular velocity, friction, wedge index; deterministic resolve once below threshold

## AI Design
- Letter frequency map with category weighting
- Pattern matching (e.g., regex-like from revealed letters)
- Vowel buying when bankroll ≥ $250 and entropy high
- Solve threshold: if single candidate phrase or high match probability
- Personalities tweak risk tolerance and spin vs solve bias

## Accessibility
- Improved focus, aria, and keyboard support for all actions and modals
- Aria labels and live regions for turn and outcome announcements
- High-contrast mode; color-blind friendly wedges
- Avoid motion sickness: reduced motion setting disables big camera sweeps

## Data
- `puzzles.json` structure:
```json
{
  "categories": [
    { "name": "PHRASE", "puzzles": ["A BLESSING IN DISGUISE", "BREAK A LEG", "ON CLOUD NINE"] },
    { "name": "THING", "puzzles": ["COMPUTER KEYBOARD", "ELECTRIC GUITAR"] }
  ]
}
```

## Wireframe Notes (Text)
- Top: `Category: PHRASE` centered; board beneath in 2–3 rows of tiles
- Center: wheel canvas (responsive max height ~60% viewport height)
- Bottom: player panels (name, round $ and total $), with glowing outline for current turn
- Right: actions and letters; left: host dialogue stack

## Error States
- No puzzles available → show friendly error and retry button
- Audio blocked (autoplay) → show “Tap to enable sound” banner


