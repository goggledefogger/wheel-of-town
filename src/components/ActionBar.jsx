import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../state/store.js';

function SolveModal({ open, onSubmit, onCancel }) {
  const phrase = useGameStore(s => s.board.phrase);
  const revealed = useGameStore(s => s.board.revealed);
  const chars = phrase.split('');
  const [value, setValue] = useState(chars.map(ch => (/[A-Z]/.test(ch) && revealed.has(ch) ? ch : '')).join(''));
  const [error, setError] = useState('');
  const inputRefs = useRef([]);
  useEffect(() => {
    if (open && inputRefs.current[0]) inputRefs.current[0].focus();
  }, [open]);
  if (!open) return null;

  // Helper to update value for a specific index
  const handleInput = (idx, v) => {
    if (!/[A-Z ]?/.test(v)) return;
    const arr = value.split('');
    arr[idx] = v.toUpperCase();
    setValue(arr.join(''));
    setError('');
  };

  // Submit handler
  const handleSubmit = () => {
    const guess = value.toUpperCase();
    if (!guess.replace(/[^A-Z]/g, '').length) setError('Please enter a solution.');
    else onSubmit(guess);
  };

  return (
    <div className="modal-overlay" tabIndex={-1}>
      <div className="modal solve-modal" role="dialog" aria-modal="true" aria-label="Solve the puzzle">
        <h2>Solve the Puzzle</h2>
        <p>Type your solution below. Revealed letters are locked.</p>
        <div className="solve-board-grid">
          {chars.map((ch, idx) => {
            const isLetter = /[A-Z]/.test(ch);
            const isSpace = ch === ' ';
            const isPunct = !isLetter && !isSpace;
            const revealedLetter = isLetter && revealed.has(ch);
            return (
              <input
                key={idx}
                ref={el => inputRefs.current[idx] = el}
                className={
                  'solve-board-cell' +
                  (revealedLetter ? ' revealed' : '') +
                  (isSpace ? ' space' : '') +
                  (isPunct ? ' punct' : '')
                }
                type="text"
                maxLength={1}
                value={revealedLetter ? ch : value[idx] || ''}
                readOnly={revealedLetter || isSpace || isPunct}
                tabIndex={isSpace || isPunct ? -1 : 0}
                aria-label={isSpace ? 'space' : isPunct ? `punct ${ch}` : revealedLetter ? `revealed ${ch}` : 'letter'}
                onChange={e => handleInput(idx, e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSubmit();
                  else if (e.key === 'Escape') onCancel();
                  else if (e.key === 'ArrowLeft' && idx > 0) inputRefs.current[idx-1]?.focus();
                  else if (e.key === 'ArrowRight' && idx < chars.length-1) inputRefs.current[idx+1]?.focus();
                }}
                style={{ width: 36, height: 48, textAlign: 'center', margin: 2, fontSize: '1.25em', fontFamily: 'Merriweather, Georgia, serif' }}
              />
            );
          })}
        </div>
        {error && <div className="solve-error">{error}</div>}
        <div className="modal-actions">
          <button className="button primary" onClick={handleSubmit}>Submit</button>
          <button className="button" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function ActionBar({ onSpinHoldChange }) {
  const phase = useGameStore(s => s.phase);
  const actions = useGameStore(s => s.actions);
  const canSpin = phase === 'TurnHuman' || phase === 'AwaitAction';
  const canBuyVowel = useGameStore(s => s.canBuyVowel);
  const [showSolve, setShowSolve] = useState(false);
  const [spinningHeld, setSpinningHeld] = useState(false);

  // Notify parent (App) of held state
  useEffect(() => {
    if (onSpinHoldChange) onSpinHoldChange(spinningHeld);
  }, [spinningHeld, onSpinHoldChange]);

  // Handlers for hold-to-spin
  const handleSpinDown = e => {
    if (!canSpin) return;
    setSpinningHeld(true);
    e.preventDefault();
  };
  const handleSpinUp = e => {
    if (!canSpin) return;
    setSpinningHeld(false);
    actions.spinWheel();
    e.preventDefault();
  };
  const handleSpinLeave = e => {
    if (!canSpin) return;
    setSpinningHeld(false);
    e.preventDefault();
  };

  return (
    <>
      <div className="panel" style={{ padding: 12, display: 'flex', gap: 8 }}>
        <button
          className={"button primary" + (spinningHeld ? " spinning-held" : "")}
          disabled={!canSpin}
          data-testid="spin"
          onMouseDown={handleSpinDown}
          onMouseUp={handleSpinUp}
          onMouseLeave={handleSpinLeave}
          onTouchStart={handleSpinDown}
          onTouchEnd={handleSpinUp}
        >
          Spin
        </button>
        <button className="button" disabled={!canBuyVowel} onClick={actions.buyVowel}>Buy Vowel ($250)</button>
        <button className="button" onClick={() => setShowSolve(true)}>Solve</button>
      </div>
      <SolveModal
        open={showSolve}
        onSubmit={guess => {
          setShowSolve(false);
          if (guess) actions.attemptSolve(guess);
        }}
        onCancel={() => setShowSolve(false)}
      />
    </>
  );
}


