import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { startMockWorker } from 'flexa-ui-kit/mocks/browser';
import 'flexa-ui-kit/styles.css';
import './kitchen.css';
import './screens/screens.css';
import { App } from './App';

/**
 * Boot the MSW mock backend before the first render so the reference screens
 * (U11) never race an unmocked fetch, then mount under a HashRouter (static-
 * export safe — no server rewrite rules needed for the kitchen-sink build).
 */
async function boot() {
  await startMockWorker();
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </StrictMode>,
  );
}

void boot();
