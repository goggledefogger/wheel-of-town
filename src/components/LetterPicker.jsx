import React from 'react';
import { useGameStore } from '../state/store.js';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const VOWELS = new Set(['A','E','I','O','U']);

export default function LetterPicker() {
  const phase = useGameStore(s => s.phase);
  const guessed = useGameStore(s => s.board.guessed);
  const actions = useGameStore(s => s.actions);
  const buyingVowel = phase === 'BuyVowel';
  const canGuess = phase === 'AwaitConsonant' || buyingVowel;

  return (
    <div className="letter-grid" role="group" aria-label="Letters">
      {LETTERS.map(l => {
        const isGuessed = guessed.has(l);
        const isVowel = VOWELS.has(l);
        const disabled = isGuessed || !canGuess || (!buyingVowel && isVowel) || (buyingVowel && !isVowel);
        return (
          <button key={l} disabled={disabled} onClick={() => actions.pickLetter(l)} aria-label={`Letter ${l}`}>
            {l}
          </button>
        );
      })}
    </div>
  );
}


