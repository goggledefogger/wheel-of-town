import React from 'react';

const ICONS = {
  Fire: '🔥',
  Ice: '❄️',
  Lightning: '⚡️',
};

export default function ElementStatusUI({ status }) {
  if (!status || status.comboCount < 1 || !status.lastElement || status.lastElement === 'None') {
    return null;
  }

  const icon = ICONS[status.lastElement];
  const comboCount = status.comboCount;

  return (
    <div className="element-status">
      <span className="icon">{icon}</span>
      {comboCount >= 2 && <span className="combo-count">x{comboCount}</span>}
    </div>
  );
}
