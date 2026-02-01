# Project Structure

## Directory Organization

```
flashback/
├── src/                    # Application source code
│   ├── main.tsx           # Application entry point
│   ├── App.tsx            # Root component
│   ├── App.css            # Component styles
│   ├── index.css          # Global styles
│   └── assets/            # Static assets (images, icons)
├── public/                # Public static files (served as-is)
├── node_modules/          # Dependencies
└── dist/                  # Build output (generated)
```

## File Conventions

### TypeScript Files
- **Components**: `.tsx` extension for React components
- **Utilities**: `.ts` extension for non-component code
- **Imports**: Include `.tsx`/`.ts` extensions in imports (required by Vite)

### Styling
- Component-specific styles: Co-located with component (e.g., `App.css` with `App.tsx`)
- Global styles: `src/index.css`

### Entry Points
- **HTML**: `index.html` at root (Vite convention)
- **JS Entry**: `src/main.tsx` renders root component
- **Root Component**: `src/App.tsx`

## Code Patterns

### Component Structure
- Functional components with hooks
- StrictMode wrapper in main entry
- Type-safe props with TypeScript interfaces

### Import Order Convention
1. React imports
2. Third-party libraries
3. Local components/utilities
4. Assets (images, SVGs)
5. Styles (CSS imports last)

### Naming Conventions
- **Components**: PascalCase (e.g., `App.tsx`, `UserProfile.tsx`)
- **Files**: camelCase for utilities, PascalCase for components
- **CSS Classes**: kebab-case
