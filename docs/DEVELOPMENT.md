# Development Guide

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Code editor (VS Code recommended)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd flashback

# Install dependencies
npm install
```

### Development Server

```bash
# Start development server with HMR
npm run dev
```

The game will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Hot Module Replacement (HMR)

Vite provides instant feedback during development:
- Changes to TypeScript files reload automatically
- React components update without losing state
- CSS changes apply instantly

## Common Commands

### Development
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing
```bash
# Run all tests once
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm test:ui

# Run specific test file
npm test vec2.test.ts

# Run tests with coverage
npm test -- --coverage
```

### Code Quality
```bash
# Lint codebase
npm run lint

# Type check
npx tsc --noEmit
```

## Project Configuration

### TypeScript Configuration

The project uses three TypeScript configurations:

- `tsconfig.json` - Project references and base config
- `tsconfig.app.json` - Application code configuration
- `tsconfig.node.json` - Build scripts configuration

Key settings:
- Strict mode enabled
- ES2022 target
- Bundler module resolution
- React JSX transform

### Vite Configuration

`vite.config.ts` configures:
- React plugin with Fast Refresh
- Build output directory
- Development server settings

### Vitest Configuration

`vitest.config.ts` configures:
- Test environment (jsdom for React components)
- Setup files
- Coverage settings
- Test file patterns

### ESLint Configuration

`eslint.config.js` configures:
- TypeScript rules
- React Hooks rules
- React Refresh rules
- Unused variable warnings

### Tailwind Configuration

`tailwind.config.ts` configures:
- Content paths for purging
- Theme customization
- Plugin configuration

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/my-feature
```

### 2. Write Tests First (TDD)

```typescript
// player.test.ts
test('player should jump when jump pressed', () => {
  const player = new Player(0, 0);
  player.update(0.016, { jumpPressed: true }, tilemap);
  expect(player.state).toBe('jump');
  expect(player.vel.y).toBeLessThan(0);
});
```

### 3. Implement the Feature

```typescript
// player.ts
if (input.jumpPressed && this.grounded) {
  this.state = 'jump';
  this.vel.y = PHYSICS.JUMP_VELOCITY;
}
```

### 4. Verify Tests Pass

```bash
npm test
```

### 5. Check Code Quality

```bash
npm run lint
```

### 6. Commit Changes

```bash
git add .
git commit -m "feat: add player jump mechanic"
```

## Code Style Guidelines

### TypeScript

```typescript
// Use explicit types for function parameters and returns
function calculateDistance(a: Vec2, b: Vec2): number {
  return length(sub(b, a));
}

// Use interfaces for object shapes
interface PlayerConfig {
  health: number;
  speed: number;
}

// Use type aliases for unions
type GameState = 'menu' | 'playing' | 'paused' | 'gameOver';

// Use const for immutable values
const GRAVITY = 800;

// Use descriptive variable names
const isPlayerGrounded = checkGroundCollision(player, tilemap);
```

### React Components

```typescript
// Use functional components with TypeScript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 bg-blue-500 text-white rounded"
    >
      {label}
    </button>
  );
}
```

### JSDoc Comments

```typescript
/**
 * Calculate the distance between two points
 * @param a - First point
 * @param b - Second point
 * @returns Distance in pixels
 */
function calculateDistance(a: Vec2, b: Vec2): number {
  return length(sub(b, a));
}
```

## Debugging

### Browser DevTools

1. Open DevTools (F12 or Cmd+Option+I)
2. Use Console for logging
3. Use Sources for breakpoints
4. Use Network for asset loading

### Console Logging

```typescript
console.log('Player position:', player.pos);
console.log('Player state:', player.state);
console.log('Velocity:', player.vel);
```

### Vitest Debugging

```typescript
test('debug example', () => {
  console.log('Input:', input);
  const result = functionToTest(input);
  console.log('Result:', result);
  expect(result).toBe(expected);
});
```

### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

## Performance Optimization

### Profiling

Use browser DevTools Performance tab:
1. Start recording
2. Perform actions in game
3. Stop recording
4. Analyze flame graph

### Common Optimizations

**Sprite Caching**
```typescript
// Cache generated sprites
const spriteCache = new Map<string, SpriteFrame>();

function getSprite(seed: string, anim: string, frame: number): SpriteFrame {
  const key = `${seed}_${anim}_${frame}`;
  if (!spriteCache.has(key)) {
    spriteCache.set(key, generateSprite(seed, anim, frame));
  }
  return spriteCache.get(key)!;
}
```

**Viewport Culling**
```typescript
// Only render entities in viewport
const visibleEntities = entities.filter(entity => 
  isInViewport(entity.bounds, camera)
);
```

**Object Pooling**
```typescript
// Reuse projectile objects
const projectilePool: Projectile[] = [];

function getProjectile(): Projectile {
  return projectilePool.pop() || new Projectile();
}

function returnProjectile(projectile: Projectile): void {
  projectile.active = false;
  projectilePool.push(projectile);
}
```

## Troubleshooting

### Build Errors

**Module not found**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Type errors**
```bash
# Check TypeScript configuration
npx tsc --noEmit
```

### Test Failures

**Canvas not available**
```
Not implemented: HTMLCanvasElement's getContext()
```
This is expected in test environment. Tests mock canvas when needed.

**Flaky tests**
- Check for timing issues
- Use `vi.useFakeTimers()` for time-dependent tests
- Ensure tests are isolated

### Runtime Errors

**NaN in calculations**
```typescript
// Add validation
function sanitizeVector(v: Vec2): Vec2 {
  return {
    x: isNaN(v.x) ? 0 : v.x,
    y: isNaN(v.y) ? 0 : v.y
  };
}
```

**Memory leaks**
- Clear event listeners
- Cancel animation frames
- Clean up intervals/timeouts

## Contributing

### Code Review Checklist

- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] JSDoc comments added for public APIs
- [ ] No console.log statements (use proper logging)
- [ ] No commented-out code
- [ ] Performance considered
- [ ] Edge cases handled
- [ ] Error handling implemented

### Commit Message Format

```
type(scope): subject

body

footer
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tooling changes

Example:
```
feat(player): add double jump mechanic

Implement double jump with:
- State tracking for jumps used
- Reset on landing
- Visual feedback

Closes #123
```

## Resources

### Documentation
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Vitest Documentation](https://vitest.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Game Development
- [HTML5 Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
- [Game Programming Patterns](https://gameprogrammingpatterns.com/)
- [Fixed Timestep Article](https://gafferongames.com/post/fix_your_timestep/)

### Testing
- [fast-check Documentation](https://fast-check.dev/)
- [Property-Based Testing Guide](https://fsharpforfunandprofit.com/posts/property-based-testing/)
