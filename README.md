# 🎪 Wheel Of Town

*The game show where everyone knows your name... because you're playing alone against AI.*

A browser-based spin on the classic word puzzle game, built with React and three.js. One human, two AI opponents, infinite regret over not buying that vowel.

## 🎮 What's This?

Think game show meets small-town charm. Spin a 3D wheel, guess letters, solve puzzles, and try not to go bankrupt while Pat makes commentary and Vanna reveals letters like it's 1983.

**Features:**
- 3D spinning wheel with realistic physics (or at least realistic enough)
- Two AI opponents with distinct personalities: one cautious, one reckless
- Pat hosts, Vanna reveals, you stress about consonants
- Keyboard and mouse controls because this isn't the stone age
- Accessibility features for everyone to enjoy the wheel-spinning madness

## 🚀 Quick Start

```bash
# Clone the town
git clone <your-repo-url>
cd wheel-of-town

# Install the dependencies (they're friendly, we promise)
npm install

# Spin up the dev server
npm run dev

# Visit localhost:5173 and start your linguistic journey
```

## 🎯 How to Play

1. **Spin** the wheel (or click the button if you're feeling lucky)
2. **Guess** consonants for cash, buy vowels for $250
3. **Solve** the puzzle when you think you know it
4. **Repeat** until someone wins or everyone goes bankrupt

The AI players have their own strategies, so don't expect them to make the same questionable decisions you do.

## 🏗️ Built With

- **React 18** - Because functional components are functional
- **three.js** - For that sweet, sweet 3D wheel action
- **Zustand** - State management that doesn't make you cry
- **Vite** - Fast builds, faster spins
- **Howler.js** - Sound effects (coming soon™)

## 🎪 The Town Roster

- **Pat** - Your friendly host with dad jokes and infinite patience
- **Vanna** - Letter-revealing legend with a wave that could stop traffic
- **AI Cautious** - Plays it safe, probably uses turn signals in parking lots
- **AI Aggressive** - Lives dangerously, probably eats cereal without milk

## 🧪 Testing

```bash
# Run the full test suite
npm run test:e2e

# Test specific features
npx playwright test tests/spin-and-zoom.spec.js
```

Because nothing says "professional" like making sure your wheel actually spins.

## 📝 Development Status

Currently in MVP phase with all core gameplay implemented. Check `TASKS.md` for what's cooking and `PRD.md` for the master plan.

**Working:** Spinning, guessing, solving, AI opponents, basic accessibility
**Coming Soon:** Sound effects, visual polish, bonus rounds, your sanity

## 🤝 Contributing

Found a bug? Want to add features? The town welcomes all residents! Check the existing docs and feel free to spin up a PR.

## 📄 License

MIT - Because sharing is caring, just like in a small town.

---

*Remember: In Wheel Of Town, the house always wins... but at least you had fun getting bankrupted by a computer.*
