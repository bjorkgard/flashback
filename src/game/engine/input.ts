/**
 * Input System
 * 
 * Manages keyboard input state with deterministic sampling at fixed timesteps.
 * Tracks current and previous frame state to detect key presses and releases.
 * 
 * @module engine/input
 */

/**
 * Input system that tracks keyboard state for deterministic gameplay.
 * 
 * The input system maintains two maps: current frame keys and previous frame keys.
 * This allows detection of key press/release events that occurred between frames.
 * 
 * Input is sampled deterministically at each fixed timestep update, ensuring
 * consistent gameplay regardless of frame rate.
 * 
 * @example
 * ```typescript
 * const input = new InputSystem();
 * 
 * // In game loop fixed update:
 * input.update(); // Call at start of each fixed timestep
 * 
 * if (input.isDown('KeyW')) {
 *   // W key is currently held
 * }
 * 
 * if (input.wasPressed('Space')) {
 *   // Space was just pressed this frame
 * }
 * 
 * if (input.wasReleased('KeyA')) {
 *   // A was just released this frame
 * }
 * ```
 */
export class InputSystem {
  /** Current frame keyboard state */
  private keys: Map<string, boolean> = new Map();
  
  /** Previous frame keyboard state for detecting press/release */
  private prevKeys: Map<string, boolean> = new Map();
  
  /**
   * Creates a new input system and registers keyboard event listeners.
   * 
   * Automatically attaches keydown and keyup listeners to the window.
   * These listeners update the internal key state map.
   */
  constructor() {
    // Register keyboard event listeners
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }
  
  /**
   * Handles keydown events from the browser.
   * 
   * @param e - Keyboard event
   * @private
   */
  private handleKeyDown(e: KeyboardEvent): void {
    this.keys.set(e.code, true);
  }
  
  /**
   * Handles keyup events from the browser.
   * 
   * @param e - Keyboard event
   * @private
   */
  private handleKeyUp(e: KeyboardEvent): void {
    this.keys.set(e.code, false);
  }
  
  /**
   * Updates input state for the current frame.
   * 
   * MUST be called at the start of each fixed timestep update.
   * Copies current key state to previous state for press/release detection.
   * 
   * This ensures deterministic input sampling - input is only checked
   * during fixed updates, not during variable-rate rendering.
   */
  update(): void {
    // Copy current state to previous for next frame comparison
    this.prevKeys = new Map(this.keys);
  }
  
  /**
   * Checks if a key is currently held down.
   * 
   * @param key - Key code to check (e.g., 'KeyW', 'Space', 'ArrowUp')
   * @returns True if the key is currently pressed
   * 
   * @example
   * ```typescript
   * if (input.isDown('KeyW')) {
   *   player.moveForward();
   * }
   * ```
   */
  isDown(key: string): boolean {
    return this.keys.get(key) || false;
  }
  
  /**
   * Checks if a key was just pressed this frame.
   * 
   * Returns true only on the frame where the key transitions from up to down.
   * 
   * @param key - Key code to check (e.g., 'KeyW', 'Space', 'ArrowUp')
   * @returns True if the key was pressed this frame (down now, up last frame)
   * 
   * @example
   * ```typescript
   * if (input.wasPressed('Space')) {
   *   player.jump();
   * }
   * ```
   */
  wasPressed(key: string): boolean {
    const isDownNow = this.keys.get(key) || false;
    const wasDownBefore = this.prevKeys.get(key) || false;
    return isDownNow && !wasDownBefore;
  }
  
  /**
   * Checks if a key was just released this frame.
   * 
   * Returns true only on the frame where the key transitions from down to up.
   * 
   * @param key - Key code to check (e.g., 'KeyW', 'Space', 'ArrowUp')
   * @returns True if the key was released this frame (up now, down last frame)
   * 
   * @example
   * ```typescript
   * if (input.wasReleased('ShiftLeft')) {
   *   player.stopRunning();
   * }
   * ```
   */
  wasReleased(key: string): boolean {
    const isDownNow = this.keys.get(key) || false;
    const wasDownBefore = this.prevKeys.get(key) || false;
    return !isDownNow && wasDownBefore;
  }
  
  /**
   * Cleans up event listeners.
   * 
   * Should be called when the input system is no longer needed
   * to prevent memory leaks.
   */
  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
  }
}
