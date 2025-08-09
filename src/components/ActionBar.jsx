import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../state/store.js';

function SolveModal({ open, onSubmit, onCancel }) {
  const phrase = useGameStore(s => s.board.phrase);
  const revealed = useGameStore(s => s.board.revealed);
  const chars = phrase.split('');
  const [value, setValue] = useState(chars.map(ch => (/[A-Z]/.test(ch) && revealed.has(ch) ? ch : ' ')).join(''));
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  // Focus first input on open
  useEffect(() => {
    if (open) {
      const firstInput = inputRefs.current.find(ref => ref && !ref.readOnly);
      if (firstInput) firstInput.focus();
    }
  }, [open]);

  if (!open) return null;

  // Helper to update value for a specific index
  const handleInput = (idx, v) => {
    if (!/^[A-Z]?$/.test(v)) return; // Only allow letters
    const arr = value.split('');
    arr[idx] = v.toUpperCase();
    setValue(arr.join(''));
    setError('');

    // Auto-tab to next non-disabled input
    if (v) {
      for (let i = idx + 1; i < chars.length; i++) {
        if (inputRefs.current[i] && !inputRefs.current[i].readOnly) {
          inputRefs.current[i].focus();
          break;
        }
      }
    }
  };

  // Submit handler
  const handleSubmit = () => {
    const guess = value.toUpperCase();
    if (!guess.replace(/[^A-Z]/g, '').length) setError('Please enter a solution.');
    else onSubmit(guess);
  };

  // Keydown handler for backspace and navigation
  const handleKeyDown = (e, idx) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'ArrowLeft') {
      for (let i = idx - 1; i >= 0; i--) {
        if (inputRefs.current[i] && !inputRefs.current[i].readOnly) {
          inputRefs.current[i].focus();
          break;
        }
      }
    } else if (e.key === 'ArrowRight') {
      for (let i = idx + 1; i < chars.length; i++) {
        if (inputRefs.current[i] && !inputRefs.current[i].readOnly) {
          inputRefs.current[i].focus();
          break;
        }
      }
    } else if (e.key === 'Backspace' && value[idx] === ' ') {
      for (let i = idx - 1; i >= 0; i--) {
        if (inputRefs.current[i] && !inputRefs.current[i].readOnly) {
          const arr = value.split('');
          arr[i] = ' ';
          setValue(arr.join(''));
          inputRefs.current[i].focus();
          break;
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
                value={value[idx] === ' ' ? '' : value[idx]}
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
                  backgroundColor: isEditable ? 'white' : 'lightgray',
                  color: 'black',
                  border: isEditable ? '1px solid #ccc' : '1px solid transparent',
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


