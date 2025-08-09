# Wheel Of Town (Web) — Software Architecture

## Tech Stack
- UI: React 18 (JavaScript)
- 3D: three.js (WebGL)
- State: Zustand (lightweight store) + explicit finite state machine
- Audio: howler.js
- Build/Dev: Vite

## High-Level Architecture

```mermaid
flowchart TD
  App[React AppShell] --> Game[Game Orchestrator]
  Game --> Store[Zustand Store]
  Game --> Wheel[WheelStage3D (three.js)]
  Game --> Board[GameBoard]
  Game --> Actions[ActionBar/LetterPicker]
  Game --> Hosts[Hosts: Pat/Vanna]
  Store <--> Board
  Store <--> Wheel
  Store <--> Actions
  Store <--> Hosts
```

Responsibilities:
- `Game Orchestrator`: finite state machine, turn flow, round lifecycle
- `Store`: source of truth for game, players, board, wheel, settings
- `WheelStage3D`: renders wheel, handles spin input, computes wedge result
- `GameBoard`: renders tiles and reveals letters
- `Hosts`: timed text/animations based on store events
- `Audio`: plays SFX triggered by store events

## Directory Structure (planned)
- `src/`
  - `app/` top-level `AppShell`, routing if added
  - `game/` domain logic
    - `engine/` state machine, reducers, actions
    - `ai/` strategies and heuristics
    - `data/` puzzles and dictionaries
    - `audio/` sfx hooks
  - `components/`
    - `WheelStage3D/`
    - `GameBoard/`
    - `ActionBar/`
    - `LetterPicker/`
    - `Hosts/`
    - `Summary/`
  - `state/` zustand store slices
  - `styles/`

## State Model

Game-level state (Zustand slices):

```js
/** Game */
{
  gameId: string,
  phase: 'Title'|'RoundStart'|'TurnHuman'|'TurnAI'|'Spin'|'AwaitConsonant'|'BuyVowel'|'SolveAttempt'|'Reveal'|'RoundEnd'|'GameEnd',
  roundIndex: number,
  roundsTotal: number,
  currentPlayerIndex: 0|1|2,
  settings: { difficulty: 'Easy'|'Normal'|'Hard', sound: boolean, highContrast: boolean, reducedMotion: boolean }
}

/** Players */
{
  players: [
    { id, name, type: 'Human'|'AI', roundBank: number, totalBank: number, personality?: 'Cautious'|'Aggressive' },
    ...
  ]
}

/** Board */
{
  category: string,
  phrase: string, // canonical uppercase with spaces/punct
  revealed: Set<string>, // letters revealed
  guessed: Set<string>, // all letters guessed this round
}

/** Wheel */
{
  wedges: Array<{ label: string, type: 'Cash'|'Bankrupt'|'LoseTurn'|'FreePlay', value?: number, color: string }>,
  angle: number,
  angularVelocity: number,
  isSpinning: boolean,
  lastResult?: { wedgeIndex: number, wedge: any }
}
```

Derived selectors compute:
- Remaining consonants/vowels, puzzle solved status, canBuyVowel, canSpin, etc.

## Finite State Machine
- Transitions guard rules and side effects:
  - `Spin` → integrates angular velocity with friction until stop → resolves `wedgeIndex` → `AwaitConsonant` or terminal (`Bankrupt`/`LoseTurn`)
  - `BuyVowel` → deduct → reveal → continue
  - `SolveAttempt` → compare normalized input → success to `RoundEnd` or pass turn

## Wheel Mechanics
- Geometry: 360° divided by N wedges; label text meshes or 2D overlay
- Spin input: drag distance → initial angular velocity; or button → velocity in [min, max]
- Physics: per-frame update `angle += angularVelocity; angularVelocity *= friction; angularVelocity -= sign*airResistance;` until threshold
- Result: map final `angle` modulo 2π to wedge index; add small pseudo-random jitter seeded by `gameId`
- Tick SFX: emit on pointer crossings at fixed angle intervals

## AI Subsystem
- Observation: current board pattern, guessed sets, bankrolls, wheel distribution
- Actions:
  - Choose spin vs solve vs buy vowel (utility with risk tolerance)
  - Letter selection: frequency tables filtered by already guessed and board pattern
  - Solve attempt: dictionary filter from revealed letters; confidence threshold
- Implementation: pure functions called with small delays for lifelike pacing

## Hosts & Animation
- Pat: event-driven dialogue queue; rate-limited bubbles; optional camera cuts
- Vanna: on reveal, animate tile flips with stagger and a small avatar gesture
- Reduced motion: skip camera sweeps and stagger

## Audio Pipeline
- Central `audioBus` with named cues: `spin`, `tick`, `correct`, `wrong`, `bankrupt`, `cheer`
- Lazy-load SFX; respect global mute/volume

## Data
- `puzzles.json` shipped in `src/game/data/`
- Optional `words.json` for AI solve model in later versions

## Error Handling
- All state mutations via store actions with guards; impossible transitions no-op with warning
- Deterministic RNG seeded per game for reproducible test runs

## Testing Strategy
- Unit: engine reducers, AI choices, letter reveal logic, solve validator
- Integration: spin resolve determinism under seeded RNG
- UI: component tests for board and actions; a11y checks for focus/aria

## Performance Considerations
- Decouple three.js render loop from React via refs and minimal state sync
- Memoize heavy components; use CSS transforms for HUD animations
- Limit scene complexity; use flat materials and few lights

## Build & Run
- Dev: `vite` local server
- Build: `vite build` outputs static assets
- No backend required; can be served statically
 - Status: Dev and build verified locally; initial bundle ~645k minified (optimize with code-splitting later).


