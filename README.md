# Portfolio Monorepo

Production-grade modular frontend monorepo for portfolio sites.

## Tech Stack

- Vite 5.2.8 + React 18.2.0
- Three.js + @react-three/fiber for 3D
- GSAP + Framer Motion for animations
- TypeScript 5.8.3
- Playwright for testing
- Volta for Node.js/pnpm version management
- pnpm 9.12.0 workspace management
- Turborepo for monorepo orchestration

## Prerequisites

- **macOS/Linux**: Native support
- **Windows**: WSL2 required (native Windows not supported)
- **Volta**: Automatically installed by setup script

## Quick Start

```bash
# Run the setup script (installs Volta, Node.js, pnpm)
./dev_setup.sh

# Start development
pnpm dev
```

The setup script will:

- Install Volta if not present
- Configure exact Node.js 20.17.0
- Configure exact pnpm 9.12.0
- Install all dependencies
- Set up git hooks

## Manual Setup

If you prefer manual setup:

1. Install Volta: https://volta.sh
2. The project will automatically use correct versions
3. Run `pnpm install`

## Development

```bash
# Start all apps
pnpm dev

# Build all apps
pnpm build

# Run tests
pnpm test

# Lint and format
pnpm lint
pnpm format
```

## CI/CD

GitHub Actions workflow runs on every push and PR:

- Linting & formatting checks
- Type checking
- Unit tests
- E2E tests (Chromium, Firefox, WebKit)
- Build verification
- Windows WSL2 compatibility check

## Deployment

The portfolio supports automated deployment to GitHub Pages with intelligent domain detection:

### Automatic Configuration

- **Main Portfolio (ryleebrasseur/portfolio)**: Automatically deploys to `https://ryleeworks.com`
- **Other Repositories**: Deploy to subdirectory by default (`https://username.github.io/repository/`)
- **Custom Domain Override**: Set `CUSTOM_DOMAIN` repository variable for other repositories

### Manual Domain Configuration (Other Repositories)

For repositories other than the main portfolio, you can still configure custom domains:

- **Subdirectory (default)**: Push to main branch → `https://username.github.io/repository/`
- **Custom Domain**: Set `CUSTOM_DOMAIN` repository variable → `https://yourdomain.com`

### Test Deployment Configuration

```bash
./test-deployment.sh
```

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed configuration guide.
