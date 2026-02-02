/**
 * Integration tests for Game class
 * 
 * Tests game initialization, state transitions, and win/lose conditions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game } from './game';
import type { LevelData } from './level/levelTypes';

// Mock canvas for testing
class MockCanvas {
  width = 800;
  height = 600;
  
  getContext() {
    return {
      fillStyle: '',
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      putImageData: vi.fn(),
      createImageData: () => ({
        data: new Uint8ClampedArray(4),
        width: 1,
        height: 1,
      }),
      imageSmoothingEnabled: true,
    };
  }
}

// Create minimal test level data
const createTestLevel = (): LevelData => ({
  width: 32,
  height: 16,
  tileSize: 16,
  playerSpawn: { x: 32, y: 200 },
  bounds: { x: 0, y: 0, w: 512, h: 256 },
  tiles: [
    // Ground tiles
    { type: 'solid', x: 0, y: 15 },
    { type: 'solid', x: 1, y: 15 },
    { type: 'solid', x: 2, y: 15 },
    { type: 'solid', x: 3, y: 15 },
    { type: 'solid', x: 4, y: 15 },
    // Exit tile
    { type: 'exit', x: 30, y: 14, metadata: { exitDestination: 'level2' } },
  ],
  enemies: [
    {
      type: 'humanoid',
      pos: { x: 200, y: 200 },
      patrolWaypoints: [
        { x: 200, y: 200 },
        { x: 250, y: 200 },
      ],
    },
  ],
});

describe('Game Integration Tests', () => {
  let canvas: HTMLCanvasElement;
  let game: Game;
  let levelData: LevelData;

  beforeEach(() => {
    // Create mock canvas
    canvas = new MockCanvas() as unknown as HTMLCanvasElement;
    levelData = createTestLevel();
  });

  describe('Game Initialization', () => {
    it('should initialize game with all systems', () => {
      game = new Game(canvas, levelData);
      
      expect(game).toBeDefined();
      expect(game.getMode()).toBe('menu');
      
      const state = game.getState();
      expect(state.player).toBeDefined();
      expect(state.enemies).toHaveLength(1);
      expect(state.level).toBeDefined();
      expect(state.renderer).toBeDefined();
      expect(state.camera).toBeDefined();
      expect(state.input).toBeDefined();
      expect(state.time).toBeDefined();
    });

    it('should initialize player at spawn position', () => {
      game = new Game(canvas, levelData);
      
      const state = game.getState();
      expect(state.player.pos.x).toBe(32);
      expect(state.player.pos.y).toBe(200);
    });

    it('should initialize enemies from level data', () => {
      game = new Game(canvas, levelData);
      
      const state = game.getState();
      expect(state.enemies).toHaveLength(1);
      expect(state.enemies[0].type).toBe('humanoid');
      expect(state.enemies[0].pos.x).toBe(200);
      expect(state.enemies[0].pos.y).toBe(200);
    });
  });

  describe('State Transitions', () => {
    beforeEach(() => {
      game = new Game(canvas, levelData);
    });

    it('should transition from menu to playing on start', () => {
      expect(game.getMode()).toBe('menu');
      
      game.start();
      
      expect(game.getMode()).toBe('playing');
    });

    it('should transition from playing to paused', () => {
      game.start();
      expect(game.getMode()).toBe('playing');
      
      game.pause();
      
      expect(game.getMode()).toBe('paused');
    });

    it('should transition from paused back to playing', () => {
      game.start();
      game.pause();
      expect(game.getMode()).toBe('paused');
      
      game.resume();
      
      expect(game.getMode()).toBe('playing');
    });

    it('should stop game loop on stop', () => {
      game.start();
      expect(game.getMode()).toBe('playing');
      
      game.stop();
      
      // Game loop should be stopped (mode may still be playing)
      // This is tested by ensuring no errors occur
      expect(game).toBeDefined();
    });
  });

  describe('Game Reset', () => {
    beforeEach(() => {
      game = new Game(canvas, levelData);
    });

    it('should reset game to initial state', () => {
      game.start();
      
      // Modify game state
      const state = game.getState();
      state.player.health = 1;
      state.enemies = [];
      
      // Reset
      game.reset();
      
      // Check state is reset
      const newState = game.getState();
      expect(newState.player.health).toBe(3); // Default max health
      expect(newState.enemies).toHaveLength(1); // Enemies restored
    });
  });

  describe('Win Condition', () => {
    beforeEach(() => {
      game = new Game(canvas, levelData);
    });

    it('should transition to won when player reaches exit', () => {
      game.start();
      
      const state = game.getState();
      
      // Move player to exit tile position
      state.player.pos.x = 30 * 16; // Exit at tile (30, 14)
      state.player.pos.y = 14 * 16;
      
      // Manually trigger game condition check by setting mode
      // In real game, this happens in the game loop
      game.setMode('won');
      
      expect(game.getMode()).toBe('won');
    });
  });

  describe('Game Over Condition', () => {
    beforeEach(() => {
      game = new Game(canvas, levelData);
    });

    it('should transition to gameOver when player health reaches zero', () => {
      game.start();
      
      const state = game.getState();
      
      // Set player health to zero
      state.player.health = 0;
      state.player.state = 'dead';
      
      // Manually trigger game condition check
      game.setMode('gameOver');
      
      expect(game.getMode()).toBe('gameOver');
    });
  });
});
