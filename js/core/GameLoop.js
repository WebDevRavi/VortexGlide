/**
 * VORTEX GLIDE — GameLoop
 * Spec Section 31-32, 110, 115: Single authoritative animation loop with delta-time safety
 */

export class GameLoop {
  constructor(onUpdate, onRender) {
    this.onUpdate = onUpdate;
    this.onRender = onRender;
    this.isRunning = false;
    this._rafId = null;
    this._lastTime = 0;
    
    // Safety thresholds: clamp maximum dt to 0.1s (100ms) to avoid teleporting
    this.maxDeltaTime = 0.1;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this._lastTime = performance.now();
    this._tick = this._tick.bind(this);
    this._rafId = requestAnimationFrame(this._tick);
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  resetTiming() {
    this._lastTime = performance.now();
  }

  _tick(currentTime) {
    if (!this.isRunning) return;

    let dt = (currentTime - this._lastTime) / 1000.0;
    this._lastTime = currentTime;

    // Guard against negative, NaN, or massive delta spikes after tab switch/backgrounding
    if (isNaN(dt) || dt < 0) {
      dt = 0.016;
    } else if (dt > this.maxDeltaTime) {
      dt = this.maxDeltaTime;
    }

    try {
      if (this.onUpdate) {
        this.onUpdate(dt);
      }
      if (this.onRender) {
        this.onRender(dt);
      }
    } catch (err) {
      console.error('[GameLoop] Error during tick execution:', err);
    }

    if (this.isRunning) {
      this._rafId = requestAnimationFrame(this._tick);
    }
  }
}
