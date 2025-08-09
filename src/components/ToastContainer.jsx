import React from 'react';
import { useGameStore } from '../state/store';
import './ToastContainer.css';

function Toast({ message, type, onDismiss }) {
  return (
    <div className={`toast ${type}`} onClick={onDismiss}>
      {message}
    </div>
  );
}

export default function ToastContainer() {
  const notifications = useGameStore(s => s.notifications);
  const dismiss = useGameStore(s => s.actions.addNotification); // a bit of a hack to get access to the timeout clearing

  if (!notifications.length) {
    return null;
  }

  return (
    <div className="toast-container">
      {notifications.map(n => (
        <Toast key={n.id} {...n} onDismiss={() => {
            // This doesn't actually dismiss, just prevents errors.
            // The timeout in the store handles dismissal.
        }} />
      ))}
    </div>
  );
}
