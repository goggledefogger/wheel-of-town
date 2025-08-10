import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../state/store.js';

function SolveModal({ open, onSubmit, onCancel }) {
  const phrase = useGameStore(s => s.board.phrase);
  const revealed = useGameStore(s => s.board.revealed);
  const chars = phrase.split('');
  const [values, setValues] = useState([]);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  // Initialize values on open
  useEffect(() => {
    if (open) {
      setValues(chars.map(ch => (/[A-Z]/.test(ch) && revealed.has(ch) ? ch : null)));
      const firstInput = inputRefs.current.find(ref => ref && !ref.readOnly);
      if (firstInput) firstInput.focus();
    }
  }, [open, phrase, revealed]);

  if (!open) return null;

  // Helper to update value for a specific index
  const handleInput = (idx, v) => {
    if (!/^[a-zA-Z]?$/.test(v)) return;
    const newValues = [...values];
    newValues[idx] = v.toUpperCase() || null;
    setValues(newValues);
    setError('');

    if (v) { // Auto-tab to next non-disabled input
      const nextInput = inputRefs.current.slice(idx + 1).find(ref => ref && !ref.readOnly);
      if (nextInput) nextInput.focus();
    }
  };

  // Submit handler
  const handleSubmit = () => {
    const guess = chars.map((ch, i) => (values[i] || (/[A-Z]/.test(ch) ? ' ' : ch))).join('');
    if (values.every(v => v === null)) setError('Please enter a solution.');
    else onSubmit(guess);
  };

  // Keydown handler for backspace and navigation
  const handleKeyDown = (e, idx) => {
    if (e.key === 'Enter') handleSubmit();
    else if (e.key === 'Escape') onCancel();
    else if (e.key === 'ArrowLeft') {
      const prevInput = inputRefs.current.slice(0, idx).reverse().find(ref => ref && !ref.readOnly);
      if (prevInput) prevInput.focus();
    } else if (e.key === 'ArrowRight') {
      const nextInput = inputRefs.current.slice(idx + 1).find(ref => ref && !ref.readOnly);
      if (nextInput) nextInput.focus();
    } else if (e.key === 'Backspace') {
      if (values[idx]) {
        const newValues = [...values];
        newValues[idx] = null;
        setValues(newValues);
      } else {
        const prevInput = inputRefs.current.slice(0, idx).reverse().find(ref => ref && !ref.readOnly);
        if (prevInput) {
          const prevIdx = inputRefs.current.indexOf(prevInput);
          const newValues = [...values];
          newValues[prevIdx] = null;
          setValues(newValues);
          prevInput.focus();
        }
      }
    }
  };

  return (
    <div className="modal-overlay" tabIndex={-1} onClick={onCancel}>
      <div className="modal solve-modal" role="dialog" aria-modal="true" aria-label="Solve the puzzle" onClick={e => e.stopPropagation()}>
        <h2>Solve the Puzzle</h2>
        <p>Type your solution below. Revealed letters are locked.</p>
        <div className="solve-board-grid">
          {chars.map((ch, idx) => {
            const isLetter = /[A-Z]/.test(ch);
            const isSpace = ch === ' ';
            const isPunct = !isLetter && !isSpace;
            const revealedLetter = isLetter && revealed.has(ch);
            const isEditable = isLetter && !revealedLetter;

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
                value={values[idx] || ''}
                readOnly={!isEditable}
                tabIndex={isEditable ? 0 : -1}
                aria-label={isSpace ? 'space' : isPunct ? `punct ${ch}` : revealedLetter ? `revealed ${ch}` : `letter ${idx+1}`}
                onChange={e => handleInput(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(e, idx)}
                style={{
                  width: 36,
                  height: 48,
                  textAlign: 'center',
                  margin: 2,
                  fontSize: '1.25em',
                  fontFamily: 'Merriweather, Georgia, serif',
                  backgroundColor: isEditable ? 'white' : '#444',
                  color: isPunct ? 'white' : 'black',
                  border: isEditable ? '1px solid #ccc' : '1px solid #222',
                  borderRadius: 4,
                  cursor: isEditable ? 'text' : 'default'
                }}
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
        <button className="button" disabled={!canSpin} onClick={() => setShowSolve(true)}>Solve</button>
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


