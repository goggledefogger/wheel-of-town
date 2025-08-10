import React from 'react';
import { useGameStore } from '../state/store.js';

export default function GameBoard() {
  const category = useGameStore(s => s.board.category);
  const phrase = useGameStore(s => s.board.phrase);
  const revealed = useGameStore(s => s.board.revealed);

  // Split by groups of spaces, keeping the spaces.
  // This will alternate between words and spaces.
  // e.g., "WORD  ANOTHER" -> ["WORD", "  ", "ANOTHER"]
  // e.g., " HELLO " -> ["", " ", "HELLO", " ", ""]
  // Filter out empty strings from the result of split.
  const parts = phrase.split(/(\s+)/).filter(part => part.length > 0);

  return (
    <div className="board">
      <div style={{ marginBottom: 8, opacity: 0.8 }}>Category: {category}</div>
      <div className="board-tiles">
        {parts.map((part, partIdx) => {
          if (/\s+/.test(part)) {
            // This part is one or more spaces. Render a space tile for each space.
            return part.split('').map((space, spaceIdx) => (
              <div key={`${partIdx}-${spaceIdx}`} className="tile space" aria-label="space">
                {' '}
              </div>
            ));
          } else {
            // This part is a word.
            return (
              <div key={partIdx} className="word">
                {part.split('').map((ch, charIdx) => {
                  const isLetter = /[A-Z]/.test(ch);
                  const isPunct = !isLetter;
                  const show = isPunct || revealed.has(ch);
                  const cls = ['tile'];
                  if (show && isLetter) cls.push('revealed');
                  if (isPunct) cls.push('punct');
                  return (
                    <div key={charIdx} className={cls.join(' ')} aria-label={isPunct ? `punct ${ch}` : 'letter'}>
                      {show ? ch : ''}
                    </div>
                  );
                })}
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}


