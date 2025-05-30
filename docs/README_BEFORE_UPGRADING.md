# Implementation Decisions & Validated Overrides

This document tracks all deviations from the original documentation and the reasoning behind each decision. Updated: 2025-05-30

## Critical Version Downgrades

### 1. React 19.1.0 → 18.2.0

**Original Spec:** React 19.1.0 with React DOM 19.1.0  
**Implemented:** React 18.2.0 with React DOM 18.2.0  
**Reason:** Peer dependency conflicts with critical animation and 3D libraries:

- @react-three/fiber doesn't support React 19 yet
- framer-motion requires React ^18.0.0
- @react-spring (drei dependency) incompatible with React 19

**Impact:**

- Missing React 19 features (Server Components, use() hook, improved hydration)
- Stable ecosystem compatibility maintained
- Can upgrade once ecosystem catches up (estimated Q3 2025)

### 2. Vite 6.3.5 → 5.2.8

**Original Spec:** Vite 6.3.5  
**Implemented:** Vite 5.2.8  
**Reason:** Plugin compatibility - @vitejs/plugin-react only supports Vite 4-5  
**Impact:** Minor performance difference, all required features available

### 3. Three.js 0.176.0 → 0.162.0

**Original Spec:** Three.js 0.176.0  
**Implemented:** Three.js 0.162.0  
**Reason:** Match @types/three version and @react-three/fiber compatibility  
**Impact:** Missing 14 minor versions of features, but core functionality intact

## Technology Substitutions

### 4. @vitejs/plugin-react-swc → @vitejs/plugin-react

**Original Spec:** SWC-based React plugin for 10x faster HMR  
**Implemented:** Standard React plugin  
**Reason:** Vite 5 compatibility and stability  
**Impact:** Slower HMR but more stable builds

### 5. ESLint 8 → ESLint 9 with Flat Config

**Original Spec:** ESLint 8.57.0 with traditional config  
**Implemented:** ESLint 9.0.0 with flat config  
**Reason:** Proactive upgrade to avoid deprecated ESLint 8  
**Impact:** Modern configuration style, better performance

### 6. ESLint Plugin Versions (PR Review Fixes)

**Original Implementation:** eslint-plugin-react 7.37.0, eslint-plugin-react-hooks 5.0.0  
**Fixed to:** eslint-plugin-react 7.34.3, eslint-plugin-react-hooks 4.6.2  
**Reason:** Version 7.37.0 doesn't exist on npm, 5.0.0 is pre-release  
**Impact:** Using latest stable versions for reliability

### 7. Motion → Framer Motion

**Original Spec:** "motion": "12.15.0"  
**Implemented:** "framer-motion": "11.0.24"  
**Reason:** "motion" doesn't exist; docs likely meant framer-motion  
**Impact:** None - same library, correct package name

## Added Dependencies Not in Docs

### 8. Additional Libraries

**Added without spec:**

- lenis (1.3.4) - Smooth scrolling (replaces deprecated @studio-freight/lenis)
- lodash (4.17.21) - Utility functions
- papaparse (5.4.1) - CSV parsing for data imports
- sass (1.72.0) - SCSS support
- vitest (1.4.0) - Unit testing framework
- @react-three/drei (9.99.0) - Essential Three.js React utilities

**Reason:** Common requirements for portfolio sites  
**Impact:** Better developer experience, no negative effects

## Critical Missing Implementations

### 9. Missing Apps (2 of 3)

**Not Implemented:**

- /apps/jeremy-stokes
- /apps/vilinskyy

**Reason:** Initial setup phase only created example app  
**Impact:** Monorepo structure incomplete, can't validate cross-app builds

### 10. Missing Shared Packages (All)

**Not Implemented:**

- /packages/shared-ui
- /packages/three-components
- /packages/animation-lib

**Reason:** Premature abstraction - need apps first to identify shared code  
**Impact:** No code reuse yet, but structure ready

### 11. Missing Configuration Sharing

**Not Implemented:**

- /config/vite.base.ts
- /config/postcss.base.js
- /config/playwright.base.ts

**Reason:** Single app doesn't need shared config yet  
**Impact:** Will need these when adding more apps

### 12. Basic CI/CD Pipeline

**Implemented:** .github/workflows/ci.yml  
**Status:** Basic CI pipeline exists with setup, lint, typecheck, test, build, and E2E test jobs  
**Missing:** Advanced features like deployment, release automation, performance monitoring  
**Impact:** Automated testing on PR/push, but no deployment automation yet

## ES Modules Configuration

### 13. Added "type": "module"

**Original Spec:** Not mentioned  
**Implemented:** Added to all package.json files  
**Reason:** Prevent Vite CJS deprecation warnings  
**Impact:** Modern ES modules throughout project

## PR Review Changes (2025-05-30)

### 14. TypeScript References Added

**Original:** Root tsconfig.json had `composite: true` but no references  
**Fixed:** Added references array pointing to apps/robin-noguier  
**Reason:** TypeScript project references require explicit references array  
**Impact:** Proper incremental builds and type checking across monorepo

### 15. Turbo Pipeline Entries

**Original:** Only had build, dev, test, lint pipelines  
**Fixed:** Added test:e2e and test:unit pipeline entries  
**Reason:** Scripts in package.json referenced non-existent pipeline tasks  
**Impact:** Can now run `pnpm test:e2e` and `pnpm test:unit` successfully

### 16. Removed Redundant pnpm.overrides

**Original:** Had pnpm.overrides for react/react-dom versions  
**Fixed:** Removed the overrides section entirely  
**Reason:** Already using pinned versions in dependencies, overrides redundant  
**Impact:** Cleaner package.json, same version resolution

### 17. Removed Non-existent App Scripts

**Original:** Scripts for dev:jeremy and dev:vilinskyy  
**Fixed:** Removed these scripts until apps exist  
**Reason:** Prevent confusion and failing commands  
**Impact:** Only working scripts remain in package.json

### 18. ESLint TypeScript Parser

**Original:** No explicit parser specified in languageOptions  
**Fixed:** Added `parser: typescriptEslint.parser`  
**Reason:** Ensure proper TypeScript file parsing  
**Impact:** More reliable TypeScript linting

### 19. Documentation Accuracy Fixes

**Fixed in various docs:**

- Incorrect version numbers in code examples
- Invalid JSON syntax in feature_implementations_catalog.md (was frontend_feature_pack.md)
- Syntax errors in JavaScript examples
- Import paths (motion → framer-motion)
- Missing newlines at end of files (auto-fixed by Prettier)

**Reason:** Maintain accurate, runnable documentation  
**Impact:** Developers can copy-paste examples without errors

### 20. Documentation Files Renamed for Clarity

**Renamed:**

- `frontend_skeleton.md` → `architecture_monorepo_blueprint.md`
- `frontend_feature_pack.md` → `feature_implementations_catalog.md`
- `implementation_decisions.md` → `README_BEFORE_UPGRADING.md`
- `portfolio_setup_30-05-2025_07_42_19.md` → `setup_session_2025-05-30.md`

**Reason:** Better reflect content purpose and importance  
**Impact:** Clearer documentation structure, README_BEFORE_UPGRADING screams importance

## Future Upgrade Path

### Phase 1 (Immediate)

- Keep current versions for stability
- Implement missing apps
- Extract shared code to packages

### Phase 2 (After Ecosystem Updates)

- Upgrade to React 19 when @react-three/fiber supports it
- Upgrade to Vite 6 with new plugin versions
- Upgrade Three.js to latest

### Phase 3 (Feature Implementation)

- Implement all portfolio features from frontend_feature_pack.md
- Add CI/CD pipeline
- Complete testing infrastructure

## Validation Status

| Component      | Docs Aligned | Notes                                   |
| -------------- | ------------ | --------------------------------------- |
| React Version  | ❌           | Downgraded for compatibility            |
| Build Tools    | ❌           | Older Vite, different plugin            |
| 3D Libraries   | ❌           | Older versions for stability            |
| Animation      | ✅           | Correct library, older version          |
| Testing        | ⚠️           | Added Vitest, missing Playwright config |
| Linting        | ⚡           | ESLint 9 + fixed plugin versions        |
| TypeScript     | ✅           | Proper references configuration         |
| Turbo Pipeline | ✅           | All pipeline tasks properly defined     |
| Monorepo       | ⚠️           | Structure ready, apps missing           |
| CI/CD          | ⚠️           | Basic pipeline exists, missing deploy   |
| Features       | ❌           | None implemented yet                    |
| Documentation  | ✅           | All examples fixed and accurate         |

## Decision Authority

These decisions were made based on:

1. Peer dependency requirements
2. Ecosystem compatibility
3. Stability over bleeding edge
4. Practical development needs

Last validated: 2025-05-30  
Last PR review fixes: 2025-05-30 (PR #1)
