import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../state/store';
import './AnagramRift.css';

export default function AnagramRiftModal() {
  const riftState = useGameStore(s => s.rift);
  const submitWord = useGameStore(s => s.actions.submitRiftWord);
  const [word, setWord] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (riftState.active) {
      inputRef.current?.focus();
    }
  }, [riftState.active]);

  if (!riftState.active) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (word.trim()) {
      submitWord(word.trim());
      setWord('');
    }
  };

  const timeLeft = Math.max(0, Math.ceil((riftState.timerEndsAt - Date.now()) / 1000));

  return (
    <div className="modal-overlay anagram-rift">
      <div className="modal">
        <h2>Anagram Rift</h2>
        <div className="timer">Time Left: {timeLeft}s</div>

        <div className="letter-pool">
          {riftState.poolLetters.map((letter, i) => (
            <span key={i} className="letter-tile">{letter}</span>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            className="word-input"
            placeholder="Type a word..."
            autoFocus
          />
          <button type="submit" className="button primary">Submit</button>
        </form>

        <div className="submitted-words">
          <h3>Used Words ({riftState.scoreCount})</h3>
          <ul>
            {riftState.usedWords.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
