# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

- `pnpm dev` - Start all development servers (uses Turborepo)
- `pnpm build` - Build all packages for production
- `pnpm test` - Run all tests across the monorepo
- `pnpm lint` - Run ESLint on all packages
- `pnpm format` - Format all code with Prettier

### App-specific (from apps/robin-noguier)

- `pnpm dev` - Start Vite dev server on port 5173
- `pnpm build` - Create production build in dist/
- `pnpm preview` - Preview production build locally
- `pnpm test` - Run Playwright E2E tests
- `pnpm lint` - Lint source files

## Architecture

This is a pnpm monorepo using Turborepo for orchestration:

### Structure

- `apps/` - Individual portfolio applications
  - `robin-noguier/` - Sample React + Three.js portfolio
- `packages/` - Shared packages (currently empty, ready for extraction)
- `config/` - Shared configuration (currently empty)

### Tech Stack

- **Build**: Vite 5.2.8 with @vitejs/plugin-react
- **Framework**: React 18.2.0 with TypeScript 5.8.3
- **3D Graphics**: Three.js 0.162.0 + @react-three/fiber + @react-three/drei
- **Animation**: GSAP 3.12.5 + Framer Motion 11.0.24
- **Smooth Scrolling**: Lenis 1.3.4
- **Testing**: Playwright 1.52.0 + Vitest 1.4.0
- **Linting**: ESLint 9.0.0 with flat config + typescript-eslint
- **Styling**: PostCSS with modules, nesting, custom-media, and autoprefixer
- **Utilities**: Lodash, PapaParse

### Key Patterns

1. **Monorepo Setup**: Uses pnpm workspaces defined in `pnpm-workspace.yaml`
2. **Build Pipeline**: Turborepo manages parallel builds and caching (see `turbo.json`)
3. **TypeScript**: Strict mode enabled with composite projects for monorepo
4. **Module Resolution**: Using "bundler" resolution for Vite compatibility
5. **ES Modules**: IMPORTANT - All package.json files must include `"type": "module"` to avoid Vite CJS deprecation warnings

### Current State

- Basic monorepo structure established
- Sample app demonstrates 3D graphics and animation capabilities
- ESLint 9 with flat config (eslint.config.js)
- Prettier configured (.prettierrc)
- Husky + lint-staged for pre-commit hooks
- Empty packages/ directory ready for shared component extraction
- All deprecated packages updated (lenis, ESLint 9)
- ES Modules configured - all package.json files have `"type": "module"`
- No Vite CJS deprecation warnings

### Important Note

See `/docs/README_BEFORE_UPGRADING.md` for deviations from original specifications and reasoning behind version choices (e.g., React 18 instead of 19 for compatibility).
