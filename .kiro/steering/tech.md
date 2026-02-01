# Technology Stack

## Core Technologies
- **React 19.2.0** - UI framework with StrictMode enabled
- **TypeScript 5.9.3** - Type-safe development with strict mode
- **Vite 7.2.4** - Build tool and dev server with HMR

## Build System
- **Bundler**: Vite with `@vitejs/plugin-react` (uses Babel for Fast Refresh)
- **Module System**: ESNext modules
- **Target**: ES2022
- **JSX**: react-jsx transform

## Code Quality
- **ESLint** - Linting with TypeScript, React Hooks, and React Refresh rules
- **TypeScript Config**: Strict mode with bundler module resolution
- **Compiler Options**: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`

## Common Commands

```bash
# Development server with HMR
npm run dev

# Production build (TypeScript check + Vite build)
npm run build

# Lint codebase
npm run lint

# Preview production build
npm run preview
```

## Key Configuration Files
- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript project references
- `tsconfig.app.json` - App-specific TypeScript config
- `tsconfig.node.json` - Node/build scripts TypeScript config
- `eslint.config.js` - ESLint flat config format
