# GSAP Cheatsheet

## Core Methods

### gsap.to()

Animates from current values to target values

```javascript
gsap.to('.box', {
  x: 200,
  rotation: 360,
  duration: 2,
  ease: 'power2.inOut',
  stagger: 0.1,
  onComplete: () => console.log('done!'),
})
```

### gsap.from()

Animates from specified values to current values

```javascript
gsap.from('.box', {
  opacity: 0,
  y: 100,
  duration: 1,
  ease: 'back.out(1.7)',
})
```

### gsap.fromTo()

Defines both starting and ending values

```javascript
gsap.fromTo('.box', { opacity: 0, x: -100 }, { opacity: 1, x: 0, duration: 1 })
```

### gsap.set()

Immediately sets properties (no animation)

```javascript
gsap.set('.box', {
  x: 100,
  opacity: 0.5,
  scale: 2,
})
```

## Timeline

### Creating Timelines

```javascript
const tl = gsap.timeline({
  defaults: { duration: 1, ease: 'power2.out' },
  paused: true,
  onComplete: () => console.log('timeline complete'),
})

// Add animations
tl.to('.box1', { x: 100 })
  .to('.box2', { y: 50 }, '-=0.5') // overlap by 0.5s
  .to('.box3', { rotation: 180 }, '<') // start at same time as previous
  .to('.box4', { scale: 2 }, '>') // start after previous ends
```

### Timeline Position Parameter

- `"+=1"` - 1 second after the previous animation ends
- `"-=1"` - 1 second before the previous animation ends
- `"<"` - align with start of previous animation
- `">"` - align with end of previous animation
- `2` - at exactly 2 seconds
- `"someLabel"` - at a label position

## ScrollTrigger

### Basic Setup

```javascript
gsap.registerPlugin(ScrollTrigger)

gsap.to('.box', {
  x: 400,
  scrollTrigger: {
    trigger: '.box',
    start: 'top center', // when top of trigger hits center of viewport
    end: 'bottom top', // when bottom of trigger hits top of viewport
    scrub: true, // smooth scrubbing
    pin: true, // pin the trigger element
    markers: true, // debug markers
  },
})
```

### Advanced ScrollTrigger

```javascript
ScrollTrigger.create({
  trigger: '.trigger',
  start: 'top top',
  end: 'bottom top',
  onEnter: () => console.log('entered'),
  onLeave: () => console.log('left'),
  onEnterBack: () => console.log('entered back'),
  onLeaveBack: () => console.log('left back'),
  onUpdate: (self) => console.log('progress:', self.progress),
})
```

### ScrollTrigger with Timeline

```javascript
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: '.container',
    start: 'top top',
    end: 'bottom top',
    scrub: 1,
    pin: true,
  },
})

tl.to('.elem1', { x: 100 })
  .to('.elem2', { y: 50 }, 0.5)
  .to('.elem3', { rotation: 360 })
```

## Flip Plugin

### Basic Flip

```javascript
gsap.registerPlugin(Flip)

// Capture state
const state = Flip.getState('.elements')

// Make changes to DOM/CSS
doSomething()

// Animate from captured state
Flip.from(state, {
  duration: 1,
  ease: 'power2.inOut',
  stagger: 0.1,
  absolute: true, // use position: absolute during animation
  scale: true, // use scale instead of width/height
  onComplete: () => console.log('Flip complete!'),
})
```

### Flip with data-flip-id

```javascript
// Elements with matching data-flip-id will morph between states
// Before state:
<div data-flip-id="box-1" class="small-box"></div>

// After state:
<div data-flip-id="box-1" class="large-box"></div>

// Flip will automatically match and animate between them
```

## Common Properties

### Transform Properties

- `x` / `y` - translateX/Y (use instead of left/top for performance)
- `rotation` - in degrees
- `scale` / `scaleX` / `scaleY`
- `skewX` / `skewY`
- `transformOrigin` - "center center", "top left", "50% 100%", etc.

### Display Properties

- `opacity`
- `visibility` - "visible" or "hidden"
- `autoAlpha` - combines opacity and visibility
- `display` - "block", "none", etc.

### Special Properties

- `stagger` - delay between each target
- `repeat` - number of repeats (-1 for infinite)
- `yoyo` - alternate direction on repeat
- `delay` - delay before animation starts
- `ease` - easing function

## Easing Options

### Power Eases

- `"power1"`, `"power2"`, `"power3"`, `"power4"`
- Add `.in`, `.out`, or `.inOut`
- Example: `"power2.inOut"`

### Other Eases

- `"elastic"`, `"back"`, `"bounce"`, `"rough"`, `"slow"`
- `"circ"`, `"expo"`, `"sine"`
- `"none"` or `"linear"`

### Custom Eases

```javascript
ease: 'back.out(1.7)'
ease: 'elastic.out(1, 0.3)'
```

## Utility Methods

### gsap.utils

```javascript
// Clamp values
gsap.utils.clamp(0, 100, value)

// Map range
gsap.utils.mapRange(0, 100, 0, 1, value)

// Wrap values
gsap.utils.wrap(0, 360, value)

// Get array of elements
gsap.utils.toArray('.class')

// Random
gsap.utils.random(0, 100)
gsap.utils.random(['red', 'green', 'blue'])
```

### Control Methods

```javascript
const tween = gsap.to('.box', { x: 100, duration: 2 })

tween.play()
tween.pause()
tween.reverse()
tween.restart()
tween.seek(1) // jump to 1 second
tween.progress(0.5) // jump to 50%
tween.timeScale(2) // double speed
tween.kill() // destroy
```

## Best Practices

1. **Use transforms instead of position properties**

   ```javascript
   // Good
   gsap.to('.box', { x: 100, y: 50 })

   // Avoid
   gsap.to('.box', { left: '100px', top: '50px' })
   ```

2. **Use gsap.set() for immediate changes**

   ```javascript
   gsap.set('.box', { opacity: 0 })
   ```

3. **Use timeline defaults**

   ```javascript
   const tl = gsap.timeline({
     defaults: { duration: 1, ease: 'power2.out' },
   })
   ```

4. **Kill animations/ScrollTriggers on cleanup**

   ```javascript
   useEffect(() => {
     const tl = gsap.timeline()
     // animations...

     return () => {
       tl.kill()
       ScrollTrigger.getAll().forEach((st) => st.kill())
     }
   }, [])
   ```

5. **Use function-based values for responsive animations**
   ```javascript
   gsap.to('.box', {
     x: () => window.innerWidth * 0.5,
     duration: 2,
   })
   ```
