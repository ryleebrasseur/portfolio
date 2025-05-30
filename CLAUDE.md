# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Prerequisites

- **Volta**: Required for automatic Node.js/pnpm version management
- **Node.js**: 20.17.0 (exact version enforced by Volta)
- **pnpm**: 9.12.0 (exact version enforced by Volta)
- **Platform**: macOS, Linux, or WSL2 (native Windows not supported)
- **Git**: Required for version control and pre-commit hooks
- **Disk Space**: Minimum 1GB free space recommended

## Development Environment Setup

### Initial Setup

Run the automated setup script:

```bash
./dev_setup.sh
```

The script (v2.0.0) provides:

- **Idempotent execution**: Safe to run multiple times
- **Cross-platform support**: macOS, Linux, WSL2, and CI environments
- **Conflict detection**: Warns about incompatible Node.js version managers (nvm, fnm, etc.)
- **Automatic recovery**: Lock files to prevent concurrent runs
- **Proper environment setup**: Correctly initializes Volta and pnpm paths
- **Clear error messages**: Helpful debugging information when things go wrong
- **Logging**: Detailed logs for troubleshooting with automatic rotation

### Key Features

- Installs Volta, Node.js 20.17.0, and pnpm 9.12.0
- Uses official pnpm installer (more reliable than Volta's experimental support)
- Properly exports paths for current shell session
- Updates shell profiles for future sessions
- Verifies installations actually work before proceeding

### Important Notes

- If you have fnm, nvm, or other Node.js version managers installed, you must uninstall them first
- The script creates logs in `.setup-logs/` with automatic rotation
- A healthcheck file `.setup-health.json` is created after successful setup
- In CI/container environments, the script automatically adjusts behavior

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

1. **Monorepo Setup**: Uses pnpm workspaces defined in `pnpm-workspace.yaml` (NOT package.json workspaces field)
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

## Setup Script Documentation

The development environment setup is managed by `dev_setup.sh`. Related documentation:

- `/docs/setup_security_report_2025-05-30.md` - Security audit and implemented features
- `/docs/setup_improvements_roadmap.md` - Production readiness roadmap (currently 90% complete)
- `/docs/setup_final_10_percent_todo.md` - Detailed tasks for reaching 100% production readiness

### Known Issues

- **fnm conflicts**: The setup script will detect and block installation if fnm is present
- **Container persistence**: Volta installations may not persist across container restarts
- **Volta pnpm support**: Volta's pnpm support is experimental. The setup script works around this by falling back to npm global install when needed
- **pnpm workspace config**: Use `pnpm-workspace.yaml`, not package.json `workspaces` field

### Troubleshooting

If setup fails:

1. Check `.setup-logs/setup-*.log` for detailed error messages
2. Ensure no conflicting Node.js version managers are installed
3. Verify you have at least 1GB free disk space
4. Run with `DEBUG=true ./dev_setup.sh` for verbose output

## Development Best Practices

1. **Always run setup first**: Ensures consistent environment across team members
2. **Check setup health**: Review `.setup-health.json` to verify environment state
3. **Use exact versions**: Volta enforces exact Node.js and pnpm versions for reproducibility
4. **Commit generated files carefully**: Don't commit `.setup-logs/`, `.setup-health.json`, or `.dev-server.pid`
