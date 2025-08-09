import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../../state/store.js';

export default function GameSummary() {
  const players = useGameStore(s => s.players);
  const actions = useGameStore(s => s.actions);
  const winner = [...players].sort((a, b) => b.totalBank - a.totalBank)[0];
  const confettiRef = useRef();

  useEffect(() => {
    // Simple confetti burst using emoji
    const confetti = confettiRef.current;
    if (confetti) {
      confetti.innerHTML = Array.from({length: 60}, (_,i) => `<span style='font-size:${18+Math.random()*22}px; position:absolute; left:${Math.random()*100}vw; top:${Math.random()*80}vh; transform:rotate(${Math.random()*360}deg);'>🎉</span>`).join('');
      setTimeout(() => { confetti.innerHTML = ''; }, 2500);
    }
  }, []);

  return (
    <div className="game-summary round-summary">
      <div ref={confettiRef} className="confetti" aria-hidden="true"></div>
      <h2>Game Over</h2>
      <div>Winner: {winner?.name}</div>
      <ul>
        {players.map(p => (
          <li key={p.id}>{p.name}: ${p.totalBank}</li>
        ))}
      </ul>
      <button onClick={actions.restart}>Play Again</button>
    </div>
  );
}


