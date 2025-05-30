# Production-Grade Frontend Monorepo Skeleton

## 1. Complete Folder Structure

```
portfolio-monorepo/
├── .github/
│   └── workflows/
│       └── ci.yml
├── apps/
│   ├── robin-noguier/
│   │   ├── src/
│   │   │   ├── features/
│   │   │   │   ├── immersive-hero/
│   │   │   │   │   ├── README.md
│   │   │   │   │   ├── ImmersiveHero.tsx
│   │   │   │   │   ├── ImmersiveHero.module.css
│   │   │   │   │   ├── ImmersiveHero.test.ts
│   │   │   │   │   └── ImmersiveHero.spec.ts
│   │   │   │   ├── scroll-gallery/
│   │   │   │   │   ├── README.md
│   │   │   │   │   ├── ScrollGallery.tsx
│   │   │   │   │   └── ScrollGallery.spec.ts
│   │   │   │   └── project-grid/
│   │   │   │       ├── README.md
│   │   │   │       ├── ProjectGrid.tsx
│   │   │   │       └── ProjectGrid.spec.ts
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── utils/
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   └── vite-env.d.ts
│   │   ├── public/
│   │   ├── e2e/
│   │   │   └── homepage.spec.ts
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   └── .env.example
│   ├── jeremy-stokes/
│   │   └── [similar structure]
│   └── vilinskyy/
│       └── [similar structure]
├── packages/
│   ├── shared-ui/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── three-components/
│   │   ├── src/
│   │   │   ├── Scene/
│   │   │   ├── Lights/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── animation-lib/
│       ├── src/
│       │   ├── scroll/
│       │   ├── transitions/
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── config/
│   ├── vite.base.ts
│   ├── postcss.base.js
│   └── playwright.base.ts
├── .turbo/
├── node_modules/
├── .env.example
├── .eslintrc.json
├── .gitignore
├── .prettierrc
├── package.json
├── playwright.config.ts
├── postcss.config.js
├── README.md
├── setup.sh
├── tsconfig.json
└── turbo.json
```

## 2. Root package.json

```json
{
  "name": "portfolio-monorepo",
  "version": "1.0.0",
  "private": true,
  "description": "Production-grade modular frontend monorepo for portfolio sites",
  "author": "Your Name",
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.15.0",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "dev:robin": "turbo run dev --filter=robin-noguier",
    "dev:jeremy": "turbo run dev --filter=jeremy-stokes",
    "dev:vilinskyy": "turbo run dev --filter=vilinskyy",
    "build": "turbo run build",
    "test": "turbo run test",
    "test:e2e": "turbo run test:e2e",
    "test:unit": "turbo run test:unit",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "clean": "turbo run clean && rm -rf node_modules",
    "typecheck": "turbo run typecheck",
    "prepare": "husky install",
    "preinstall": "npx only-allow pnpm"
  },
  "devDependencies": {
    "@playwright/test": "1.52.0",
    "@types/node": "20.11.30",
    "@types/react": "18.2.79",
    "@types/react-dom": "18.2.25",
    "@typescript-eslint/eslint-plugin": "7.4.0",
    "@typescript-eslint/parser": "7.4.0",
    "@vitejs/plugin-react-swc": "3.6.0",
    "autoprefixer": "10.4.19",
    "eslint": "8.57.0",
    "eslint-config-prettier": "9.1.0",
    "eslint-plugin-react": "7.34.1",
    "eslint-plugin-react-hooks": "4.6.0",
    "husky": "9.0.11",
    "lint-staged": "15.2.2",
    "postcss": "8.4.38",
    "postcss-modules": "6.0.1",
    "postcss-nested": "6.0.1",
    "prettier": "3.2.5",
    "turbo": "1.13.2",
    "typescript": "5.8.3",
    "vite": "6.3.5"
  },
  "dependencies": {
    "@react-three/fiber": "9.1.2",
    "gsap": "3.13.0",
    "motion": "12.15.0",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "three": "0.176.0"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,css,md}": "prettier --write"
  }
}
```

## 3. Configuration Files

### vite.config.ts (base configuration in config/)

```typescript
// config/vite.base.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export function createViteConfig(rootDir: string) {
  return defineConfig({
    plugins: [
      react({
        // Use SWC for faster builds in development
        jsxImportSource: 'react'
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, './src'),
        '@shared': path.resolve(rootDir, '../../packages/shared-ui/src'),
        '@three': path.resolve(rootDir, '../../packages/three-components/src'),
        '@animation': path.resolve(rootDir, '../../packages/animation-lib/src')
      }
    },
    css: {
      modules: {
        // CSS Modules configuration
        localsConvention: 'camelCase',
        generateScopedName: '[name]__[local]___[hash:base64:5]'
      }
    },
    build: {
      // Enable source maps for production debugging
      sourcemap: true,
      // Optimize chunk splitting
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'three-vendor': ['three', '@react-three/fiber'],
            'animation-vendor': ['gsap', 'motion']
          }
        }
      }
    },
    server: {
      // Enable HMR with proper host configuration
      host: true,
      strictPort: true
    },
    optimizeDeps: {
      // Pre-bundle heavy dependencies
      include: ['react', 'react-dom', 'three', '@react-three/fiber', 'gsap', 'motion']
    }
  })
}
```

### tsconfig.json (root)

```json
{
  "compilerOptions": {
    // Enable composite projects for monorepo
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "incremental": true,
    
    // Strict type checking
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    
    // Module resolution
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    
    // React configuration
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    
    // Output configuration
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "references": [
    { "path": "./apps/robin-noguier" },
    { "path": "./apps/jeremy-stokes" },
    { "path": "./apps/vilinskyy" },
    { "path": "./packages/shared-ui" },
    { "path": "./packages/three-components" },
    { "path": "./packages/animation-lib" }
  ]
}
```

### .eslintrc.json

```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  },
  "env": {
    "browser": true,
    "es2022": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "plugins": [
    "@typescript-eslint",
    "react",
    "react-hooks"
  ],
  "rules": {
    // React 19 - new JSX transform
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    
    // TypeScript specific
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    
    // Best practices
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "prefer-const": "error",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error", { 
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }]
  }
}
```

### .prettierrc

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "none",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  // Test directory configuration
  testDir: './e2e',
  
  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }]
  ],
  
  // Global test settings
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  
  // Project configuration for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] }
    }
  ],
  
  // Dev server configuration
  webServer: {
    command: 'pnpm dev',
    port: 3000,
    reuseExistingServer: !process.env.CI
  }
})
```

### postcss.config.js

```javascript
module.exports = {
  plugins: [
    // CSS Modules support
    require('postcss-modules')({
      generateScopedName: '[name]__[local]___[hash:base64:5]',
      exportGlobals: true
    }),
    
    // Nested CSS support
    require('postcss-nested'),
    
    // Autoprefixer for browser compatibility
    require('autoprefixer')({
      // Target modern browsers
      overrideBrowserslist: [
        '>0.2%',
        'not dead',
        'not op_mini all'
      ]
    }),
    
    // Custom media queries
    require('postcss-custom-media')({
      importFrom: './config/media-queries.css'
    })
  ]
}
```

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [
    "**/.env.*local"
  ],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "cache": true
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": [],
      "cache": true
    },
    "test": {
      "outputs": ["coverage/**"],
      "cache": true,
      "dependsOn": ["build"]
    },
    "test:e2e": {
      "outputs": ["playwright-report/**"],
      "cache": false,
      "dependsOn": ["build"]
    },
    "typecheck": {
      "outputs": [],
      "cache": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

### .gitignore

```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
.turbo/
*.tsbuildinfo

# Testing
coverage/
playwright-report/
test-results/
.playwright/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# Logs
logs/
*.log
npm-debug.log*
pnpm-debug.log*

# Misc
.cache/
.temp/
*.pid
*.seed
*.pid.lock
```

### .env.example

```bash
# Application
NODE_ENV=development
PUBLIC_URL=http://localhost:3000

# API Keys (if needed)
VITE_API_KEY=your_api_key_here
VITE_API_URL=https://api.example.com

# Analytics (optional)
VITE_GA_TRACKING_ID=UA-XXXXXXXXX-X

# Feature Flags
VITE_ENABLE_3D=true
VITE_ENABLE_ANIMATIONS=true
```

### setup.sh

```bash
#!/bin/bash

# Portfolio Monorepo Setup Script
# Ensures cross-platform compatibility and proper initialization

set -e

echo "🚀 Setting up Portfolio Monorepo..."

# Check Node.js version
required_node_version="18.0.0"
node_version=$(node -v | cut -d 'v' -f 2)

if [ "$(printf '%s\n' "$required_node_version" "$node_version" | sort -V | head -n1)" != "$required_node_version" ]; then
    echo "❌ Node.js version $required_node_version or higher is required. Current version: $node_version"
    exit 1
fi

# Install pnpm if not present
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm@8.15.0
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Create environment files
echo "🔧 Creating environment files..."
for app in apps/*; do
    if [ -d "$app" ]; then
        cp .env.example "$app/.env.local" 2>/dev/null || :
    fi
done

# Initialize git hooks
echo "🪝 Setting up git hooks..."
pnpm prepare

# Build shared packages
echo "🏗️  Building shared packages..."
pnpm turbo run build --filter="./packages/*"

echo "✅ Setup complete! Run 'pnpm dev' to start development."
```

### README.md

```markdown
# Portfolio Monorepo

A production-grade modular frontend monorepo for portfolio sites, built with cutting-edge web technologies.

## 🚀 Tech Stack

- **Build**: Vite 6.3.5 + Turbo
- **Framework**: React 19.1.0
- **3D Graphics**: Three.js + @react-three/fiber
- **Animation**: GSAP 3.13.0 + Motion 12.15.0
- **Testing**: Playwright + Vitest
- **Styling**: CSS Modules + PostCSS
- **Language**: TypeScript 5.8.3

## 📁 Structure

```
├── apps/               # Portfolio sites
│   ├── robin-noguier/
│   ├── jeremy-stokes/
│   └── vilinskyy/
├── packages/          # Shared packages
│   ├── shared-ui/     # Common UI components
│   ├── three-components/ # 3D components
│   └── animation-lib/ # Animation utilities
└── config/           # Shared configurations
```

## 🚦 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Run the setup script
./setup.sh

# Or manually:
npm install -g pnpm@8.15.0
pnpm install
```

### Development

```bash
# Start all sites
pnpm dev

# Start specific site
pnpm dev:robin
pnpm dev:jeremy
pnpm dev:vilinskyy
```

### Testing

```bash
# Run all tests
pnpm test

# E2E tests only
pnpm test:e2e

# Type checking
pnpm typecheck
```

### Building

```bash
# Build all sites
pnpm build

# Build specific site
pnpm build --filter=robin-noguier
```

## 🎯 Features

- **Modular Architecture**: Each site has independent features with tests
- **Advanced Animations**: Scroll-based animations, 3D graphics, physics
- **Type Safety**: Strict TypeScript with project references
- **Performance**: Optimized bundling, code splitting, caching
- **Testing**: E2E and component testing with Playwright
- **DX**: Fast HMR, monorepo tooling, automated formatting

## 📋 Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development servers |
| `pnpm build` | Production build |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint code |
| `pnpm format` | Format code |
| `pnpm clean` | Clean build artifacts |

## 🔧 Configuration

Each app can be configured through:
- `vite.config.ts` - Build configuration
- `tsconfig.json` - TypeScript settings
- `.env.local` - Environment variables

## 📝 License

MIT
```

## 4. Sample Feature: Immersive Hero

### apps/robin-noguier/src/features/immersive-hero/README.md

```markdown
# Immersive Hero Feature

A full-viewport 3D hero section with scroll-based animations and interactive elements.

## Overview

This feature combines Three.js for 3D graphics with GSAP for scroll-triggered animations, creating an immersive landing experience.

## Components

- `ImmersiveHero.tsx` - Main component orchestrating the 3D scene
- `Scene.tsx` - Three.js scene setup and management  
- `ScrollTrigger.tsx` - GSAP ScrollTrigger integration
- `ImmersiveHero.module.css` - Scoped styles

## Usage

```tsx
import { ImmersiveHero } from '@/features/immersive-hero'

function HomePage() {
  return <ImmersiveHero title="Portfolio" subtitle="Creative Developer" />
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | required | Main heading text |
| subtitle | string | - | Secondary text |
| particleCount | number | 1000 | Number of particles in scene |
| scrollDepth | number | 2 | Scroll multiplier for parallax |

## Testing

- Unit tests: `ImmersiveHero.test.ts`
- E2E tests: `ImmersiveHero.spec.ts`

Run tests with: `pnpm test --filter=robin-noguier`
```

### apps/robin-noguier/src/features/immersive-hero/ImmersiveHero.tsx

```typescript
import { useRef, useEffect, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { motion } from 'motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import styles from './ImmersiveHero.module.css'
import { ParticleField } from './components/ParticleField'
import { HeroText } from './components/HeroText'

gsap.registerPlugin(ScrollTrigger)

interface ImmersiveHeroProps {
  title: string
  subtitle?: string
  particleCount?: number
  scrollDepth?: number
}

export function ImmersiveHero({ 
  title, 
  subtitle, 
  particleCount = 1000,
  scrollDepth = 2 
}: ImmersiveHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // GSAP scroll animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: `+=${window.innerHeight * scrollDepth}`,
        scrub: 1,
        pin: true
      }
    })

    tl.to(containerRef.current, {
      scale: 1.2,
      opacity: 0.8,
      ease: 'power2.inOut'
    })

    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill())
    }
  }, [scrollDepth])

  return (
    <motion.section 
      ref={containerRef}
      className={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
      data-testid="immersive-hero"
    >
      <div className={styles.canvasWrapper}>
        <Suspense fallback={<div className={styles.loader}>Loading...</div>}>
          <Canvas
            ref={canvasRef}
            camera={{ position: [0, 0, 5], fov: 75 }}
            className={styles.canvas}
          >
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <ParticleField count={particleCount} />
          </Canvas>
        </Suspense>
      </div>
      
      <HeroText title={title} subtitle={subtitle} />
    </motion.section>
  )
}
```

### apps/robin-noguier/src/features/immersive-hero/ImmersiveHero.module.css

```css
.container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.canvasWrapper {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.canvas {
  width: 100%;
  height: 100%;
}

.loader {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  font-size: 1.5rem;
  color: #666;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .container {
    height: 100vh;
    height: 100dvh; /* Dynamic viewport height */
  }
}
```

### apps/robin-noguier/src/features/immersive-hero/ImmersiveHero.spec.ts

```typescript
import { test, expect } from '@playwright/test'

test.describe('Immersive Hero Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders hero section with title', async ({ page }) => {
    const hero = page.locator('[data-testid="immersive-hero"]')
    await expect(hero).toBeVisible()
    
    const title = hero.locator('h1')
    await expect(title).toHaveText('Portfolio')
  })

  test('scroll animations trigger correctly', async ({ page }) => {
    const hero = page.locator('[data-testid="immersive-hero"]')
    
    // Initial state
    await expect(hero).toHaveCSS('opacity', '1')
    
    // Scroll and check animation
    await page.evaluate(() => window.scrollBy(0, 500))
    await page.waitForTimeout(100) // Wait for animation
    
    const opacity = await hero.evaluate(el => 
      window.getComputedStyle(el).opacity
    )
    expect(parseFloat(opacity)).toBeLessThan(1)
  })

  test('3D canvas loads without errors', async ({ page }) => {
    // Check for WebGL context
    const hasWebGL = await page.evaluate(() => {
      const canvas = document.createElement('canvas')
      return !!(
        canvas.getContext('webgl') || 
        canvas.getContext('experimental-webgl')
      )
    })
    
    expect(hasWebGL).toBe(true)
    
    // Check canvas is rendered
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()
  })

  test('responsive behavior on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    const hero = page.locator('[data-testid="immersive-hero"]')
    await expect(hero).toBeVisible()
    
    // Check mobile-specific styles applied
    await expect(hero).toHaveCSS('height', '667px')
  })
})
```

## 5. Dependency Version Table

| Package | Version | Justification |
|---------|---------|---------------|
| **Core Build Tools** | | |
| vite | 6.3.5 | Latest stable. Node 18+ support, improved dev server performance |
| turbo | 1.13.2 | Proven monorepo orchestration, excellent caching |
| typescript | 5.8.3 | Latest stable before v7.0 Go rewrite |
| **React Ecosystem** | | |
| react | 19.1.0 | Latest stable with Server Components, new hooks |
| react-dom | 19.1.0 | Matches React version for compatibility |
| @vitejs/plugin-react-swc | 3.6.0 | SWC for 10x faster HMR than Babel |
| **3D Graphics** | | |
| three | 0.176.0 | Latest stable, WebGPU readiness |
| @react-three/fiber | 9.1.2 | React 19 compatible, stable API |
| **Animation** | | |
| gsap | 3.13.0 | Now free (Webflow acquisition), industry standard |
| motion | 12.15.0 | Smaller bundle than GSAP, hardware accelerated |
| **Testing** | | |
| @playwright/test | 1.52.0 | Latest with component testing, cross-browser |
| **CSS Processing** | | |
| postcss | 8.4.38 | Latest stable, wide plugin ecosystem |
| postcss-modules | 6.0.1 | Scoped styles, prevents conflicts |
| autoprefixer | 10.4.19 | Browser compatibility, modern targets |
| **Code Quality** | | |
| eslint | 8.57.0 | Pinned pre-v9 for plugin compatibility |
| prettier | 3.2.5 | Latest stable, consistent formatting |
| husky | 9.0.11 | Git hooks for quality gates |

**Note on version pinning**: Exact versions used except for peerDependencies to prevent resolution conflicts. The `^` operator avoided to ensure reproducible builds across environments.

## 6. Script Explanation Table

| Script | Purpose | Usage Context |
|--------|---------|---------------|
| `dev` | Start all apps in development mode | Full monorepo development |
| `dev:robin` | Start only Robin's portfolio | Focused development on single site |
| `build` | Production build of all apps | CI/CD, deployment preparation |
| `test` | Run all test suites | Pre-commit, CI validation |
| `test:e2e` | Run Playwright E2E tests | Integration testing, QA |
| `lint` | ESLint validation | Code quality checks |
| `format` | Auto-fix code formatting | Development workflow |
| `typecheck` | TypeScript compilation check | Type safety validation |
| `clean` | Remove all build artifacts | Fresh start troubleshooting |

## 7. Self-Critique and Risk Analysis

### Architecture Decisions

**Strengths:**
- Turbo provides excellent DX with minimal configuration
- Strict TypeScript with project references ensures type safety
- CSS Modules prevent style conflicts in multi-site setup
- Modular feature folders enable easy sharing/isolation

**Potential Issues:**
- Heavy animation libraries (GSAP + Motion) increase bundle size
- Three.js requires WebGL support (98% browser coverage)
- Monorepo complexity may slow initial onboarding

### Upgrade Considerations

**High Priority (6 months):**
- TypeScript 7.0 when stable (10x performance boost)
- React compiler when production-ready
- Vite 7.0 for potential Module Federation support

**Medium Priority (12 months):**
- Evaluate WebGPU adoption for Three.js
- Consider Bun runtime for faster builds
- Assess React Server Components adoption

### Performance Risks

1. **Bundle Size**: Combined animation libraries ~41kb gzipped
   - *Mitigation*: Use dynamic imports, tree-shake unused features

2. **3D Performance**: Complex scenes may struggle on low-end devices
   - *Mitigation*: Implement quality settings, progressive enhancement

3. **Build Times**: Monorepo builds can become slow at scale
   - *Mitigation*: Turbo caching, consider remote caching for teams

### Security Considerations

- Dependency scanning via `pnpm audit` in CI
- Exact version pinning prevents supply chain attacks
- Environment variable validation at build time
- CSP headers needed for production deployment

## 8. Quick Start Commands

```bash
# Clone and setup
git clone <repo-url>
cd portfolio-monorepo
./setup.sh

# Development
pnpm dev              # All sites
pnpm dev:robin        # Single site

# Testing
pnpm test            # All tests
pnpm test:e2e        # E2E only

# Production
pnpm build           # Build all
pnpm preview         # Preview builds
```

This monorepo structure provides a solid foundation for building performant, maintainable portfolio sites with cutting-edge web technologies. The modular architecture enables code reuse while maintaining site independence, and the comprehensive tooling ensures excellent developer experience and production reliability.