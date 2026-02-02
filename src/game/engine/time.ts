/**
 * Time System
 * 
 * Manages game time, delta time, and frame counting for fixed timestep updates.
 * Provides timing information to the game loop and other systems.
 * 
 * @module engine/time
 */

/**
 * Time system that tracks elapsed time, delta time, and frame count.
 * 
 * The time system is used by the game loop to implement fixed timestep updates
 * with an accumulator pattern. It tracks:
 * - Current time (milliseconds since game start)
 * - Delta time (milliseconds since last frame)
 * - Frame count (total number of fixed updates)
 * - Accumulator (leftover time for fixed timestep)
 * 
 * @example
 * ```typescript
 * const time = new TimeSystem();
 * 
 * function gameLoop(currentTime: number) {
 *   const deltaTime = time.update(currentTime);
 *   
 *   // Use deltaTime for fixed timestep accumulator
 *   time.accumulator += deltaTime;
 *   
 *   while (time.accumulator >= time.fixedDt) {
 *     // Fixed update
 *     time.incrementFrame();
 *     time.accumulator -= time.fixedDt;
 *   }
 *   
 *   requestAnimationFrame(gameLoop);
 * }
 * ```
 */
export class TimeSystem {
  /** Current time in milliseconds since game start */
  private currentTime: number = 0;
  
  /** Previous frame time in milliseconds */
  private lastTime: number = 0;
  
  /** Delta time in milliseconds since last frame */
  private deltaTime: number = 0;
  
  /** Total number of fixed timestep updates executed */
  private frameCount: number = 0;
  
  /** Accumulator for fixed timestep (milliseconds) */
  public accumulator: number = 0;
  
  /** Fixed timestep duration in milliseconds (16.67ms = 60Hz) */
  public readonly fixedDt: number = 1000 / 60;
  
  /**
   * Creates a new time system.
   * 
   * @param startTime - Optional starting time in milliseconds (default: 0)
   */
  constructor(startTime: number = 0) {
    this.currentTime = startTime;
    this.lastTime = startTime;
  }
  
  /**
   * Updates the time system with the current frame time.
   * 
   * Should be called once per frame at the start of the game loop.
   * Calculates delta time and updates current time.
   * 
   * @param currentTime - Current time in milliseconds (from performance.now())
   * @returns Delta time in milliseconds since last update
   * 
   * @example
   * ```typescript
   * function gameLoop(timestamp: number) {
   *   const dt = time.update(timestamp);
   *   // Use dt for accumulator
   *   requestAnimationFrame(gameLoop);
   * }
   * ```
   */
  update(currentTime: number): number {
    this.deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    this.currentTime = currentTime;
    return this.deltaTime;
  }
  
  /**
   * Increments the frame counter.
   * 
   * Should be called once per fixed timestep update.
   * Used to track total number of game logic updates.
   */
  incrementFrame(): void {
    this.frameCount++;
  }
  
  /**
   * Gets the current time in milliseconds.
   * 
   * @returns Current time since game start
   */
  getCurrentTime(): number {
    return this.currentTime;
  }
  
  /**
   * Gets the delta time in milliseconds.
   * 
   * @returns Time elapsed since last frame
   */
  getDeltaTime(): number {
    return this.deltaTime;
  }
  
  /**
   * Gets the current frame count.
   * 
   * @returns Total number of fixed timestep updates
   */
  getFrameCount(): number {
    return this.frameCount;
  }
  
  /**
   * Gets the fixed timestep duration in milliseconds.
   * 
   * @returns Fixed timestep (16.67ms for 60Hz)
   */
  getFixedDt(): number {
    return this.fixedDt;
  }
  
  /**
   * Gets the fixed timestep duration in seconds.
   * 
   * Useful for physics calculations that expect time in seconds.
   * 
   * @returns Fixed timestep in seconds (0.01667s for 60Hz)
   */
  getFixedDtSeconds(): number {
    return this.fixedDt / 1000;
  }
  
  /**
   * Resets the time system to initial state.
   * 
   * Useful for restarting the game or resetting after pause.
   * 
   * @param startTime - Optional new starting time (default: 0)
   */
  reset(startTime: number = 0): void {
    this.currentTime = startTime;
    this.lastTime = startTime;
    this.deltaTime = 0;
    this.frameCount = 0;
    this.accumulator = 0;
  }
}
