import { create } from 'zustand';

const VOWELS = new Set(['A','E','I','O','U']);

const DEFAULT_WEDGES = (() => {
  // 24 wedges: cash values plus a couple bankrupt/lose turn
  const vals = [500, 550, 600, 650, 700, 800, 900, 500, 600, 650, 700, 800];
  const wedges = [];
  for (let i = 0; i < 24; i++) {
    if (i === 4 || i === 16) wedges.push({ type: 'Bankrupt', label: 'BANKRUPT' });
    else if (i === 10) wedges.push({ type: 'LoseTurn', label: 'LOSE TURN' });
    else wedges.push({ type: 'Cash', label: `$${vals[i % vals.length]}`, value: vals[i % vals.length] });
  }
  return wedges;
})();

const PUZZLES = [
  { category: 'PHRASE', phrase: 'A BLESSING IN DISGUISE' },
  { category: 'THING', phrase: 'ELECTRIC GUITAR' },
  { category: 'PLACE', phrase: 'GOLDEN GATE BRIDGE' },
];

function pickPuzzle() {
  return PUZZLES[Math.floor(Math.random() * PUZZLES.length)];
}

function normalizePhrase(s) {
  return s.toUpperCase();
}

export const useGameStore = create((set, get) => ({
  gameId: String(Date.now()),
  phase: 'Title',
  roundIndex: 0,
  roundsTotal: 3,
  currentPlayerIndex: 0,
  spinToken: 0,
  players: [
    { id: 'p1', name: 'You', type: 'Human', roundBank: 0, totalBank: 0 },
    { id: 'p2', name: 'Tiny Roy', type: 'AI', personality: 'Cautious', roundBank: 0, totalBank: 0 },
    { id: 'p3', name: 'Big Roy', type: 'AI', personality: 'Aggressive', roundBank: 0, totalBank: 0 },
  ],
  board: {
    category: '',
    phrase: '',
    revealed: new Set(),
    guessed: new Set(),
  },
  wheel: {
    wedges: DEFAULT_WEDGES,
    lastResult: null,
  },
  host: {
    lines: ['Welcome to Wheel Of Town!'],
  },
  settings: { difficulty: 'Normal', sound: true, highContrast: false, reducedMotion: false },

  // Derived
  get canBuyVowel() {
    const s = get();
    const p = s.players[s.currentPlayerIndex];
    return p.roundBank >= 250 && s.phase !== 'Spin';
  },

  actions: {
    startGame: () => {
      const puzzle = pickPuzzle();
      set(state => ({
        phase: 'TurnHuman',
        roundIndex: 0,
        currentPlayerIndex: 0,
        players: state.players.map(p => ({ ...p, roundBank: 0 })),
        board: {
          category: puzzle.category,
          phrase: normalizePhrase(puzzle.phrase),
          revealed: new Set(),
          guessed: new Set(),
        },
        host: { lines: [...state.host.lines, `Pat: Category is ${puzzle.category}.`] },
      }));
    },

    spinWheel: () => {
      const s = get();
      if (!(s.phase === 'TurnHuman' || s.phase === 'AwaitAction' || s.phase === 'TurnAI')) return;
      set({ phase: 'Spin', spinToken: Date.now() });
    },

    onSpinComplete: (wedgeIndex) => {
      const s = get();
      const wedge = s.wheel.wedges[wedgeIndex];
      // Ensure we leave Spin phase immediately for AI waiters
      set({ phase: 'AwaitAction' });
      if (wedge.type === 'Bankrupt') {
        set(state => ({
          players: state.players.map((p, i) => i === state.currentPlayerIndex ? { ...p, roundBank: 0 } : p),
          host: { lines: [...state.host.lines, 'Pat: Oh no, Bankrupt.'] },
        }));
        get().actions.passTurn();
      } else if (wedge.type === 'LoseTurn') {
        set(state => ({
          host: { lines: [...state.host.lines, 'Pat: Lose a turn.'] },
        }));
        get().actions.passTurn();
      } else {
        // Cash
        set(state => ({ phase: 'AwaitConsonant', wheel: { ...state.wheel, lastResult: { wedgeIndex, wedge } }, host: { lines: [...state.host.lines, `Pat: ${wedge.label}. Pick a consonant.`] } }));
      }
    },

    pickLetter: (letter) => {
      const s = get();
      const buyingVowel = s.phase === 'BuyVowel';
      const isVowel = VOWELS.has(letter);
      if (buyingVowel && !isVowel) return;
      if (!buyingVowel && isVowel) return;
      if (!(s.phase === 'AwaitConsonant' || s.phase === 'BuyVowel')) return;
      if (s.board.guessed.has(letter)) return;

      const occurrences = s.board.phrase.split('').filter(ch => ch === letter).length;
      const guessed = new Set(s.board.guessed);
      guessed.add(letter);
      const revealed = new Set(s.board.revealed);
      if (occurrences > 0) {
        for (const ch of s.board.phrase) {
          if (ch === letter) revealed.add(ch);
        }
      }

      // Update scores
      let players = s.players.slice();
      if (s.phase === 'AwaitConsonant') {
        const cash = s.wheel.lastResult?.wedge?.value ?? 0;
        if (occurrences > 0 && cash > 0) {
          players[s.currentPlayerIndex] = { ...players[s.currentPlayerIndex], roundBank: players[s.currentPlayerIndex].roundBank + cash * occurrences };
        }
      } else if (s.phase === 'BuyVowel') {
        players[s.currentPlayerIndex] = { ...players[s.currentPlayerIndex], roundBank: players[s.currentPlayerIndex].roundBank - 250 };
      }

      // Check solved
      const allLetters = new Set(s.board.phrase.split('').filter(ch => /[A-Z]/.test(ch)));
      const solved = [...allLetters].every(l => revealed.has(l));

      set({
        board: { ...s.board, guessed, revealed },
        players,
        phase: solved ? 'RoundEnd' : 'AwaitAction',
        host: { lines: [...s.host.lines, occurrences > 0 ? `Pat: ${occurrences} ${occurrences === 1 ? 'letter' : 'letters'}.` : 'Pat: No dice.'] },
      });

      if (!solved && occurrences === 0) {
        get().actions.passTurn();
        return;
      }

      // If AI and turn continues, prompt AI to act again
      const st = get();
      if (!solved && st.players[st.currentPlayerIndex].type === 'AI' && st.phase === 'AwaitAction') {
        setTimeout(() => {
          const st2 = get();
          if (st2.players[st2.currentPlayerIndex].type === 'AI' && st2.phase === 'AwaitAction') {
            get().actions.aiTakeTurn();
          }
        }, 500);
      }
    },

    buyVowel: () => {
      const s = get();
      const p = s.players[s.currentPlayerIndex];
      if (p.roundBank < 250) return;
      set({ phase: 'BuyVowel', host: { lines: [...s.host.lines, 'Pat: Buy a vowel.'] } });
    },

    attemptSolve: (guess) => {
      const s = get();
      const correct = guess.trim() === s.board.phrase;
      if (correct) {
        // Bank round earnings to total for solver
        const players = s.players.map((p, i) => i === s.currentPlayerIndex ? { ...p, totalBank: p.totalBank + p.roundBank } : p);
        set({ phase: 'RoundEnd', players, host: { lines: [...s.host.lines, 'Pat: That is correct!'] } });
      } else {
        set({ host: { lines: [...s.host.lines, 'Pat: Sorry, that is not correct.'] } });
        get().actions.passTurn();
      }
    },

    passTurn: () => {
      const s = get();
      const next = (s.currentPlayerIndex + 1) % s.players.length;
      set({ currentPlayerIndex: next, phase: s.players[next].type === 'AI' ? 'TurnAI' : 'TurnHuman' });
      if (get().phase === 'TurnAI') {
        get().actions.aiTakeTurn();
      }
    },

    nextRound: () => {
      const s = get();
      const roundIndex = s.roundIndex + 1;
      if (roundIndex >= s.roundsTotal) {
        set({ phase: 'GameEnd', host: { lines: [...s.host.lines, 'Pat: Thanks for playing!'] } });
        return;
      }
      const puzzle = pickPuzzle();
      set(state => ({
        phase: 'TurnHuman',
        roundIndex,
        currentPlayerIndex: 0,
        players: state.players.map(p => ({ ...p, roundBank: 0 })),
        board: {
          category: puzzle.category,
          phrase: normalizePhrase(puzzle.phrase),
          revealed: new Set(),
          guessed: new Set(),
        },
        host: { lines: [...state.host.lines, `Pat: Next round. Category is ${puzzle.category}.`] },
      }));
    },

    restart: () => {
      set(state => ({
        phase: 'Title',
        roundIndex: 0,
        currentPlayerIndex: 0,
        players: state.players.map(p => ({ ...p, roundBank: 0, totalBank: 0 })),
        host: { lines: ['Welcome to Wheel Of Town!'] },
      }));
    },

    // Simple AI turn logic (MVP)
    aiTakeTurn: async () => {
      const s = get();
      if (s.players[s.currentPlayerIndex].type !== 'AI') return;
      const delay = (ms) => new Promise(r => setTimeout(r, ms));
      const myIndex = get().currentPlayerIndex;
      // Decide action: solve if nearly solved, else buy vowel if affordable and many blanks, else spin
      const needed = new Set(s.board.phrase.split('').filter(ch => /[A-Z]/.test(ch)));
      for (const r of s.board.revealed) needed.delete(r);
      if (needed.size <= 2) {
        await delay(800);
        get().actions.attemptSolve(s.board.phrase);
        return;
      }
      const canBuy = get().canBuyVowel && [...needed].some(l => VOWELS.has(l));
      if (canBuy) {
        await delay(600);
        get().actions.buyVowel();
        await delay(600);
        const pick = ['A','E','I','O','U'].find(v => needed.has(v)) || 'A';
        get().actions.pickLetter(pick);
        return;
      }
      await delay(600);
      // If already in AwaitAction from previous step, proceed to spin
      get().actions.spinWheel();
      // Wait for spin outcome. Proceed only if it's still our turn and we need a consonant.
      let tries = 0;
      while (tries < 200) { // up to ~10s
        await delay(50);
        const st = get();
        if (st.currentPlayerIndex !== myIndex) return; // turn passed (bankrupt/lose turn or wrong guess previously)
        if (st.phase === 'AwaitConsonant') break; // ready to guess consonant
        if (st.phase === 'RoundEnd' || st.phase === 'GameEnd') return;
        tries++;
      }
      const st2 = get();
      if (st2.currentPlayerIndex !== myIndex || st2.phase !== 'AwaitConsonant') return;
      const freq = 'RSTLNECDMAHIOUPGWBYFKVJXZ';
      const remaining = freq.split('').filter(l => !VOWELS.has(l) && !st2.board.guessed.has(l));
      const choice = remaining[0] || 'S';
      get().actions.pickLetter(choice);
    },
  },
}));


