/**
 * VORTEX GLIDE — Entrypoint
 * Spec Section 66: Bootstrap application on load
 */

import { Game } from './core/Game.js';

// Global error boundary — prevents silent crashes
window.onerror = (msg, src, line, col, err) => {
  console.error(`[VortexGlide] Uncaught error: ${msg} at ${src}:${line}:${col}`, err);
  return false;
};

window.addEventListener('unhandledrejection', (event) => {
  console.error('[VortexGlide] Unhandled promise rejection:', event.reason);
});

function bootstrap() {
  try {
    const game = new Game();
    game.start();

    // Attach to window for developer test mode & debugging (Spec Section 69-70)
    window.__VORTEX_GLIDE__ = game;
    console.log('%c⚡ VORTEX GLIDE LOADED SUCCESSFULLY ⚡', 'color: #00f3ff; font-weight: bold; font-size: 14px;');
  } catch (err) {
    console.error('[Main] Failed to initialize Vortex Glide:', err);
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
