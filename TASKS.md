# Tasks — Wheel of Fortune (Web)

## Today (Short-Term)
- [x] Write PRD, Design, Architecture docs
- [x] Initialize Vite + React app scaffolding
- [x] Add base dependencies (react, three, zustand, howler, classnames)
- [x] Create core components: wheel, board, action bar, letters, hosts, summaries
- [x] Implement basic state machine and AI turn loop
- [x] Fix wheel orientation and pointer alignment
- [x] Fix AI waiting for spin resolution before guessing
- [ ] Sound cues (spin ticks, correct/wrong, bankrupt)
- [ ] High-contrast toggle in settings
- [ ] Keyboard controls for letters and actions

## Near-Term
- [ ] Refine wheel visuals (labels on wedges, cash text overlay)
- [x] Add deceleration zoom overlay for wheel landing clarity
- [ ] Camera moves and stage lighting polish
- [ ] Improve AI letter selection using frequency + pattern filters
- [ ] Add `puzzles.json` and loader; expand categories
- [ ] Round transition animations and Vanna reveal stagger
- [ ] Deterministic RNG (seed) for testing and replays

## Medium-Term
- [ ] Bonus round flow
- [ ] Free Play wedge
- [ ] Toss-Up round
- [ ] Reduced motion mode (skip sweeps)
- [ ] Basic a11y audit and aria-live improvements

## Long-Term
- [ ] Asset pipeline for SFX/VO
- [ ] Settings screen with difficulty presets
- [ ] Theming and visual polish
- [ ] Unit tests for engine and AI heuristics

## Changelog
- v0.1.0: Initial scaffolding with MVP gameplay loop (spin, guess, buy vowel, solve), simple AI, host dialogues.


