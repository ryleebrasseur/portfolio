# State Closure Bug Fix

## Problem Identified
The console logs showed that `currentIndex` was stuck at 0 throughout the entire session, causing:
- Hundreds of "Auto-updating section" messages (infinite loop)
- Wrong animation IDs (always "section-0-to-1")
- State sync failures after animations

## Root Cause
The `useGSAP` hook was capturing the `state` object at mount time and never updating it. This is a classic JavaScript closure issue where callbacks see stale values.

## Solution Applied
1. **Created stateRef**: 
   ```typescript
   const stateRef = useRef(state)
   stateRef.current = state  // Updates on every render
   ```

2. **Replaced all state references inside useGSAP**:
   - Changed `state.currentIndex` → `stateRef.current.currentIndex`
   - Changed `state.isAnimating` → `stateRef.current.isAnimating`
   - Applied to all callbacks: Lenis scroll, Observer handlers, keyboard events

3. **Fixed animation tracking**:
   - Capture `fromIndex` before state updates
   - Use consistent IDs: `section-${fromIndex}-to-${newIndex}`

4. **Reduced log spam**:
   - Throttled "Auto-updating section" to every 20th event
   - Disabled useDebouncing debug mode

## Result
- State now updates correctly when scrolling
- Animation IDs show proper from/to sections
- No more infinite loops or excessive logging
- useDebouncing integration works as intended

## Key Lesson
When using hooks like `useGSAP` that create long-lived callbacks, always use refs for values that change over time. The `useDebouncing` hook already follows this pattern correctly, which is why it didn't have this issue.