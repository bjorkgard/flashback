# Flashback Documentation

Welcome to the Flashback documentation! This folder contains comprehensive guides for understanding, developing, and testing the game.

## Documentation Overview

### [Development Guide](DEVELOPMENT.md)
Everything you need to get started with development:
- Installation and setup
- Common commands and workflows
- Code style guidelines
- Debugging techniques
- Performance optimization
- Troubleshooting

**Start here if you're new to the project.**

### [Architecture](ARCHITECTURE.md)
Understanding the project structure and design patterns:
- Directory organization
- File conventions
- Code patterns and best practices
- Game architecture patterns (fixed timestep, entity-component, etc.)
- Canvas rendering pipeline

**Read this to understand how the codebase is organized.**

### [API Reference](API.md)
Complete API documentation for all modules:
- Math utilities (Vec2, Rect)
- Palette generation (RNG, color generation)
- Sprite generation (8-step pipeline)
- Rendering system (Camera, Renderer)
- Level system (Tilemap, collision, raycasting)
- Entity system (Player, Enemy, Projectile)

**Use this as a reference when working with specific modules.**

### [Testing Guide](TESTING.md)
Comprehensive testing documentation:
- Testing frameworks (Vitest, fast-check)
- Running tests
- Test coverage by module
- Property-based testing explained
- Unit testing best practices
- Writing new tests
- Debugging failed tests

**Read this to understand the testing approach and write effective tests.**

## Quick Links

### Getting Started
1. [Installation](DEVELOPMENT.md#installation)
2. [Development Server](DEVELOPMENT.md#development-server)
3. [Running Tests](TESTING.md#running-tests)

### Common Tasks
- [Writing Tests](TESTING.md#writing-tests)
- [Debugging](DEVELOPMENT.md#debugging)
- [Code Style](DEVELOPMENT.md#code-style-guidelines)
- [Performance Optimization](DEVELOPMENT.md#performance-optimization)

### Reference
- [Project Structure](ARCHITECTURE.md#project-structure)
- [Math API](API.md#math-utilities)
- [Entity API](API.md#entity-system)
- [Rendering API](API.md#rendering-system)

## Project Status

All core systems are complete and fully tested:
- ✅ 219 tests passing across 25 test files
- ✅ 30 correctness properties validated
- ✅ Complete JSDoc documentation
- ✅ Full game loop and entity systems
- ✅ Procedural art generation pipeline
- ✅ UI components and integration

## Contributing

When contributing to the project:
1. Read the [Development Guide](DEVELOPMENT.md)
2. Follow the [Code Style Guidelines](DEVELOPMENT.md#code-style-guidelines)
3. Write tests for new features (see [Testing Guide](TESTING.md))
4. Update documentation as needed

## Additional Resources

### External Documentation
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Vitest Documentation](https://vitest.dev/)
- [fast-check Documentation](https://fast-check.dev/)

### Game Development Resources
- [HTML5 Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
- [Game Programming Patterns](https://gameprogrammingpatterns.com/)
- [Fixed Timestep Article](https://gafferongames.com/post/fix_your_timestep/)
