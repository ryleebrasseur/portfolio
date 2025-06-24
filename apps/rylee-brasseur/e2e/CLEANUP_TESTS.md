# Test Cleanup Plan

## Tests to Delete (Redundant/Debug)

```bash
# Debug tests (temporary)
rm e2e/debug-scroll-logs.spec.ts
rm e2e/debug-transitions.spec.ts
rm e2e/debug-observer.spec.ts

# Simple checks (too basic)
rm e2e/check-viewport.spec.ts
rm e2e/check-scroll-state.spec.ts

# Numbered tests (redundant)
rm e2e/01-initial-state.spec.ts
rm e2e/02-motion-system.spec.ts
rm e2e/03-basic-functionality.spec.ts

# Duplicate motion tests
rm e2e/motion-system.spec.ts
rm e2e/test-motion-system.spec.ts
rm e2e/test-actual-motion.spec.ts
rm e2e/test-observer-motion.spec.ts
rm e2e/verify-initial-viewport.spec.ts
rm e2e/test-timeline-control.spec.ts
```

## Tests to Keep

### Core Motion System
- `test-discrete-states.spec.ts` - Discrete state transitions
- `test-observer-scroll.spec.ts` - Observer pattern validation
- `test-scroll-reset.spec.ts` - Scroll position reset behavior

### UI/Animation
- `quick-screenshots.spec.ts` - Kinetic animation & header checks
- `test-no-scrollbar.spec.ts` - Scrollbar & responsive text

### Original Features
- `hero/hero-section.spec.ts`
- `hero/project-navigation.spec.ts`
- `modal/project-modal.spec.ts`
- `cursor/custom-cursor.spec.ts`

## Run cleanup:
```bash
# Delete all redundant tests at once
rm e2e/{debug-*,check-*,0[1-3]-*,motion-system,test-motion-system,test-actual-motion,test-observer-motion,verify-initial-viewport,test-timeline-control}.spec.ts
```