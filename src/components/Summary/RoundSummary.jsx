import React from 'react';
import { useGameStore } from '../../state/store.js';

export default function RoundSummary() {
  const players = useGameStore(s => s.players);
  const actions = useGameStore(s => s.actions);
  return (
    <div style={{ padding: 24 }}>
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


