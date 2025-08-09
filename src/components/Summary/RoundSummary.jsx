import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../../state/store.js';

export default function RoundSummary() {
  const players = useGameStore(s => s.players);
  const actions = useGameStore(s => s.actions);
  const confettiRef = useRef();

  useEffect(() => {
    // Simple confetti burst using emoji
    const confetti = confettiRef.current;
    if (confetti) {
      confetti.innerHTML = Array.from({length: 40}, (_,i) => `<span style='font-size:${16+Math.random()*18}px; position:absolute; left:${Math.random()*100}vw; top:${Math.random()*80}vh; transform:rotate(${Math.random()*360}deg);'>🎊</span>`).join('');
      setTimeout(() => { confetti.innerHTML = ''; }, 2200);
    }
  }, []);

  return (
    <div className="round-summary">
      <div ref={confettiRef} className="confetti" aria-hidden="true"></div>
      <h2>Round Complete</h2>
      <ul>
        {players.map(p => (
          <li key={p.id}>{p.name}: Round ${p.roundBank} — Total ${p.totalBank}</li>
        ))}
      </ul>
      <button onClick={actions.nextRound}>Next Round</button>
    </div>
  );
}


