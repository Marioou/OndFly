import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { registerServiceWorker } from './serviceWorkerRegistration';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// Register service worker to enable PWA features
registerServiceWorker();