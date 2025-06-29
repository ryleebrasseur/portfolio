# Script Documentation

This document provides comprehensive documentation for all scripts available in the portfolio monorepo.

## Script Naming Conventions

- **Prefixes**:

  - `dev:` - Development server management
  - `test:` - Testing variants
  - `lint:` - Linting operations
  - `build:` - Build variants
  - `check:` - Validation scripts
  - `ci:` - CI-specific scripts
  - `release:` - Release management
  - `setup:` - Environment setup

- **Suffixes**:
  - `:watch` - Watch mode variants
  - `:fix` - Auto-fix variants
  - `:ci` - CI-optimized variants
  - `:all` - Run across all packages

## Root Scripts (`/package.json`)

### Development

- `pnpm dev` - Start all development servers in parallel using Turborepo
- `pnpm dev:app <app-name>` - Start development server for a specific app
- `pnpm dev:stop` - Stop all running development servers

### Building

- `pnpm build` - Build all packages and apps
- `pnpm build:app <app-name>` - Build a specific app
- `pnpm clean` - Clean build artifacts and node_modules
- `pnpm clean:all` - Deep clean including all workspace node_modules

### Testing

- `pnpm test` - Run all tests across the monorepo
- `pnpm test:unit` - Run unit tests only
- `pnpm test:e2e` - Run end-to-end tests only

### Code Quality

- `pnpm lint` - Run ESLint on all packages
- `pnpm lint:fix` - Auto-fix linting issues
- `pnpm lint:ci` - CI-optimized linting with max-warnings=0
- `pnpm format` - Format all code with Prettier
- `pnpm format:check` - Check formatting without making changes
- `pnpm typecheck` - Run TypeScript type checking

### Health Checks

- `pnpm check:all` - Run all validation checks
- `pnpm check:deps` - Check dependency health (TODO: fully implement)
- `pnpm check:types` - Run type checking
- `pnpm check:lint` - Run linting
- `pnpm check:format` - Check code formatting

### Setup & Maintenance

- `pnpm setup` - Run the development environment setup script
- `pnpm setup:check` - Validate environment setup (TODO: fully implement)
- `pnpm prepare` - Set up git hooks (runs automatically on install)

### Release

- `pnpm release` - Generate release notes and publish
- `pnpm release:notes` - Generate release notes only
- `pnpm release:publish` - Publish release only

### CI/CD

- `pnpm ci:setup` - Install dependencies with frozen lockfile
- `pnpm ci:build` - Build with CI cache configuration
- `pnpm ci:test` - Run tests with CI cache configuration

## App Scripts (`apps/*/package.json`)

### Core Scripts (Required)

- `pnpm build` - Build the application for production
- `pnpm clean` - Remove build artifacts and caches
- `pnpm typecheck` - Check TypeScript types

### Development

- `pnpm dev` - Start the development server
- `pnpm dev:start` - Explicitly start the dev server
- `pnpm dev:stop` - Stop the dev server
- `pnpm dev:restart` - Restart the dev server
- `pnpm dev:status` - Check dev server status
- `pnpm dev:port-check` - Check if port is available
- `pnpm dev:kill` - Force kill dev server
- `pnpm preview` - Preview production build locally

### Testing

- `pnpm test` - Run all tests (unit + e2e)
- `pnpm test:unit` - Run unit tests
- `pnpm test:unit:watch` - Run unit tests in watch mode
- `pnpm test:e2e` - Run Playwright end-to-end tests
- `pnpm test:e2e:html` - Run e2e tests with HTML reporter
- `pnpm test:e2e:list` - Run e2e tests with list reporter
- `pnpm test:screenshots` - Run essential screenshot tests
- `pnpm test:screenshots:all` - Run all screenshot tests

### Code Quality

- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Auto-fix linting issues

## Library Scripts (`packages/*/package.json`)

### Core Scripts (Required)

- `pnpm build` - Build the package
- `pnpm clean` - Remove build artifacts
- `pnpm typecheck` - Check TypeScript types

### Development

- `pnpm dev` - Build in watch mode

### Code Quality

- `pnpm lint` - Run ESLint (if applicable)
- `pnpm lint:fix` - Auto-fix linting issues (if applicable)

### Testing

- `pnpm test` - Run tests (if applicable)
- `pnpm test:watch` - Run tests in watch mode (if applicable)

## Turbo Pipeline

The monorepo uses Turborepo for task orchestration. Key pipeline features:

### Cached Tasks

- `build` - Depends on upstream builds, caches outputs
- `test:unit` - Caches test results
- `lint` - Caches ESLint results
- `typecheck` - Caches TypeScript build info

### Non-Cached Tasks

- `dev` - Development servers (persistent)
- `test:e2e` - End-to-end tests (environment-dependent)
- `lint:fix` - Auto-fixing changes files
- `clean` - Cleanup operations

### Environment Variables

- `NODE_ENV` - Used by build and dev tasks
- `PORT` - Used by dev tasks
- `CI` - Used by test tasks
- `PLAYWRIGHT_*` - Used by e2e tests

## Common Operations

### Start Development

```bash
# Start all apps
pnpm dev

# Start specific app
pnpm dev:app rylee-brasseur
```

### Run Tests

```bash
# All tests
pnpm test

# Unit tests only
pnpm test:unit

# E2E tests only
pnpm test:e2e

# With coverage
pnpm test:coverage
```

### Code Quality Checks

```bash
# Run all checks
pnpm check:all

# Individual checks
pnpm lint
pnpm typecheck
pnpm format:check
```

### Clean Build

```bash
# Standard clean
pnpm clean

# Deep clean (removes all node_modules)
pnpm clean:all
```

### CI/CD Operations

```bash
# CI setup
pnpm ci:setup

# CI build
pnpm ci:build

# CI tests
pnpm ci:test
```

## Troubleshooting

### Port Conflicts

If you get port conflict errors:

```bash
# Check port status
pnpm dev:port-check

# Force kill dev servers
pnpm dev:stop
```

### Build Issues

```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

### Type Errors

```bash
# Check types across monorepo
pnpm typecheck

# Fix common issues
pnpm clean
pnpm build
```

## Best Practices

1. **Always use pnpm** - Never use npm or yarn
2. **Run checks before commits** - Use `pnpm check:all`
3. **Keep scripts consistent** - Follow naming conventions
4. **Use Turbo for parallel tasks** - Leverage caching
5. **Document new scripts** - Update this file when adding scripts
