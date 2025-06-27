# Test Recommendations - REVISED

## 🔥 KEEP ALL DEBUG TESTS

Debug tests are ESSENTIAL development tools, not temporary garbage!

## Tests to KEEP and ENHANCE with Verbose Logging

### 1. Debug Tests (KEEP ALL)

- ✅ `debug-scroll-logs.spec.ts` - Essential for debugging scroll issues
- ✅ `debug-transitions.spec.ts` - Helps debug state transitions
- ✅ `debug-observer.spec.ts` - Critical for Observer pattern debugging

### 2. Quick Tests (KEEP - they're fast checks)

- ✅ `quick-screenshots.spec.ts` - Fast visual verification
- ✅ `check-viewport.spec.ts` - Quick viewport check
- ✅ `check-scroll-state.spec.ts` - Quick scroll verification

### 3. Core Functionality Tests (ADD VERBOSE LOGGING)

- ✅ `test-observer-scroll.spec.ts` - Needs LogCollector + verbose logs
- ✅ `test-discrete-states.spec.ts` - Log EVERY state transition
- ✅ `test-scroll-reset.spec.ts` - Already has good logging!

### 4. UI Tests (ADD LOGGING)

- ✅ `test-no-scrollbar.spec.ts` - Add viewport/scroll logging
- ✅ `hero/*.spec.ts` - Add interaction logging
- ✅ `modal/*.spec.ts` - Add state change logging

## Tests that ARE Actually Redundant

Only delete if they're TRUE DUPLICATES:

- `01-initial-state.spec.ts` vs `test-discrete-states.spec.ts` - Keep both if testing different things
- `motion-system.spec.ts` vs `test-motion-system.spec.ts` - Check if they test different aspects

## Logging Standards for ALL Tests

```typescript
test('any test', async ({ page }) => {
  const logCollector = new LogCollector(page)

  // VERBOSE logging at EVERY step
  console.log('[Test] ==== Starting test: any test ====')
  console.log('[Test] Browser:', await page.evaluate(() => navigator.userAgent))
  console.log('[Test] Viewport:', await page.viewportSize())
  console.log('[Test] URL:', page.url())

  // Log before EVERY action
  console.log('[Test] ACTION: Navigating to page')
  await page.goto('http://localhost:5173')
  console.log('[Test] RESULT: Navigation complete')

  // Log state checks
  console.log('[Test] CHECKING: Hero visibility')
  const heroVisible = await page.locator('.heroTitle').isVisible()
  console.log('[Test] RESULT: Hero visible =', heroVisible)

  // Save logs ALWAYS (not just on failure)
  await logCollector.saveLogs(
    `test-results/${test.info().title}-${Date.now()}.json`
  )
  console.log('[Test] ==== Test complete ====')
})
```

## Priority Updates

1. **Add LogCollector to ALL tests** (including debug/quick tests)
2. **Add verbose console.log at EVERY action/check**
3. **KEEP debug tests** - they're development tools!
4. **Log browser console output** in all tests
5. **Save logs for EVERY test run** (not just failures)

## Example Update for debug-scroll-logs.spec.ts

```typescript
// Make it MORE verbose, not less!
test('capture scroll debug logs', async ({ page }) => {
  const logCollector = new LogCollector(page)

  console.log('[DEBUG TEST] ============================================')
  console.log('[DEBUG TEST] Purpose: Capture all scroll-related logs')
  console.log('[DEBUG TEST] Timestamp:', new Date().toISOString())
  console.log('[DEBUG TEST] ============================================')

  console.log('[DEBUG TEST] Navigating to page...')
  await page.goto('http://localhost:5173')

  console.log(
    '[DEBUG TEST] Current scroll position:',
    await page.evaluate(() => window.scrollY)
  )
  console.log(
    '[DEBUG TEST] Page height:',
    await page.evaluate(() => document.body.scrollHeight)
  )
  console.log(
    '[DEBUG TEST] Viewport height:',
    await page.evaluate(() => window.innerHeight)
  )

  // etc... MORE logging, not less!
})
```

## Summary

- Debug tests = PERMANENT development tools
- Quick tests = Fast sanity checks (KEEP)
- ALL tests need VERBOSE logging
- LogCollector in EVERY test
- Save logs for ALL runs
