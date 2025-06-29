# StoryScroller: Testable Architecture Design

## Problem Statement

The current StoryScroller implementation has several architectural flaws that make it unsuitable for production:

1. **State Synchronization**: The `useStoryScroller` hook and component maintain separate, unsynchronized state
2. **Hard Dependencies**: Direct access to `window` and `document` makes testing impossible
3. **Complex State Management**: Mix of `useRef` and `useState` creates unpredictable behavior
4. **Type Safety**: Use of `any` types defeats TypeScript's purpose
5. **No Error Recovery**: Errors are only logged, with no fallback UI

## Proposed Architecture

### 1. Dependency Injection for Browser APIs

Create an abstraction layer for all browser APIs:

```typescript
// services/BrowserService.ts
export interface IBrowserService {
  scrollTo(x: number, y: number): void;
  getScrollY(): number;
  addEventListener(event: string, handler: EventListener): void;
  removeEventListener(event: string, handler: EventListener): void;
  getBoundingClientRect(element: HTMLElement): DOMRect;
  requestAnimationFrame(callback: FrameRequestCallback): number;
  cancelAnimationFrame(id: number): void;
}

// Default implementation for production
export class BrowserService implements IBrowserService {
  scrollTo(x: number, y: number): void {
    window.scrollTo(x, y);
  }
  
  getScrollY(): number {
    return window.scrollY;
  }
  
  // ... other methods
}

// Mock implementation for testing
export class MockBrowserService implements IBrowserService {
  private scrollY = 0;
  private listeners = new Map<string, Set<EventListener>>();
  
  scrollTo(x: number, y: number): void {
    this.scrollY = y;
    // Trigger scroll events
  }
  
  getScrollY(): number {
    return this.scrollY;
  }
  
  // ... other methods
}
```

### 2. Redux-Style State Management

Replace mixed refs/state with a single reducer:

```typescript
// state/scrollReducer.ts
export interface ScrollState {
  currentIndex: number;
  isAnimating: boolean;
  isScrolling: boolean;
  lastScrollTime: number;
  isClient: boolean;
  pathname: string;
}

export type ScrollAction =
  | { type: 'SET_CURRENT_INDEX'; payload: number }
  | { type: 'START_ANIMATION' }
  | { type: 'END_ANIMATION' }
  | { type: 'START_SCROLL' }
  | { type: 'END_SCROLL' }
  | { type: 'SET_CLIENT'; payload: boolean }
  | { type: 'SET_PATHNAME'; payload: string };

export function scrollReducer(state: ScrollState, action: ScrollAction): ScrollState {
  switch (action.type) {
    case 'SET_CURRENT_INDEX':
      return { ...state, currentIndex: action.payload };
    case 'START_ANIMATION':
      return { ...state, isAnimating: true };
    case 'END_ANIMATION':
      return { ...state, isAnimating: false };
    case 'START_SCROLL':
      return { ...state, isScrolling: true, lastScrollTime: Date.now() };
    case 'END_SCROLL':
      return { ...state, isScrolling: false };
    case 'SET_CLIENT':
      return { ...state, isClient: action.payload };
    case 'SET_PATHNAME':
      return { ...state, pathname: action.payload };
    default:
      return state;
  }
}
```

### 3. React Context for State Synchronization

Create a context that both the component and hook can use:

```typescript
// context/ScrollContext.tsx
export interface ScrollContextValue {
  state: ScrollState;
  dispatch: React.Dispatch<ScrollAction>;
  browserService: IBrowserService;
}

export const ScrollContext = React.createContext<ScrollContextValue | null>(null);

export const ScrollProvider: React.FC<{
  children: React.ReactNode;
  browserService?: IBrowserService;
}> = ({ children, browserService = new BrowserService() }) => {
  const [state, dispatch] = useReducer(scrollReducer, initialState);
  
  return (
    <ScrollContext.Provider value={{ state, dispatch, browserService }}>
      {children}
    </ScrollContext.Provider>
  );
};

// Updated hook that uses the context
export function useStoryScroller() {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error('useStoryScroller must be used within ScrollProvider');
  }
  
  return {
    currentSection: context.state.currentIndex,
    setCurrentSection: (index: number) => {
      context.dispatch({ type: 'SET_CURRENT_INDEX', payload: index });
    },
  };
}
```

### 4. Testable Component Structure

The component now receives dependencies through context:

```typescript
export const StoryScroller: React.FC<StoryScrollerProps> = ({ sections }) => {
  const { state, dispatch, browserService } = useContext(ScrollContext);
  
  // All browser interactions go through browserService
  const scrollToSection = useCallback((index: number) => {
    if (state.isAnimating) return;
    
    dispatch({ type: 'START_ANIMATION' });
    const targetElement = containerRef.current?.children[index];
    
    if (targetElement) {
      const rect = browserService.getBoundingClientRect(targetElement);
      const y = rect.top + browserService.getScrollY();
      
      // Animation logic using browserService
      animateScroll(y, () => {
        dispatch({ type: 'END_ANIMATION' });
        dispatch({ type: 'SET_CURRENT_INDEX', payload: index });
      });
    }
  }, [state.isAnimating, browserService, dispatch]);
  
  // Rest of component...
};
```

### 5. Error Boundaries

Add proper error handling with fallback UI:

```typescript
export class ScrollErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('StoryScroller error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="story-scroller-fallback">
          <p>Smooth scrolling is not available. Using standard scroll.</p>
          {/* Render sections with CSS scroll-snap fallback */}
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

## Testing Strategy

With this architecture, we can now write comprehensive tests:

```typescript
describe('StoryScroller', () => {
  it('synchronizes state between component and hook', () => {
    const mockBrowser = new MockBrowserService();
    
    const TestComponent = () => {
      const { currentSection } = useStoryScroller();
      return <div data-testid="current">{currentSection}</div>;
    };
    
    const { getByTestId } = render(
      <ScrollProvider browserService={mockBrowser}>
        <StoryScroller sections={[...]} />
        <TestComponent />
      </ScrollProvider>
    );
    
    // Simulate scroll to section 1
    act(() => {
      mockBrowser.triggerScroll(1);
    });
    
    expect(getByTestId('current')).toHaveTextContent('1');
  });
  
  it('handles errors gracefully', () => {
    const mockBrowser = new MockBrowserService();
    mockBrowser.scrollTo = () => { throw new Error('Scroll failed'); };
    
    const { getByText } = render(
      <ScrollErrorBoundary>
        <ScrollProvider browserService={mockBrowser}>
          <StoryScroller sections={[...]} />
        </ScrollProvider>
      </ScrollErrorBoundary>
    );
    
    // Should show fallback UI
    expect(getByText(/Smooth scrolling is not available/)).toBeInTheDocument();
  });
});
```

## Migration Plan

1. **Phase 1**: Implement BrowserService abstraction
2. **Phase 2**: Migrate to reducer-based state management
3. **Phase 3**: Create ScrollContext and update hooks
4. **Phase 4**: Add error boundaries
5. **Phase 5**: Write comprehensive test suite
6. **Phase 6**: Remove all `any` types and ensure full type safety

## Benefits

1. **Testability**: All browser APIs are mockable
2. **State Consistency**: Single source of truth for all state
3. **Type Safety**: No `any` types, full TypeScript benefits
4. **Error Recovery**: Graceful degradation with fallback UI
5. **Maintainability**: Clear separation of concerns
6. **SSR Compatibility**: Browser APIs are abstracted and can be conditionally loaded