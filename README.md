# Flashback

![Tests](https://img.shields.io/badge/tests-219%20passing-brightgreen)
![Test Files](https://img.shields.io/badge/test%20files-25-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)
![React](https://img.shields.io/badge/React-19.2.0-blue)
![Vite](https://img.shields.io/badge/Vite-7.2.4-purple)

A 2D pixel-art cinematic platformer game built with React, TypeScript, and Vite. Features procedurally generated art, weighty deliberate movement mechanics inspired by early 90s cinematic sci-fi platformers, and a complete rendering pipeline with deterministic seeded generation.

## Features

- **Procedural Art Generation**: All sprites, tiles, and palettes generated at runtime from deterministic seeds
- **Pixel-Perfect Rendering**: 384×216 internal resolution scaled with nearest-neighbor filtering
- **Weighty Movement**: Deliberate physics with momentum, landing recovery, and committed rolls
- **Fixed Timestep Engine**: 60Hz update loop with accumulator-based rendering
- **Dual UI System**: Tailwind CSS for menus, canvas-based HUD with procedural bitmap font
- **Property-Based Testing**: Comprehensive test suite with fast-check for correctness guarantees

## Documentation

- **[Development Guide](docs/DEVELOPMENT.md)** - Setup, workflow, and common commands
- **[Architecture](docs/ARCHITECTURE.md)** - Project structure and design patterns
- **[API Reference](docs/API.md)** - Complete API documentation for all modules
- **[Testing Guide](docs/TESTING.md)** - Testing approach, coverage, and best practices

## Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
# Start development server with HMR
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

Visit `http://localhost:5173` to play the game.

## Project Status

All core systems are complete and fully tested:
- ✅ 219 tests passing across 25 test files
- ✅ 30 correctness properties validated
- ✅ Complete JSDoc documentation
- ✅ Full game loop and entity systems
- ✅ Procedural art generation pipeline
- ✅ UI components and integration

## Tech Stack

- **React 19.2.0** - UI framework
- **TypeScript 5.9.3** - Type-safe development
- **Vite 7.2.4** - Build tool and dev server
- **Vitest 4.0.18** - Testing framework
- **fast-check 4.5.3** - Property-based testing
- **Tailwind CSS 4.1.18** - Utility-first CSS

## License

Private project - All rights reserved
