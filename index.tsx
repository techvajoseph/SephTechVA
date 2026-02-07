
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const mountApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error("Mounting Error:", err);
    rootElement.innerHTML = `<div style="padding:40px; text-align:center;">
      <h2 style="color:#ef4444;">App failed to start</h2>
      <p style="color:#64748b;">This usually happens if a dependency fails to load.</p>
      <button onclick="window.location.reload()" style="background:#2563eb; color:white; padding:10px 20px; border-radius:8px; border:none; cursor:pointer;">Reload App</button>
    </div>`;
  }
};

// Start the app
mountApp();
