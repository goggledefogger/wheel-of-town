import React, { useState } from 'react';
import { useGameStore } from './state/store.js';
import WheelStage3D from './components/WheelStage3D.jsx';
import GameBoard from './components/GameBoard.jsx';
import ActionBar from './components/ActionBar.jsx';
import LetterPicker from './components/LetterPicker.jsx';
import HostDialogue from './components/Hosts/HostDialogue.jsx';
import RoundSummary from './components/Summary/RoundSummary.jsx';
import GameSummary from './components/Summary/GameSummary.jsx';

export default function App() {
  const phase = useGameStore(s => s.phase);
  const players = useGameStore(s => s.players);
  const currentPlayerIndex = useGameStore(s => s.currentPlayerIndex);
  const guessed = useGameStore(s => s.board.guessed);
  const hostLines = useGameStore(s => s.host.lines);
  const startGame = useGameStore(s => s.actions.startGame);
  const spinToken = useGameStore(s => s.spinToken);
  const onSpinComplete = useGameStore(s => s.actions.onSpinComplete);
  const [spinningHeld, setSpinningHeld] = useState(false);

  return (
    <div className="app-shell">
      {/* Test hooks, always present */}
      <div style={{position:'absolute',left:-9999,top:-9999}} aria-hidden data-testid="phase">{phase}</div>
      <div style={{position:'absolute',left:-9999,top:-9999}} aria-hidden data-testid="currentPlayerIndex">{currentPlayerIndex}</div>
      <div style={{position:'absolute',left:-9999,top:-9999}} aria-hidden data-testid="guessedCount">{guessed.size}</div>
      <div style={{position:'absolute',left:-9999,top:-9999}} aria-hidden data-testid="hostLineCount">{hostLines.length}</div>
      {phase === 'Title' && (
        <div className="title-screen">
          <h1>Wheel Of Town</h1>
          <button className="button accent" data-testid="start" onClick={startGame}>Start Game</button>
        </div>
      )}

      {phase !== 'Title' && phase !== 'GameEnd' && (
        <div className="game-layout">
          <header className="hud">
            <div className="players">
              {players.map((p, i) => (
                <div key={p.id} className={"player" + (i === currentPlayerIndex ? ' active' : '')}>
                  <div className="name">{p.name}</div>
                  <div className="scores">
                    <span>${p.roundBank}</span>
                    <span className="total">Total: ${p.totalBank}</span>
                  </div>
                </div>
              ))}
            </div>
          </header>

          <main className="stage">
            <aside className="host-area">
              <HostDialogue />
            </aside>
            <section className="board-area">
              <GameBoard />
              <div className="actions">
                <ActionBar onSpinHoldChange={setSpinningHeld} />
              </div>
              <LetterPicker />
            </section>
            <section className="wheel-area">
              <WheelStage3D spinToken={spinToken} onSpinEnd={onSpinComplete} spinningHeld={spinningHeld} />
            </section>
          </main>
        </div>
      )}

      {phase === 'RoundEnd' && (
        <RoundSummary />
      )}

      {phase === 'GameEnd' && (
        <GameSummary />
      )}
    </div>
  );
}


