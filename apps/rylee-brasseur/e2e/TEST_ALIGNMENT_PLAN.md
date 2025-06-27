# Test Alignment Plan - ALL 23 Tests

## Summary

- **Keep & Update**: 15 tests (need verbose logging added)
- **Delete**: 8 tests (true duplicates or redundant)
- **Completed**: 1 test (test-no-scrollbar.spec.ts)

## KEEP These Tests (Need LogCollector + Verbose Logging)

### Core Motion System (4 tests)

1. ✅ **test-discrete-states.spec.ts** - Tests hero/header state transitions

   - Status: Needs LogCollector + verbose logging
   - Purpose: Core state machine testing

2. ✅ **test-observer-scroll.spec.ts** - Tests Observer scroll events

   - Status: Has basic logging, needs LogCollector
   - Purpose: Observer pattern validation

3. ✅ **test-scroll-reset.spec.ts** - Tests scroll position reset

   - Status: ALREADY HAS LogCollector! Good example
   - Purpose: Critical scroll behavior

4. ✅ **motion-system.spec.ts** - Basic motion system test
   - Status: Needs complete logging overhaul
   - Purpose: Core motion functionality

### Debug Tests (KEEP ALL - Essential Tools)

5. ✅ **debug-scroll-logs.spec.ts** - Scroll debugging

   - Status: Needs LogCollector
   - Purpose: Debug tool for scroll issues

6. ✅ **debug-transitions.spec.ts** - Transition debugging

   - Status: Needs LogCollector
   - Purpose: Debug tool for state transitions

7. ✅ **debug-observer.spec.ts** - Observer debugging
   - Status: Needs LogCollector
   - Purpose: Debug tool for Observer events

### Quick Tests (KEEP - Fast Sanity Checks)

8. ✅ **quick-screenshots.spec.ts** - Visual verification + animation test

   - Status: Has 1 console.log, needs full logging
   - Purpose: Quick visual check + kinetic animation

9. ✅ **check-viewport.spec.ts** - Viewport check

   - Status: No logging at all
   - Purpose: Quick viewport verification

10. ✅ **check-scroll-state.spec.ts** - Scroll state check
    - Status: No logging at all
    - Purpose: Quick scroll verification

### UI Tests

11. ✅ **test-no-scrollbar.spec.ts** - Scrollbar + responsive text
    - Status: DONE! Has LogCollector + verbose logging
    - Purpose: UI requirements

### Original Feature Tests (Pre-conversation)

12. ✅ **hero/hero-section.spec.ts** - Hero content

    - Status: Needs LogCollector
    - Purpose: Hero functionality

13. ✅ **hero/project-navigation.spec.ts** - Navigation

    - Status: Needs LogCollector
    - Purpose: Navigation testing

14. ✅ **modal/project-modal.spec.ts** - Modal functionality

    - Status: Needs LogCollector
    - Purpose: Modal behavior

15. ✅ **cursor/custom-cursor.spec.ts** - Custom cursor
    - Status: Needs LogCollector
    - Purpose: Cursor behavior

## DELETE These Tests (True Duplicates/Redundant)

### Numbered Tests (Redundant with others)

1. ❌ **01-initial-state.spec.ts** - Duplicate of test-discrete-states
2. ❌ **02-motion-system.spec.ts** - Duplicate of motion-system.spec.ts
3. ❌ **03-basic-functionality.spec.ts** - Too basic, covered by others

### Duplicate Motion Tests

4. ❌ **test-motion-system.spec.ts** - Duplicate of motion-system.spec.ts
5. ❌ **test-actual-motion.spec.ts** - Redundant with test-discrete-states
6. ❌ **test-observer-motion.spec.ts** - Redundant with test-observer-scroll
7. ❌ **verify-initial-viewport.spec.ts** - Redundant with check-viewport
8. ❌ **test-timeline-control.spec.ts** - Not actually testing anything useful

## Implementation Order

### Phase 1: Delete Redundant Tests

```bash
rm e2e/{01-initial-state,02-motion-system,03-basic-functionality}.spec.ts
rm e2e/{test-motion-system,test-actual-motion,test-observer-motion}.spec.ts
rm e2e/{verify-initial-viewport,test-timeline-control}.spec.ts
```

### Phase 2: Update High-Priority Tests (Core functionality)

1. test-observer-scroll.spec.ts
2. test-discrete-states.spec.ts
3. motion-system.spec.ts

### Phase 3: Update Debug Tests

1. debug-scroll-logs.spec.ts
2. debug-transitions.spec.ts
3. debug-observer.spec.ts

### Phase 4: Update Quick Tests

1. quick-screenshots.spec.ts
2. check-viewport.spec.ts
3. check-scroll-state.spec.ts

### Phase 5: Update Feature Tests

1. hero/hero-section.spec.ts
2. hero/project-navigation.spec.ts
3. modal/project-modal.spec.ts
4. cursor/custom-cursor.spec.ts

## Logging Standard for Updates

Each test should have:

1. LogCollector import and instantiation
2. Test start/end logging
3. Action logging before each step
4. State logging after each check
5. Save logs at end (not just on failure)

Example:

```typescript
const logCollector = new LogCollector(page)
console.log('[Test] ==== Starting: ${testName} ====')
// ... test steps with logging ...
await logCollector.saveLogs(`test-results/${testName}-${Date.now()}.json`)
```
