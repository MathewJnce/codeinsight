import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// ERROR SUPPRESSION (Fixes ResizeObserver Red Screen)
window.addEventListener('error', (e) => {
  if (e.message && e.message.includes('ResizeObserver loop')) {
    e.stopImmediatePropagation();
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);