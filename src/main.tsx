import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

/**
 * Renders the SteamSweep application into the root element.
 */
createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
