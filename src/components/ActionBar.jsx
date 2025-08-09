import React, { useState } from 'react';
import { useGameStore } from '../state/store.js';

export default function ActionBar() {
  const phase = useGameStore(s => s.phase);
  const actions = useGameStore(s => s.actions);
  const canSpin = phase === 'TurnHuman' || phase === 'AwaitAction';
  const canBuyVowel = useGameStore(s => s.canBuyVowel);
  const [showSolveModal, setShowSolveModal] = useState(false);
  const [solveGuess, setSolveGuess] = useState('');

  const handleSolve = () => {
    if (solveGuess.trim()) {
      actions.attemptSolve(solveGuess.toUpperCase());
      setShowSolveModal(false);
      setSolveGuess('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSolve();
    } else if (e.key === 'Escape') {
      setShowSolveModal(false);
      setSolveGuess('');
    }
  };

  return (
    <>
      <div className="panel enhanced" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button className="button primary" disabled={!canSpin} data-testid="spin" onClick={actions.spinWheel}>
          🎯 Spin Wheel
        </button>
        <button className="button" disabled={!canBuyVowel} onClick={actions.buyVowel}>
          💎 Buy Vowel ($250)
        </button>
        <button className="button accent" onClick={() => setShowSolveModal(true)}>
          🧩 Solve Puzzle
        </button>
      </div>

      {showSolveModal && (
        <div className="modal-overlay" onClick={() => setShowSolveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Solve the Puzzle</h3>
            <input
              type="text"
              value={solveGuess}
              onChange={(e) => setSolveGuess(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter your solution..."
              className="solve-input"
              autoFocus
            />
            <div className="modal-buttons">
              <button className="button primary" onClick={handleSolve} disabled={!solveGuess.trim()}>
                Submit
              </button>
              <button className="button" onClick={() => setShowSolveModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


