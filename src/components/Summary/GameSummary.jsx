import React from 'react';
import { useGameStore } from '../../state/store.js';

export default function GameSummary() {
  const players = useGameStore(s => s.players);
  const actions = useGameStore(s => s.actions);
  const winner = [...players].sort((a, b) => b.totalBank - a.totalBank)[0];
  return (
    <div style={{ padding: 24 }}>
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


