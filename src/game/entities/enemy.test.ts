/**
 * Unit tests for Enemy entity
 * 
 * Tests specific examples and edge cases for enemy behavior.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { Enemy } from './enemy';
import { Tilemap } from '../level/tilemap';
import { vec2 } from '../math/vec2';
import type { LevelData } from '../level/levelTypes';

/**
 * Create a simple test tilemap with no obstacles
 */
function createEmptyTilemap(): Tilemap {
  const levelData: LevelData = {
    width: 64,
    height: 24,
    tileSize: 16,
    tiles: [],
    playerSpawn: { x: 0, y: 0 },
    enemies: [],
    bounds: { x: 0, y: 0, w: 1024, h: 384 }
  };
  return new Tilemap(levelData);
}

describe('Enemy Entity', () => {
  let tilemap: Tilemap;
  
  beforeEach(() => {
    tilemap = createEmptyTilemap();
  });
  
  describe('Waypoint Cycling', () => {
    test('should cycle through waypoints in order', () => {
      const waypoint1 = vec2(100, 200);
      const waypoint2 = vec2(200, 200);
      const waypoint3 = vec2(150, 200);
      
      const enemy = new Enemy(100, 200, 'humanoid', [waypoint1, waypoint2, waypoint3]);
      const playerPos = vec2(2000, 2000); // Far away
      
      // Start at waypoint 0
      expect(enemy['currentWaypoint']).toBe(0);
      
      // Update until reaching waypoint 1
      for (let i = 0; i < 200; i++) {
        enemy.update(1/60, playerPos, tilemap);
        
        const distToWaypoint2 = Math.sqrt(
          Math.pow(enemy.pos.x - waypoint2.x, 2) + 
          Math.pow(enemy.pos.y - waypoint2.y, 2)
        );
        
        if (distToWaypoint2 <= 5) {
          // Should have cycled to waypoint 2
          expect(enemy['currentWaypoint']).toBe(2);
          break;
        }
      }
    });
    
    test('should wrap around to first waypoint after last', () => {
      const waypoint1 = vec2(100, 200);
      const waypoint2 = vec2(120, 200);
      
      // Use drone to avoid gravity issues
      const enemy = new Enemy(100, 200, 'drone', [waypoint1, waypoint2]);
      const playerPos = vec2(2000, 2000); // Far away
      
      // Update until reaching waypoint 1 (index 1)
      for (let i = 0; i < 150; i++) {
        enemy.update(1/60, playerPos, tilemap);
        
        if (enemy['currentWaypoint'] === 1) {
          break;
        }
      }
      
      expect(enemy['currentWaypoint']).toBe(1);
      
      // Continue updating until wrapping back to waypoint 0
      for (let i = 0; i < 150; i++) {
        enemy.update(1/60, playerPos, tilemap);
        
        if (enemy['currentWaypoint'] === 0) {
          break;
        }
      }
      
      expect(enemy['currentWaypoint']).toBe(0);
    });
    
    test('should handle single waypoint (stay in place)', () => {
      const waypoint = vec2(100, 200);
      // Use drone type to avoid gravity issues
      const enemy = new Enemy(100, 200, 'drone', [waypoint]);
      const playerPos = vec2(2000, 2000); // Far away
      
      // Update multiple times
      for (let i = 0; i < 50; i++) {
        enemy.update(1/60, playerPos, tilemap);
      }
      
      // Should stay at waypoint 0
      expect(enemy['currentWaypoint']).toBe(0);
      
      // Position should be close to original
      expect(Math.abs(enemy.pos.x - 100)).toBeLessThan(10);
      expect(Math.abs(enemy.pos.y - 200)).toBeLessThan(10);
    });
  });
  
  describe('Detection Range Boundaries', () => {
    test('should detect player at exactly 200px distance', () => {
      const enemy = new Enemy(300, 200, 'humanoid', [vec2(300, 200)]);
      const playerPos = vec2(500, 200); // Exactly 200px away
      
      enemy.update(1/60, playerPos, tilemap);
      
      expect(enemy.state).toBe('alert');
    });
    
    test('should detect player just inside 200px range', () => {
      const enemy = new Enemy(300, 200, 'humanoid', [vec2(300, 200)]);
      const playerPos = vec2(499, 200); // 199px away
      
      enemy.update(1/60, playerPos, tilemap);
      
      expect(enemy.state).toBe('alert');
    });
    
    test('should not detect player just outside 200px range', () => {
      const enemy = new Enemy(300, 200, 'humanoid', [vec2(300, 200)]);
      const playerPos = vec2(502, 200); // 202px away
      
      enemy.update(1/60, playerPos, tilemap);
      
      expect(enemy.state).toBe('patrol');
    });
    
    test('should detect player at diagonal distance within range', () => {
      const enemy = new Enemy(300, 200, 'humanoid', [vec2(300, 200)]);
      // Pythagorean: sqrt(140^2 + 140^2) ≈ 198px
      const playerPos = vec2(440, 340);
      
      enemy.update(1/60, playerPos, tilemap);
      
      expect(enemy.state).toBe('alert');
    });
  });
  
  describe('Shoot Range Boundaries', () => {
    test('should shoot when player is at exactly 150px distance', () => {
      const enemy = new Enemy(300, 200, 'humanoid', [vec2(300, 200)]);
      const playerPos = vec2(450, 200); // Exactly 150px away
      
      let projectileFired = false;
      enemy.setShootCallback(() => {
        projectileFired = true;
      });
      
      // Update to trigger alert
      enemy.update(1/60, playerPos, tilemap);
      expect(enemy.state).toBe('alert');
      
      // Update multiple times to trigger shoot and fire projectile
      for (let i = 0; i < 20; i++) {
        enemy.update(1/60, playerPos, tilemap);
        
        if (projectileFired) {
          break;
        }
      }
      
      expect(enemy.state).toBe('shoot');
      expect(projectileFired).toBe(true);
    });
    
    test('should shoot when player is just inside 150px range', () => {
      const enemy = new Enemy(300, 200, 'humanoid', [vec2(300, 200)]);
      const playerPos = vec2(449, 200); // 149px away
      
      let projectileFired = false;
      enemy.setShootCallback(() => {
        projectileFired = true;
      });
      
      // Update to trigger alert
      enemy.update(1/60, playerPos, tilemap);
      
      // Update multiple times to trigger shoot
      for (let i = 0; i < 10; i++) {
        enemy.update(1/60, playerPos, tilemap);
        
        if (projectileFired) {
          break;
        }
      }
      
      expect(projectileFired).toBe(true);
    });
    
    test('should not shoot when player is just outside 150px range', () => {
      const enemy = new Enemy(300, 200, 'humanoid', [vec2(300, 200)]);
      const playerPos = vec2(453, 200); // 153px away (further to account for movement)
      
      let projectileFired = false;
      enemy.setShootCallback(() => {
        projectileFired = true;
      });
      
      // Update to trigger alert
      enemy.update(1/60, playerPos, tilemap);
      expect(enemy.state).toBe('alert');
      
      // Update a few times - should NOT shoot (not enough time to get in range)
      for (let i = 0; i < 5; i++) {
        enemy.update(1/60, playerPos, tilemap);
      }
      
      // Should remain in alert, not shoot
      expect(enemy.state).toBe('alert');
      expect(projectileFired).toBe(false);
    });
  });
  
  describe('Enemy Types', () => {
    test('humanoid should have correct dimensions', () => {
      const enemy = new Enemy(100, 200, 'humanoid');
      
      expect(enemy.bounds.w).toBe(22);
      expect(enemy.bounds.h).toBe(38);
    });
    
    test('drone should have correct dimensions', () => {
      const enemy = new Enemy(100, 200, 'drone');
      
      expect(enemy.bounds.w).toBe(26);
      expect(enemy.bounds.h).toBe(18);
    });
    
    test('humanoid should be affected by gravity', () => {
      const enemy = new Enemy(100, 100, 'humanoid', [vec2(100, 100)]);
      const playerPos = vec2(2000, 2000); // Far away
      
      const initialY = enemy.pos.y;
      
      // Update multiple times
      for (let i = 0; i < 10; i++) {
        enemy.update(1/60, playerPos, tilemap);
      }
      
      // Y position should have increased (falling)
      expect(enemy.pos.y).toBeGreaterThan(initialY);
    });
    
    test('drone should not be affected by gravity', () => {
      const enemy = new Enemy(100, 100, 'drone', [vec2(100, 100)]);
      const playerPos = vec2(2000, 2000); // Far away
      
      const initialY = enemy.pos.y;
      
      // Update multiple times
      for (let i = 0; i < 10; i++) {
        enemy.update(1/60, playerPos, tilemap);
      }
      
      // Y position should remain close to initial (no gravity)
      expect(Math.abs(enemy.pos.y - initialY)).toBeLessThan(5);
    });
  });
  
  describe('Health and Damage', () => {
    test('should take damage and enter hurt state', () => {
      const enemy = new Enemy(100, 200, 'humanoid');
      
      expect(enemy.health).toBe(3);
      expect(enemy.state).toBe('patrol');
      
      enemy.takeDamage(1);
      
      expect(enemy.health).toBe(2);
      expect(enemy.state).toBe('hurt');
    });
    
    test('should die when health reaches zero', () => {
      const enemy = new Enemy(100, 200, 'humanoid');
      
      enemy.takeDamage(3);
      
      expect(enemy.health).toBe(0);
      expect(enemy.state).toBe('dead');
      expect(enemy.active).toBe(false);
    });
    
    test('should not take damage when already dead', () => {
      const enemy = new Enemy(100, 200, 'humanoid');
      
      enemy.takeDamage(3);
      expect(enemy.health).toBe(0);
      
      enemy.takeDamage(1);
      expect(enemy.health).toBe(0); // Should not go negative
    });
  });
  
  describe('State Transitions', () => {
    test('should transition from patrol to alert when detecting player', () => {
      const enemy = new Enemy(300, 200, 'humanoid', [vec2(300, 200)]);
      const playerPos = vec2(400, 200); // Within detection range
      
      expect(enemy.state).toBe('patrol');
      
      enemy.update(1/60, playerPos, tilemap);
      
      expect(enemy.state).toBe('alert');
    });
    
    test('should transition from alert to shoot when in range', () => {
      const enemy = new Enemy(300, 200, 'humanoid', [vec2(300, 200)]);
      const playerPos = vec2(400, 200); // Within shoot range
      
      enemy.setShootCallback(() => {});
      
      // Update to trigger alert
      enemy.update(1/60, playerPos, tilemap);
      expect(enemy.state).toBe('alert');
      
      // Update multiple times to trigger shoot
      for (let i = 0; i < 10; i++) {
        enemy.update(1/60, playerPos, tilemap);
        
        if (enemy.state === 'shoot') {
          break;
        }
      }
      
      expect(enemy.state).toBe('shoot');
    });
    
    test('should transition from hurt to alert after timer expires', () => {
      const enemy = new Enemy(300, 200, 'humanoid', [vec2(300, 200)]);
      // Position player within detection range (200px) but outside shoot range (150px)
      const playerPos = vec2(470, 200); // 170px away
      
      enemy.takeDamage(1);
      expect(enemy.state).toBe('hurt');
      
      // Update multiple times to expire hurt timer
      for (let i = 0; i < 20; i++) {
        enemy.update(1/60, playerPos, tilemap);
      }
      
      expect(enemy.state).toBe('alert');
    });
  });
  
  describe('Shoot Cooldown', () => {
    test('should enforce cooldown between shots', () => {
      const enemy = new Enemy(300, 200, 'humanoid', [vec2(300, 200)]);
      const playerPos = vec2(400, 200);
      
      let shotCount = 0;
      enemy.setShootCallback(() => {
        shotCount++;
      });
      
      // Update to trigger alert and first shot
      for (let i = 0; i < 20; i++) {
        enemy.update(1/60, playerPos, tilemap);
      }
      
      expect(shotCount).toBe(1);
      
      // Update more times - should not shoot again immediately
      for (let i = 0; i < 10; i++) {
        enemy.update(1/60, playerPos, tilemap);
      }
      
      // Should still be 1 (cooldown not expired)
      expect(shotCount).toBe(1);
    });
  });
});
