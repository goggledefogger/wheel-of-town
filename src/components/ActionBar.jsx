import React from 'react';
import { useGameStore } from '../state/store.js';

export default function ActionBar() {
  const phase = useGameStore(s => s.phase);
  const actions = useGameStore(s => s.actions);
  const canSpin = phase === 'TurnHuman' || phase === 'AwaitAction';
  const canBuyVowel = useGameStore(s => s.canBuyVowel);

  return (
    <div className="panel" style={{ padding: 12, display: 'flex', gap: 8 }}>
      <button className="button primary" disabled={!canSpin} data-testid="spin" onClick={actions.spinWheel}>Spin</button>
      <button className="button" disabled={!canBuyVowel} onClick={actions.buyVowel}>Buy Vowel ($250)</button>
      <button className="button" onClick={() => {
        const guess = window.prompt('Enter your solution (uppercase):');
        if (guess) actions.attemptSolve(guess.toUpperCase());
      }}>Solve</button>
    </div>
  );
}


