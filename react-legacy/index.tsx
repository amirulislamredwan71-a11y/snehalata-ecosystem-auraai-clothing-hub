import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

// Safety mock for process.env in the browser to prevent "process is not defined" errors
if (typeof window !== 'undefined') {
  (window as any).process = (window as any).process || {};
  (window as any).process.env = (window as any).process.env || {};
  (window as any).process.env.NODE_ENV = (window as any).process.env.NODE_ENV || 'development';

  window.addEventListener('error', (event) => {
    console.error('GLOBAL ERROR:', event.error);
    const errorDiv = document.createElement('div');
    errorDiv.id = 'debug-error-overlay';
    errorDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:rgba(255,0,0,0.9);color:white;z-index:10000;padding:20px;font-family:monospace;font-size:10px;max-height:50vh;overflow:auto;pointer-events:none;';
    errorDiv.innerHTML = `
      <div style="font-weight:bold;margin-bottom:10px;">🔴 ERROR CAUGHT</div>
      <div>MSG: ${event.message}</div>
      <div>FILE: ${event.filename}:${event.lineno}</div>
      <div>STACK: <pre style="white-space:pre-wrap;">${event.error?.stack || 'NO STACK'}</pre></div>
    `;
    document.body.appendChild(errorDiv);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('UNHANDLED REJECTION:', event.reason);
    const errorDiv = document.createElement('div');
    errorDiv.id = 'debug-rejection-overlay';
    errorDiv.style.cssText = 'position:fixed;bottom:0;left:0;width:100%;background:rgba(255,100,0,0.9);color:white;z-index:10000;padding:20px;font-family:monospace;font-size:10px;max-height:50vh;overflow:auto;pointer-events:none;';
    errorDiv.innerHTML = `
      <div style="font-weight:bold;margin-bottom:10px;">🟠 REJECTION CAUGHT</div>
      <div>REASON: ${String(event.reason)}</div>
      <div>STACK: <pre style="white-space:pre-wrap;">${event.reason?.stack || 'NO STACK'}</pre></div>
    `;
    document.body.appendChild(errorDiv);
  });
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Root element not found");
}