# Motion System Logging Documentation

## Overview
The motion system includes comprehensive logging for debugging and monitoring. All logs use prefixed format for easy filtering.

## Log Prefixes

### Core Components
- `[HeroToContactHeader]` - Main orchestrator managing hero/header transitions
- `[MotionProvider]` - Motion context provider and element registry
- `[Observer]` - GSAP Observer scroll event handler
- `[SessionState]` - Session storage manager
- `[HTML]` - Pre-React DOM events and scroll monitoring

### Test Infrastructure
- `[LogCollector]` - Test log collection and analysis
- `[Test]` - Test execution flow markers

## Key Log Events

### Initialization
```
[HeroToContactHeader] Initializing orchestrator
[HeroToContactHeader] Initial scroll position: 0
[HeroToContactHeader] Current index: 0
[HeroToContactHeader] Creating header element
[HeroToContactHeader] Observer created successfully
```

### Transitions
```
[HeroToContactHeader] gotoSection called: {targetIndex: 1, direction: down, currentIndex: 0, animating: false, timestamp: ...}
[HeroToContactHeader] Transitioning: hero -> header
[HeroToContactHeader] Animation complete: {newIndex: 1, section: header, timestamp: ...}
```

### Scroll Events
```
[Observer] Scroll DOWN detected: {scrollY: 0, currentIndex: 0, animating: false, timestamp: ...}
[Observer] BLOCKED: Animation in progress
[Observer] BLOCKED: Already at last section
```

### Element Registration
```
[MotionProvider] Registering element: hero-name
[MotionProvider] Registering element: hero-title
```

## Debug Features

### Browser Console Access
- `window.SessionState` - Access session state manager
- `window.testGotoSection('header'|'hero')` - Trigger transitions programmatically

### Test Utilities
- LogCollector captures all console output during tests
- Logs are preserved across test marks for analysis
- Failed tests can dump logs for debugging

## Common Log Patterns

### Successful Page Load
1. HTML scroll position reset
2. MotionProvider initializes
3. HeroToContactHeader initializes (may happen twice due to React)
4. Elements register with MotionProvider
5. Header DOM created and appended
6. Observer created after 100ms delay

### Scroll-triggered Transition
1. Observer detects scroll event
2. gotoSection validates state
3. Animation begins (blocks further events)
4. Transition logs show direction
5. Animation completes, state updated

## Troubleshooting

### Double Initialization
- Expected in React development due to component lifecycle
- Production builds should show single initialization
- Header cleanup prevents duplicate DOM elements

### Missing Elements Warning
- Normal on first render before registration
- Should resolve on second render
- If persists, check element ref setup

### Scroll Position Issues
- Check HTML logs for browser restoration
- Verify Observer delay (100ms) is sufficient
- Monitor for competing scroll handlers