# Technology Stack

## Core Technologies
- **React 19.2.0** - UI framework with StrictMode enabled
- **TypeScript 5.9.3** - Type-safe development with strict mode
- **Vite 7.2.4** - Build tool and dev server with HMR
- **Vitest 4.0.18** - Unit and property-based testing framework
- **fast-check** - Property-based testing library (to be installed)
- **Tailwind CSS** - Utility-first CSS for UI overlays (to be configured)

## Build System
- **Bundler**: Vite with `@vitejs/plugin-react` (uses Babel for Fast Refresh)
- **Module System**: ESNext modules
- **Target**: ES2022
- **JSX**: react-jsx transform

## Code Quality
- **ESLint** - Linting with TypeScript, React Hooks, and React Refresh rules
- **TypeScript Config**: Strict mode with bundler module resolution
- **Compiler Options**: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- **Testing**: Dual approach with unit tests and property-based tests

## Testing Framework

### Vitest Configuration
- Test files: `*.test.ts` and `*.test.tsx`
- Property tests: `*.properties.test.ts`
- Setup file: `src/test/setup.ts`
- Run tests: `npm test` (uses `--run` flag for CI)
- Watch mode: `npm test -- --watch` (for development)

### Property-Based Testing
- Library: `fast-check` for TypeScript
- Minimum 100 iterations per property test
- Custom generators for game types (Vec2, Rect, Entity states)
- 30 correctness properties defined in design document

## Common Commands

```bash
# Development server with HMR
npm run dev

# Production build (TypeScript check + Vite build)
npm run build

# Run all tests once
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test vec2.test.ts

# Run tests with coverage
npm test -- --coverage

# Lint codebase
npm run lint

# Preview production build
npm run preview
```

## Key Configuration Files
- `vite.config.ts` - Vite configuration
- `vitest.config.ts` - Vitest test configuration
- `tsconfig.json` - TypeScript project references
- `tsconfig.app.json` - App-specific TypeScript config
- `tsconfig.node.json` - Node/build scripts TypeScript config
- `eslint.config.js` - ESLint flat config format
- `tailwind.config.ts` - Tailwind CSS configuration (to be created)
- `postcss.config.js` - PostCSS configuration (to be created)

## Canvas and Rendering
- **Canvas API**: Native HTML5 Canvas for pixel-perfect rendering
- **OffscreenCanvas**: Used for internal 384×216 buffer
- **ImageData**: Direct pixel manipulation for procedural sprites
- **Image Smoothing**: Disabled for nearest-neighbor scaling
- **Aspect Ratio**: 16:9 with letterboxing/pillarboxing

## Game Architecture Patterns
- **Fixed Timestep**: 60Hz update loop with accumulator pattern
- **Entity-Component**: Interface-based entity system
- **Deterministic RNG**: mulberry32 algorithm with string-to-seed hashing
- **State Machines**: Player and enemy behavior states
- **AABB Collision**: Axis-by-axis rectangle collision detection
