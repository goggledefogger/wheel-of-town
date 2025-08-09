import { create } from 'zustand';
import { DICTIONARY } from '../assets/dictionary.js';

const VOWELS = new Set(['A','E','I','O','U']);

// type Element = 'Fire' | 'Ice' | 'Lightning' | 'None';
// type WheelWedge = { id: string; label: string; value?: number; element: Element; kind: 'Cash' | 'Bankrupt' | 'LoseTurn' | 'Special'; };
// type ElementStatus = { lastElement: Element | null; comboCount: number; queuedEffects: Effect[]; };
// type Effect = | { type: 'FireRevealNextVowel'; expiresAtTurn: number } | { type: 'IceNegateNextHazard'; charges: 1 } | { type: 'LightningRevealRandomConsonant'; applyNow: true } | { type: 'ShieldedHazard'; from: 'Ice' };

const DEFAULT_WEDGES = (() => {
  // 24 wedges: cash values plus a couple bankrupt/lose turn
  const vals = [500, 550, 600, 650, 700, 800, 900, 500, 600, 650, 700, 800];
  const wedges = [];
  for (let i = 0; i < 24; i++) {
    const element = i === 2 ? 'Fire' : i === 8 ? 'Ice' : i === 14 ? 'Lightning' : i === 20 ? 'Ice' : 'None';
    if (i === 4 || i === 16) wedges.push({ type: 'Bankrupt', label: 'BANKRUPT', element });
    else if (i === 10) wedges.push({ type: 'LoseTurn', label: 'LOSE TURN', element });
    else if (i === 18) wedges.push({ type: 'Special', label: 'ANAGRAM RIFT', element: 'None' });
    else wedges.push({ type: 'Cash', label: `$${vals[i % vals.length]}`, value: vals[i % vals.length], element });
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
    { id: 'p1', name: 'You', type: 'Human', roundBank: 0, totalBank: 0, elementStatus: { lastElement: 'None', comboCount: 0, queuedEffects: [] } },
    { id: 'p2', name: 'Tiny Roy', type: 'AI', personality: 'Cautious', roundBank: 0, totalBank: 0, elementStatus: { lastElement: 'None', comboCount: 0, queuedEffects: [] } },
    { id: 'p3', name: 'Big Roy', type: 'AI', personality: 'Aggressive', roundBank: 0, totalBank: 0, elementStatus: { lastElement: 'None', comboCount: 0, queuedEffects: [] } },
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
  notifications: [],
  rift: {
    active: false,
    poolLetters: [],
    usedWords: [],
    scoreCount: 0,
    timerEndsAt: 0,
    config: {
      durationMs: 15000,
      maxWilds: 2,
      minWordLen: 3,
      revealMode: 'AutoReveal',
    },
  },

  // Derived
  get canBuyVowel() {
    const s = get();
    const p = s.players[s.currentPlayerIndex];
    const isHumanTurn = p.type === 'Human';
    const isCorrectPhase = s.phase === 'TurnHuman' || s.phase === 'AwaitAction';
    return isHumanTurn && p.roundBank >= 250 && isCorrectPhase;
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
      const player = s.players[s.currentPlayerIndex];

      // Create mutable copies of state to update
      let players = s.players.map(p => ({ ...p, elementStatus: { ...p.elementStatus, queuedEffects: [...p.elementStatus.queuedEffects] } }));
      let currentPlayer = players[s.currentPlayerIndex];
      let hostLines = [...s.host.lines];
      let phase = 'AwaitAction';
      let board = { ...s.board, revealed: new Set(s.board.revealed), guessed: new Set(s.board.guessed) };
      let shouldPassTurn = false;
      let newWheelResult = { wedgeIndex, wedge };
      let finalPlayerIndex = s.currentPlayerIndex;

      // 1. Element Combos & Effects
      const element = wedge.element;
      if (element && element !== 'None') {
        if (element === currentPlayer.elementStatus.lastElement) {
          currentPlayer.elementStatus.comboCount++;
        } else {
          currentPlayer.elementStatus.comboCount = 1;
          currentPlayer.elementStatus.lastElement = element;
        }
      } else {
        currentPlayer.elementStatus.comboCount = 0;
        currentPlayer.elementStatus.lastElement = 'None';
      }

      if (currentPlayer.elementStatus.comboCount >= 2) {
        const currentElement = currentPlayer.elementStatus.lastElement;
        hostLines.push(`Pat: A ${currentElement} combo!`);
        let effects = currentPlayer.elementStatus.queuedEffects;
        if (currentElement === 'Fire') {
          effects.push({ type: 'FireRevealNextVowel', expiresAtTurn: s.roundIndex });
        } else if (currentElement === 'Ice') {
          effects = effects.filter(e => e.type !== 'IceNegateNextHazard');
          effects.push({ type: 'IceNegateNextHazard', charges: 1 });
        } else if (currentElement === 'Lightning') {
          effects.push({ type: 'LightningRevealRandomConsonant', applyNow: true });
        }
        currentPlayer.elementStatus.queuedEffects = effects;
      }

      // 2. Handle Hazards & Ice Shield
      const isHazard = wedge.type === 'Bankrupt' || wedge.type === 'LoseTurn';
      const iceShield = currentPlayer.elementStatus.queuedEffects.find(e => e.type === 'IceNegateNextHazard');
      if (isHazard && iceShield) {
        currentPlayer.elementStatus.queuedEffects = currentPlayer.elementStatus.queuedEffects.filter(e => e.type !== 'IceNegateNextHazard');
        get().actions.addNotification(`Ice shield absorbed ${wedge.label}!`, 'success');
      } else if (isHazard) {
        if (wedge.type === 'Bankrupt') {
          currentPlayer.roundBank = 0;
          hostLines.push('Pat: Oh no, Bankrupt.');
        } else {
          hostLines.push('Pat: Lose a turn.');
        }
        shouldPassTurn = true;
      } else if (wedge.type === 'Special' && wedge.label === 'ANAGRAM RIFT') {
        get().actions.startAnagramRift();
        // The rift itself will handle the phase changes
        return;
      }

      // 3. Handle Immediate Effects (Lightning)
      const lightningEffect = currentPlayer.elementStatus.queuedEffects.find(e => e.type === 'LightningRevealRandomConsonant' && e.applyNow);
      if (lightningEffect) {
        currentPlayer.elementStatus.queuedEffects = currentPlayer.elementStatus.queuedEffects.filter(e => e.type !== 'LightningRevealRandomConsonant');
        const unrevealedConsonants = board.phrase.split('').filter(c => /[A-Z]/.test(c) && !VOWELS.has(c) && !board.revealed.has(c));
        if (unrevealedConsonants.length > 0) {
          const charToReveal = unrevealedConsonants[Math.floor(Math.random() * unrevealedConsonants.length)];
          board.revealed.add(charToReveal);
          get().actions.addNotification(`Lightning revealed: ${charToReveal}!`, 'info');
        } else {
          get().actions.addNotification('Lightning fizzled!', 'warn');
        }

        // Rotate turn order
        const pId = currentPlayer.id;
        players.unshift(players.pop()); // Right rotation
        finalPlayerIndex = players.findIndex(p => p.id === pId);
        get().actions.addNotification('Turn order shifted!', 'info');
      }

      // 4. Finalize state based on outcome
      if (!isHazard || (isHazard && iceShield)) {
        phase = 'AwaitConsonant';
        hostLines.push(`Pat: ${wedge.label}. Pick a consonant.`);
      }

      set({
        players,
        board,
        host: { lines: hostLines },
        phase: shouldPassTurn ? phase : phase, // if passing, phase is already AwaitAction
        wheel: { ...s.wheel, lastResult: newWheelResult },
        currentPlayerIndex: finalPlayerIndex
      });

      if (shouldPassTurn) {
        get().actions.passTurn();
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

      let players = s.players.map(p => ({ ...p, elementStatus: { ...p.elementStatus, queuedEffects: [...p.elementStatus.queuedEffects] } }));
      let currentPlayer = players[s.currentPlayerIndex];
      let hostLines = [...s.host.lines];
      hostLines.push(occurrences > 0 ? `Pat: ${occurrences} ${occurrences === 1 ? 'letter' : 'letters'}.` : 'Pat: No dice.');

      // Handle Fire Effect
      const fireEffect = currentPlayer.elementStatus.queuedEffects.find(e => e.type === 'FireRevealNextVowel');
      if (s.phase === 'AwaitConsonant' && occurrences > 0 && fireEffect) {
        const phraseVowels = s.board.phrase.split('').filter(c => VOWELS.has(c));
        const nextUnrevealedVowel = phraseVowels.find(v => !revealed.has(v));
        if (nextUnrevealedVowel) {
          revealed.add(nextUnrevealedVowel);
          get().actions.addNotification(`Fire revealed: ${nextUnrevealedVowel}!`, 'success');
        }
        currentPlayer.elementStatus.queuedEffects = currentPlayer.elementStatus.queuedEffects.filter(e => e.type !== 'FireRevealNextVowel');
      }

      // Update scores
      if (s.phase === 'AwaitConsonant') {
        const cash = s.wheel.lastResult?.wedge?.value ?? 0;
        if (occurrences > 0 && cash > 0) {
          currentPlayer.roundBank += cash * occurrences;
        }
      } else if (s.phase === 'BuyVowel') {
        currentPlayer.roundBank -= 250;
      }

      // Check solved
      const allLetters = new Set(s.board.phrase.split('').filter(ch => /[A-Z]/.test(ch)));
      const solved = [...allLetters].every(l => revealed.has(l));

      set({
        board: { ...s.board, guessed, revealed },
        players,
        phase: solved ? 'RoundEnd' : 'AwaitAction',
        host: { lines: hostLines },
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
      // Expire transient effects like Fire
      let players = s.players.map(p => ({ ...p, elementStatus: { ...p.elementStatus, queuedEffects: [...p.elementStatus.queuedEffects] } }));
      let currentPlayer = players[s.currentPlayerIndex];
      currentPlayer.elementStatus.queuedEffects = currentPlayer.elementStatus.queuedEffects.filter(e => e.type !== 'FireRevealNextVowel');

      const next = (s.currentPlayerIndex + 1) % players.length;
      set({ players, currentPlayerIndex: next, phase: players[next].type === 'AI' ? 'TurnAI' : 'TurnHuman' });
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

    addNotification: (message, type = 'info') => {
      const id = Date.now();
      set(state => ({ notifications: [...state.notifications, { id, message, type }] }));
      setTimeout(() => {
        set(state => ({ notifications: state.notifications.filter(n => n.id !== id) }));
      }, 3000);
    },

    startAnagramRift: () => {
      const s = get();
      const revealedLetters = [...s.board.revealed];
      if (revealedLetters.length < 3) {
        get().actions.addNotification('Need at least 3 revealed letters to start the Rift!', 'warn');
        return;
      }

      const poolLetters = [...revealedLetters];
      const uniqueLetters = new Set(poolLetters);
      if (uniqueLetters.size < 5) {
        for (let i = 0; i < s.rift.config.maxWilds; i++) {
          poolLetters.push('*');
        }
      }

      set({
        phase: 'AnagramRift',
        rift: {
          ...s.rift,
          active: true,
          poolLetters,
          usedWords: [],
          scoreCount: 0,
          timerEndsAt: Date.now() + s.rift.config.durationMs,
        }
      });

      setTimeout(() => {
        get().actions.endAnagramRift();
      }, s.rift.config.durationMs);
    },

    submitRiftWord: (word) => {
      const s = get();
      if (!s.rift.active) return;
      word = word.toUpperCase();

      if (word.length < s.rift.config.minWordLen) {
        get().actions.addNotification(`Word must be at least ${s.rift.config.minWordLen} letters!`, 'warn');
        return;
      }
      if (s.rift.usedWords.includes(word)) {
        get().actions.addNotification('Already used that word!', 'warn');
        return;
      }
      if (!DICTIONARY.has(word.toLowerCase())) {
        get().actions.addNotification('Not in dictionary!', 'warn');
        return;
      }

      // Check if letters are available in the pool
      const pool = [...s.rift.poolLetters];
      let valid = true;
      for (const char of word) {
        const index = pool.indexOf(char);
        if (index > -1) {
          pool.splice(index, 1);
        } else {
          const wildIndex = pool.indexOf('*');
          if (wildIndex > -1) {
            pool.splice(wildIndex, 1);
          } else {
            valid = false;
            break;
          }
        }
      }

      if (valid) {
        set(state => ({
          rift: { ...state.rift, usedWords: [...state.rift.usedWords, word], scoreCount: state.rift.scoreCount + 1 }
        }));
        get().actions.addNotification('+1 Word!', 'success');
      } else {
        get().actions.addNotification('Not enough letters!', 'warn');
      }
    },

    endAnagramRift: () => {
      const s = get();
      if (!s.rift.active) return;

      const score = s.rift.scoreCount;
      get().actions.addNotification(`Rift closed! You scored ${score} words.`, 'info');

      // Apply payout
      if (s.rift.config.revealMode === 'AutoReveal' && score > 0) {
        let board = { ...s.board, revealed: new Set(s.board.revealed) };
        const unrevealedConsonants = board.phrase.split('').filter(c => /[A-Z]/.test(c) && !VOWELS.has(c) && !board.revealed.has(c));
        const lettersToReveal = unrevealedConsonants.slice(0, score);
        for (const letter of lettersToReveal) {
          board.revealed.add(letter);
        }
        set({ board });
        get().actions.addNotification(`Revealed ${lettersToReveal.length} consonants!`, 'success');
      }

      // Reset rift state and return to game
      set({
        phase: 'AwaitAction',
        rift: { ...s.rift, active: false }
      });
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


