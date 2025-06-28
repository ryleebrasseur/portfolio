# @ryleebrasseur/story-scroller

A production-ready React scroll-snapping component built with GSAP and Lenis. This package implements a resilient section-based scrolling system with extensive workarounds for common production issues.

## Features

- 🚀 **Smooth scroll snapping** between full-viewport sections
- 🎯 **Mac trackpad momentum handling** with intelligent debouncing
- ⚛️ **React 18+ compatible** with proper Strict Mode cleanup
- 🔧 **Next.js App Router ready** with SSR/hydration safeguards
- 📱 **Touch & keyboard navigation** support
- ♿ **Accessibility-first** design with CSS fallbacks
- 🎨 **Fully customizable** animations and behavior
- 📦 **TypeScript** support with comprehensive types
- 🧹 **Zero memory leaks** with militant cleanup practices

## Installation

```bash
# pnpm (recommended)
pnpm add @ryleebrasseur/story-scroller

# npm
npm install @ryleebrasseur/story-scroller

# yarn
yarn add @ryleebrasseur/story-scroller
```

## Quick Start

```tsx
'use client' // Required for Next.js App Router

import { StoryScroller } from '@ryleebrasseur/story-scroller'
import '@ryleebrasseur/story-scroller/styles' // Import CSS

export default function HomePage() {
  const sections = [
    <div key="intro" style={{ background: '#1a1a1a', color: 'white' }}>
      <h1>Welcome</h1>
    </div>,
    <div key="about" style={{ background: '#2a2a2a', color: 'white' }}>
      <h2>About Us</h2>
    </div>,
    <div key="contact" style={{ background: '#3a3a3a', color: 'white' }}>
      <h3>Contact</h3>
    </div>,
  ]

  return <StoryScroller sections={sections} />
}
```

## Advanced Usage

### With Configuration

```tsx
import { StoryScroller } from '@ryleebrasseur/story-scroller'

function App() {
  const handleSectionChange = (index: number) => {
    console.log(`Now viewing section ${index}`)
    // Update URL hash, analytics, etc.
  }

  return (
    <StoryScroller
      sections={sections}
      duration={1.5}
      tolerance={60} // Higher for sensitive trackpads
      onSectionChange={handleSectionChange}
      keyboardNavigation={true}
      containerClassName="my-scroller"
      sectionClassName="my-section"
    />
  )
}
```

### With Navigation Hook

```tsx
import { StoryScroller, useStoryScroller } from '@ryleebrasseur/story-scroller'

function AppWithNavigation() {
  const {
    currentSection,
    gotoSection,
    nextSection,
    prevSection,
    isFirstSection,
    isLastSection,
  } = useStoryScroller(sections.length)

  return (
    <>
      <nav style={{ position: 'fixed', top: 20, right: 20, zIndex: 100 }}>
        <button onClick={prevSection} disabled={isFirstSection}>
          Previous
        </button>
        <span>{currentSection + 1} / {sections.length}</span>
        <button onClick={nextSection} disabled={isLastSection}>
          Next
        </button>
      </nav>
      
      <StoryScroller
        sections={sections}
        onSectionChange={setCurrentSection}
      />
    </>
  )
}
```

## API Reference

### `<StoryScroller />`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sections` | `ReactNode[]` | **required** | Array of React elements representing each section |
| `duration` | `number` | `1.2` | Scroll animation duration in seconds |
| `easing` | `(t: number) => number` | Custom easing | Easing function for animations |
| `tolerance` | `number` | `50` | GSAP Observer tolerance (higher = less sensitive) |
| `smoothTouch` | `boolean` | `false` | Enable smooth scrolling on touch devices |
| `touchMultiplier` | `number` | `2` | Touch scroll speed multiplier |
| `preventDefault` | `boolean` | `true` | Prevent default scroll behavior |
| `invertDirection` | `boolean` | `false` | Invert scroll direction |
| `onSectionChange` | `(index: number) => void` | - | Callback when section changes |
| `keyboardNavigation` | `boolean` | `true` | Enable arrow key navigation |
| `containerClassName` | `string` | `''` | CSS class for container |
| `sectionClassName` | `string` | `''` | CSS class for sections |
| `className` | `string` | `''` | Additional CSS class for container |
| `style` | `React.CSSProperties` | `{}` | Inline styles for container |

### `useStoryScroller(totalSections)`

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `currentSection` | `number` | Current active section index |
| `setCurrentSection` | `(index: number) => void` | Update current section |
| `gotoSection` | `(index: number) => void` | Navigate to specific section |
| `nextSection` | `() => void` | Go to next section |
| `prevSection` | `() => void` | Go to previous section |
| `firstSection` | `() => void` | Go to first section |
| `lastSection` | `() => void` | Go to last section |
| `isFirstSection` | `boolean` | Whether on first section |
| `isLastSection` | `boolean` | Whether on last section |

## Known Issues & Workarounds

### Mac Trackpad Momentum

Mac trackpads continue emitting scroll events after release. The component includes:
- High tolerance values (50+ recommended)
- Intelligent debouncing with `isAnimating` flag
- ScrollTrigger's `scrollEnd` event detection

### Next.js Hydration

ScrollTrigger modifies DOM during initialization, causing hydration mismatches. Mitigated by:
- Dynamic Lenis import
- Delayed ScrollTrigger configuration
- Automatic style cleanup/restore

### Memory Leaks

Prevented through:
- `useGSAP` hook for automatic GSAP cleanup
- Explicit cleanup of Lenis and Observer instances
- GSAP ticker callback removal
- Nuclear cleanup on route changes

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+
- Android Chrome 90+

## Performance Considerations

- Adds ~100-150KB to bundle (GSAP + Lenis)
- May impact performance on low-end mobile devices
- Consider using CSS-only fallback for critical pages
- Test on real devices, especially Mac trackpads

## CSS Fallback

The component includes CSS scroll-snap as a fallback:

```css
/* Automatic fallback when JS fails */
.story-scroller-container {
  scroll-snap-type: y proximity; /* Not mandatory for accessibility */
}
```

## Accessibility

- Keyboard navigation with Arrow/Page/Home/End keys
- Focus management with `tabIndex`
- `prefers-reduced-motion` support
- Screen reader compatible
- CSS fallback for no-JS scenarios

## Development

```bash
# Install dependencies
pnpm install

# Development build with watch
pnpm dev

# Production build
pnpm build

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

## License

MIT © Rylee Brasseur

## Credits

Built on the shoulders of giants:
- [GSAP](https://gsap.com) by GreenSock
- [Lenis](https://github.com/darkroomengineering/lenis) by Studio Freight/Darkroom
- Research and battle-testing by the web development community

## Further Reading

- [Production Pitfalls and Paranoid Solutions](https://github.com/ryleebrasseur/portfolio/blob/main/docs/StoryScroller-research.md)
- [GSAP React Integration Guide](https://gsap.com/resources/React/)
- [Lenis Documentation](https://github.com/darkroomengineering/lenis)