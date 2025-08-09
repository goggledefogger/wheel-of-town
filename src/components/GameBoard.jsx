import React from 'react';
import { useGameStore } from '../state/store.js';

export default function GameBoard() {
  const category = useGameStore(s => s.board.category);
  const phrase = useGameStore(s => s.board.phrase);
  const revealed = useGameStore(s => s.board.revealed);

  const chars = phrase.split('');
  return (
    <div className="board">
      <div style={{ marginBottom: 8, opacity: 0.8 }}>Category: {category}</div>
      <div className="board-tiles">
        {chars.map((ch, idx) => {
          const isLetter = /[A-Z]/.test(ch);
          const isSpace = ch === ' ';
          const isPunct = !isLetter && !isSpace;
          const show = isSpace || isPunct || revealed.has(ch);
          const cls = ['tile'];
          if (show && isLetter) cls.push('revealed');
          if (isSpace) cls.push('space');
          if (isPunct) cls.push('punct');
          return (
            <div key={idx} className={cls.join(' ')} aria-label={isSpace ? 'space' : isPunct ? `punct ${ch}` : 'letter'}>
              {show ? ch : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}


