# Test Audit: Logging Status

## 🚨 CRITICAL FINDINGS

### LogCollector Usage
- **1/23 tests** use LogCollector properly (`test-scroll-reset.spec.ts`)
- **22/23 tests** need LogCollector added
- Many tests clear logs with `logs.length = 0` - **DATA LOSS!**

## Test-by-Test Audit

### ❌ Tests with BASIC/NO Logging

1. **quick-screenshots.spec.ts**
   - Has: ONE console.log for phone animation
   - Missing: LogCollector, verbose test flow logging
   - Fix: Add LogCollector, log each test step

2. **test-observer-scroll.spec.ts**
   - Has: Basic array capture, CLEARS logs (data loss!)
   - Missing: LogCollector, doesn't save logs on failure
   - Fix: Use LogCollector, mark before/after events

3. **test-no-scrollbar.spec.ts**
   - Has: NO LOGGING AT ALL
   - Missing: Everything
   - Fix: Add LogCollector, log viewport changes

4. **test-discrete-states.spec.ts**
   - Has: Basic console capture
   - Missing: Verbose state transition logging
   - Fix: Log each state change with timestamps

### ✅ Tests with PROPER Logging

1. **test-scroll-reset.spec.ts**
   - Has: LogCollector with mark/filter
   - Has: Saves logs on failure
   - Has: Verbose step logging
   - **THIS IS THE GOLD STANDARD**

## Recommended Updates

### 1. Standard Test Template
```typescript
import { test, expect } from '@playwright/test'
import { LogCollector } from './support/logCollector'

test('test name', async ({ page }) => {
  const logCollector = new LogCollector(page)
  console.log('[Test] Starting: test name')
  
  // Mark important points
  const mark1 = logCollector.mark()
  
  // Log each action
  console.log('[Test] Action: navigating to page')
  await page.goto('http://localhost:5173')
  
  // Check logs for expected patterns
  const logs = logCollector.getLogsSinceMark(mark1)
  
  // Save on failure
  test.info().errors.length > 0 && 
    await logCollector.saveLogs(`test-results/test-name-${Date.now()}.json`)
})
```

### 2. Tests Needing Immediate Updates

**HIGH PRIORITY** (core functionality):
- `test-observer-scroll.spec.ts` - Add LogCollector
- `test-discrete-states.spec.ts` - Add verbose state logging
- `quick-screenshots.spec.ts` - Log each screenshot reason

**MEDIUM PRIORITY** (UI tests):
- `test-no-scrollbar.spec.ts` - Add all logging
- `hero/*.spec.ts` - Add LogCollector to all
- `modal/*.spec.ts` - Add interaction logging

### 3. Tests to DELETE (redundant even with logging)
- `debug-*.spec.ts` - Temporary debug tests
- `check-*.spec.ts` - Too simple
- `01-*, 02-*, 03-*.spec.ts` - Redundant
- Duplicate motion tests (keep only best one)

## Action Plan

1. Update all keeper tests to use LogCollector
2. Add verbose logging at each test step
3. Delete redundant tests
4. Create shared test utilities for common logging patterns

## Example: Updating test-observer-scroll.spec.ts

```typescript
// BEFORE: Basic array, data loss
const logs: string[] = []
page.on('console', msg => logs.push(msg.text()))
logs.length = 0 // DATA LOSS!

// AFTER: LogCollector, no data loss
const logCollector = new LogCollector(page)
const scrollMark = logCollector.mark()
console.log('[Test] Triggering scroll event')
await page.mouse.wheel(0, 100)
const scrollLogs = logCollector.getLogsSinceMark(scrollMark)
```