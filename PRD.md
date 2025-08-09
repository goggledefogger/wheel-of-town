# Wheel of Fortune (Web) — Product Requirements Document (PRD)

## Overview
Build a browser-based Wheel of Fortune game using React (UI), JavaScript, and three.js (3D wheel + stage). The game runs locally via a simple React dev server (Vite). One human competes against two AI players. Pat (host) and Vanna (letter board presenter) appear as stylized avatars with lightweight lines, reactions, and animations.

The experience aims to be authentic, accessible, and performant on modern desktop browsers, with simplified but faithful rules.

## Goals
- Deliver a fun, replayable single-session game of Wheel of Fortune with:
  - One human player, two AI players
  - A 3D spinning wheel with realistic physics feel
  - Category-based puzzles, letter guessing, vowel buying, and solving
  - Pat as announcer/host; Vanna reveals letters on the board
  - Round scoring, Bankrupt/Lose a Turn wedges, per-round winner accumulation
- Fast local setup and smooth 60 FPS experience on mainstream laptops
- Strong UX with keyboard and mouse controls and basic accessibility

## Non-Goals
- Real-money or online multiplayer
- Photorealistic character models or licensed likenesses
- Exact TV rules for every special wedge (use a simplified-but-faithful set)
- Mobile-first optimization (desktop-first, mobile responsive as best-effort)

## Target Audience & Personas
- Casual puzzle/word-game players who enjoy quick desktop play
- Streamers or classroom demos wanting a familiar game show format

Personas:
- Jordan (25–40): Casual player, wants quick fun and intuitive controls
- Sam (30–50): Word-game fan, enjoys strategy and solving
- Riley (13–18): Learner, likes watching AI and visuals

## Success Metrics
- Technical:
  - Steady 60 FPS during wheel spin on mid-range laptop (Chrome/Edge/Firefox)
  - <2s initial load on a warm cache
  - No critical errors during a 5-round session
- UX:
  - Players can complete a full game without instructions
  - Positive feedback on clarity of turns and outcomes

## Assumptions
- Local play only; no backend required
- Puzzles shipped as local JSON data
- Three.js provides sufficient physics feel via custom spin + friction, no external physics library required

## Constraints
- JavaScript + React + three.js only (no TypeScript requirement)
- Vite dev server for local run/build
- Desktop-first; support Chrome latest, Edge latest, Firefox latest, Safari latest

## Game Rules (Simplified, Faithful)
- Game consists of multiple rounds (e.g., 3 standard rounds + final/bonus optional in v2)
- Each round:
  1. Players take turns in order: Human → AI1 → AI2 → …
  2. On a turn, a player may:
     - Spin the wheel (for a cash amount or hit special wedge)
     - Buy a vowel (cost $250 from current round earnings; only if the player has ≥$250)
     - Attempt to solve the puzzle
  3. Spinning the wheel yields:
     - Cash amount: guess a consonant. If correct, earn amount × occurrences and continue; if wrong, turn ends.
     - Bankrupt: lose all round earnings; turn ends.
     - Lose a Turn: turn ends.
     - Free Play (optional v1.1): safe guess or vowel without penalty.
  4. Vowels cost $250 and do not yield cash.
  5. Puzzle solved ends the round; winner banks round earnings to total score.
  6. After final standard round, highest total wins. (Bonus round optional in v2.)

Notes:
- No Toss-Up in MVP (consider v1.2). No Wild Card/Prize/Express in MVP.
- Final/Bonus round introduced in v1.1/v2.

## Functional Requirements

### Core Gameplay
- Load a random puzzle from a category set; display masked board with spaces and punctuation visible
- 3D Wheel rendered with three.js; spin via mouse drag or button press
  - Status: Wheel faces player, spins around Z, pointer at 12 o'clock; labels pending
- Consonant selection and vowel buying per rules; solving via text input
- Round scoring and total scoring; handle special wedges
- Turn order management and clear UI prompts
- End-of-round summary and end-of-game winner screen

### Hosts (Pat & Vanna)
- Pat: short quips on spin start/stop, correct/incorrect guesses, round start/end
- Vanna: animates to reveal letters on the board; simple idle/wave animations
- Lightweight styling (non-licensed, original art or silhouettes)

### AI Players
- Two AI opponents with distinct personalities/difficulties:
  - AI Cautious: buys vowels sparingly; prefers common consonants
  - AI Aggressive: spins more, risks near Bankrupt; guesses high-frequency letters earlier
- Heuristics:
  - Letter frequency model and board pattern matching
  - Vowel buying when cash ≥ $250 and puzzle uncertainty remains
  - Solve attempt when confidence ≥ threshold based on pattern/dictionary

### Input & Controls
- Mouse click or drag to spin; click letters to guess; keyboard support:
  - Enter: confirm action (solve/guess)
  - Letters: type to guess when appropriate
  - Escape: cancel dialogs

### Audio/Visual
- Wheel spin sound, click ticks, success/fail stings, audience cheer
- Subtle stage lighting; camera moves for spin and reveal moments

### Accessibility
- High-contrast mode toggle
- Color-blind safe palette for wedges
- Full keyboard operability
- Aria labels on interactive controls
  - Status: Base color theme + high-contrast CSS variables scaffolded

### Data
- Local `puzzles.json` with categories and phrases (normalized to uppercase, spaces and punctuation preserved)

## Non-Functional Requirements
- Performance: 60 FPS target during spin; avoid layout thrash; memoize-heavy renders
- Reliability: deterministic wheel outcomes with seedable RNG (for testing)
- Maintainability: modular game engine separate from UI; clear state machine

## Dependencies (Planned)
- React, react-dom
- three
- zustand (lightweight state management)
- howler (audio)
- classnames (styling convenience)

## Open Questions / Risks
- Realistic spin feel without external physics: tune friction/easing and randomness
- Puzzle difficulty balance and dictionary coverage
- Voice-over vs text-only for hosts (MVP: text + SFX only)

## Milestones
- v1.0 (MVP):
  - Core rounds (3), wheel with cash + bankrupt + lose turn
  - Consonants, vowels ($250), solve
  - Two AI personas, Pat/Vanna text-only
  - Sound effects, basic accessibility
- Status: Scaffolding complete. MVP gameplay loop (spin, guess, buy vowel, solve) implemented with text-only hosts and simple AI. Sound and polish pending.
- v1.1:
  - Bonus round
  - Free Play wedge
  - Improved AI solve model with phrase dictionary
- v1.2:
  - Toss-Up round
  - Animations/FX polish; host VO or TTS optional


