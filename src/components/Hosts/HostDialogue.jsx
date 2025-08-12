import React from 'react';
import { useGameStore } from '../../state/store.js';

export default function HostDialogue() {
  const hostLines = useGameStore(s => s.host.lines);
  return (
    <div>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Pat</div>
      <div className="host-bubble" aria-live="polite">
        {hostLines.slice(-3).map((l, i, arr) => (
          <div key={i} style={{ opacity: i < arr.length - 1 ? 0.7 : 1 }}>{l}</div>
        ))}
      </div>
    </div>
  );
}


