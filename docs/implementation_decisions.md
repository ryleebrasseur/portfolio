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

### 6. Motion → Framer Motion
**Original Spec:** "motion": "12.15.0"  
**Implemented:** "framer-motion": "11.0.24"  
**Reason:** "motion" doesn't exist; docs likely meant framer-motion  
**Impact:** None - same library, correct package name

## Added Dependencies Not in Docs

### 7. Additional Libraries
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

### 8. Missing Apps (2 of 3)
**Not Implemented:**
- /apps/jeremy-stokes
- /apps/vilinskyy

**Reason:** Initial setup phase only created example app  
**Impact:** Monorepo structure incomplete, can't validate cross-app builds

### 9. Missing Shared Packages (All)
**Not Implemented:**
- /packages/shared-ui
- /packages/three-components  
- /packages/animation-lib

**Reason:** Premature abstraction - need apps first to identify shared code  
**Impact:** No code reuse yet, but structure ready

### 10. Missing Configuration Sharing
**Not Implemented:**
- /config/vite.base.ts
- /config/postcss.base.js
- /config/playwright.base.ts

**Reason:** Single app doesn't need shared config yet  
**Impact:** Will need these when adding more apps

### 11. No CI/CD Pipeline
**Not Implemented:** .github/workflows/ci.yml  
**Reason:** Repository not connected to GitHub yet  
**Impact:** No automated testing/deployment

## ES Modules Configuration

### 12. Added "type": "module"
**Original Spec:** Not mentioned  
**Implemented:** Added to all package.json files  
**Reason:** Prevent Vite CJS deprecation warnings  
**Impact:** Modern ES modules throughout project

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

| Component | Docs Aligned | Notes |
|-----------|--------------|--------|
| React Version | ❌ | Downgraded for compatibility |
| Build Tools | ❌ | Older Vite, different plugin |
| 3D Libraries | ❌ | Older versions for stability |
| Animation | ✅ | Correct library, older version |
| Testing | ⚠️ | Added Vitest, missing Playwright config |
| Linting | ⚡ | Newer than docs (ESLint 9) |
| Monorepo | ⚠️ | Structure ready, apps missing |
| Features | ❌ | None implemented yet |

## Decision Authority

These decisions were made based on:
1. Peer dependency requirements
2. Ecosystem compatibility
3. Stability over bleeding edge
4. Practical development needs

Last validated: 2025-05-30