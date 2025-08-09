import React, { useEffect, useState } from 'react';
import { useGameStore } from '../state/store.js';

export default function GameBoard() {
  const category = useGameStore(s => s.board.category);
  const phrase = useGameStore(s => s.board.phrase);
  const revealed = useGameStore(s => s.board.revealed);
  const [animatingTiles, setAnimatingTiles] = useState(new Set());
  const [prevRevealed, setPrevRevealed] = useState(new Set());

  // Animate newly revealed tiles
  useEffect(() => {
    const newlyRevealed = new Set();
    for (const letter of revealed) {
      if (!prevRevealed.has(letter)) {
        newlyRevealed.add(letter);
      }
    }
    
    if (newlyRevealed.size > 0) {
      setAnimatingTiles(newlyRevealed);
      // Clear animation after delay
      const timer = setTimeout(() => {
        setAnimatingTiles(new Set());
      }, 600);
      
      setPrevRevealed(new Set(revealed));
      
      return () => clearTimeout(timer);
    }
  }, [revealed, prevRevealed]);

  const chars = phrase.split('');
  return (
    <div className="board">
      <div className="category-label">Category: {category}</div>
      <div className="board-tiles">
        {chars.map((ch, idx) => {
          const isLetter = /[A-Z]/.test(ch);
          const isSpace = ch === ' ';
          const isPunct = !isLetter && !isSpace;
          const show = isSpace || isPunct || revealed.has(ch);
          const isAnimating = isLetter && animatingTiles.has(ch);
          
          const cls = ['tile'];
          if (show && isLetter) cls.push('revealed');
          if (isSpace) cls.push('space');
          if (isPunct) cls.push('punct');
          if (isAnimating) cls.push('animating');
          
          return (
            <div 
              key={idx} 
              className={cls.join(' ')} 
              style={{ animationDelay: `${Math.random() * 0.3}s` }}
              aria-label={isSpace ? 'space' : isPunct ? `punct ${ch}` : 'letter'}
            >
              {show ? (
                <span className="tile-content">{ch}</span>
              ) : (
                <div className="tile-placeholder"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


