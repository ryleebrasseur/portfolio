Engineering Memo: A Production-Grade, Physics-Based Motion System for Interactive Storytelling




1. Introduction & Summary




1.1. Executive Overview


This document presents a comprehensive technical blueprint for a production-grade, physics-based, scroll-triggered motion system designed for implementation in TypeScript and React. The architecture is engineered to deliver the "sentient-feeling," fluid aesthetic characteristic of premier interactive web experiences, such as those pioneered by Robin Noguier.1 The primary objective is to create a reusable and modular framework that orchestrates a seamless transformation of hero section elements into a fixed navigation header, driven by user scroll.
In alignment with the forward-looking nature of the project brief, this memo addresses standards and technologies projected for relevance in 2026 and beyond, including the strategic integration of the View Transitions API and WebGPU for progressive enhancement [#MotionArchitecture2026, #GenerativeMotionUX]. The core recommendation advocates for a hybrid animation strategy: leveraging the GreenSock Animation Platform (GSAP) for its robust timeline control in complex, orchestrated sequences like the hero-to-nav transition, complemented by Framer Motion for localized, physics-based component interactions. This dual approach is managed within a resilient, context-based React architecture, ensuring both high-fidelity motion and maintainable, scalable code.


1.2. Summary of Key Recommendations


A detailed analysis of available technologies and architectural patterns has led to the following high-level recommendations:
* Core Animation Engine: The primary hero-to-nav transformation should be orchestrated using GSAP, leveraging the ScrollTrigger and Flip plugins. This choice is predicated on GSAP's unparalleled performance and precision in managing complex, multi-element, sequenced animations that transcend component boundaries.3 The existing implementation in the reference repository (
InteractiveMenu.tsx) provides a strong proof-of-concept for GSAP's capabilities in this domain.6
* Scroll & Physics Orchestration: A dual-library approach is recommended. Lenis, as implemented in the project's useCustomScroll hook 6, will provide a smooth, normalized scrolling foundation. This will be paired with
GSAP ScrollTrigger for its robust event handling, timeline synchronization, and advanced features like pinning and scrubbing, which are essential for the required effects.7
* System Architecture: A modular, context-based React architecture is proposed to manage global motion state. A top-level MotionProvider will expose scroll progress and narrative state to all components, enabling decoupled yet coordinated animations across the application, a pattern essential for the hero-to-nav effect.6
* Narrative State Management: A custom useScrollStateMachine hook will be implemented to translate continuous scroll progress into discrete narrative "chapters." This provides a structured, scalable pattern for triggering specific animations and content changes at predefined points in the scroll journey.
* Future-Facing API Integration: A progressive enhancement strategy is advised. The View Transitions API should be used for discrete state changes (e.g., modal dialogs), while WebGPU can power generative background effects. Both will include graceful fallbacks for unsupported browsers, ensuring broad compatibility while embracing modern standards.8
* Testing & Tooling: A comprehensive testing strategy is outlined, combining Playwright for both functional E2E tests and visual regression testing with Ladle as a high-performance component development environment. This combination is particularly well-suited for a Vite-based Turborepo monorepo, ensuring both code quality and an optimal developer experience.6


2. Hero-to-Nav Motion System Architecture (React + TS)




2.1. Framework Evaluation: Choosing the Right Tools for the Job


The central challenge of the Robin Noguier-style aesthetic lies in its complex, multi-element choreography. Animations are not confined to individual components but flow across the entire viewport, requiring a tool that can imperatively manage the state of disparate DOM elements within a single, synchronized timeline.
GSAP (GreenSock Animation Platform) emerges as the definitive choice for the primary hero-to-nav orchestration. Its core strength is its powerful, battle-tested timeline system, which allows for precise sequencing, overlapping, and staggering of animations across any number of elements.12 The
ScrollTrigger plugin provides best-in-class tools for linking these timelines to scroll progress, including robust pinning and smooth scrubbing capabilities that are fundamental to the desired effect.7 Furthermore, the
Flip plugin solves the complex geometric problem of animating elements between different layout states, which is the very essence of the hero-to-nav morph.5 While GSAP's syntax is imperative and requires direct DOM manipulation (typically via refs in React), this is a necessary feature, not a bug, for achieving this level of cross-component orchestration. The performance of GSAP is legendary, as it is highly optimized to minimize layout thrashing and leverage hardware acceleration.4
Framer Motion (now Motion) is an outstanding library for animations that are self-contained within the React component model.13 Its declarative API (
<motion.div>), seamless integration with React state, and excellent support for gestures and physics-based animations make it the ideal choice for localized interactions.4 Its
layoutId prop enables powerful shared-element transitions, but it is best suited for scenarios where a component's identity and DOM position are preserved between states. The hero-to-nav transformation involves a more radical restructuring—morphing a grid of elements into a linear navigation bar—a task for which GSAP's Flip plugin is architecturally better suited. Therefore, Framer Motion is recommended for enhancing UI components with physics-based hover effects, modal entry/exit animations, and other localized, state-driven animations.
React Spring is another strong contender for physics-based animations, offering a high degree of control over the physical properties of motion.15 However, its API can be more complex and less intuitive than Framer Motion's, particularly for developers not already deeply familiar with spring physics concepts. For the goals of this project, Framer Motion provides a more direct and developer-friendly path to achieving similar high-quality, physics-based effects.4
Motion One is a lightweight, modern library built directly on the native Web Animations API (WAAPI).16 Its primary advantages are its small bundle size and excellent performance for simpler animations. However, it lacks the high-level abstractions, advanced timeline features, and robust plugin ecosystem of GSAP, making it less suitable for the complex, multi-stage choreography required for the hero-to-nav transition.17


Table: Motion Framework Tradeoff Analysis


Feature
	GSAP
	Framer Motion
	React Spring
	Motion One
	Performance (Raw)
	Excellent
	Excellent
	Excellent
	Excellent
	Timeline/Sequencing
	Excellent, imperative control
	Good, declarative sequences
	Fair, requires chaining
	Limited
	React Idiomaticity
	Good (via hooks/refs)
	Excellent (declarative)
	Excellent (hook-based)
	Good (hook-based)
	Scroll-Driven Animation
	Excellent (ScrollTrigger)
	Good (useScroll)
	Fair (requires more setup)
	Fair (via WAAPI)
	Physics/Springs
	Good (via ease config)
	Excellent
	Excellent
	Limited
	Bundle Size
	Medium (~69kB minified) 3
	Medium (~119kB minified) 3
	Small
	Very Small (~4kB) 17
	Ease of Use
	Moderate learning curve
	Easy for React developers
	Moderate learning curve
	Easy
	Community & Docs
	Excellent, mature
	Excellent, active
	Good
	Growing
	

2.2. Proposed Component Architecture: The MotionContext Pattern


To orchestrate animations across disparate parts of the React component tree (e.g., from a <Hero> component to a <Nav> component), a centralized context for motion state is essential. This pattern decouples the animation logic from the presentational components, promoting reusability and maintainability.
   1. MotionProvider: A top-level context provider that wraps the main application layout. This provider will be responsible for:
   * Initializing the useCustomScroll hook (built on Lenis 6) to create a smooth, normalized scroll value.
   * Initializing the useScrollStateMachine hook (detailed in Section 4) to determine the current narrative chapter.
   * Providing a shared context value containing { scrollProgress, velocity, currentChapter, chapterProgress, registerElement }.
   2. Element Registry: The registerElement function, provided by the context, allows components to register themselves and their DOM nodes with a central registry. Each component will provide a unique ID (e.g., 'name-logo', 'email-link') and its ref. This allows the Orchestrator to access any animatable element in the application, regardless of where it lives in the component tree.
   3. HeroContainer and StickyNav: These presentational components will render the elements in their initial (hero) and final (nav) states. Using useLayoutEffect, they will call the registerElement function from the context to make their child elements available for animation.
   4. HeroToNavOrchestrator: This is a key architectural component. It is a non-rendering component that consumes the MotionContext and contains the master GSAP ScrollTrigger timeline. It reads the element registry to get direct DOM references and orchestrates the entire hero-to-nav animation. By isolating the complex GSAP timeline logic here, the HeroContainer and StickyNav components remain simple and focused on rendering.


2.3. The "FLIP" Technique for Seamless Morphing


The "First, Last, Invert, Play" (FLIP) animation technique is the most robust and modern solution for handling complex layout transitions like the hero-to-nav morph. GSAP's Flip plugin is the industry-standard implementation of this technique.5
The current implementation in the project's InteractiveMenu.tsx 6 manually calculates the
deltaX and deltaY for each element's transition. While effective, this approach is brittle; any change to the initial or final layout requires recalculating these values. The Flip plugin automates this process entirely, making the system more resilient to design changes.
The process works as follows:
   1. First: Before any change, capture the state (size, position, rotation) of the hero elements using Flip.getState(elements).
   2. Last: Allow React to re-render the UI, moving the elements to their final position in the navigation bar. This could be triggered by a state change like setNavIsActive(true).
   3. Invert & Play: Call Flip.from(state, {...animationOptions }). The plugin will calculate the necessary transforms to make the elements appear to be in their original (First) position, and then seamlessly animate them to their new (Last) position.
This approach is not only simpler to implement but also more performant, as it relies on efficient transform animations.


TypeScript




// In HeroToNavOrchestrator.tsx

const { elements } = useMotionContext(); // Assuming context provides a map of registered elements
const [isNavActive, setIsNavActive] = useState(false);

// Trigger isNavActive based on scroll position via a ScrollTrigger
//...

useLayoutEffect(() => {
 if (!elements.name ||!elements.navNameTarget) return;

 const heroName = elements.name.current;
 const navName = elements.navNameTarget.current;
 
 // 1. Get the state of the element in the hero
 const state = Flip.getState(heroName);
 
 // 2. Move the element to its final container (or change its class/styling)
 // In React, this is done declaratively. We'll assume the nav version of the element
 // is now rendered based on `isNavActive`.
 navName.classList.add('visible');
 heroName.classList.add('hidden');

 // 3. Animate from the previous state to the new one
 Flip.from(state, {
   target: navName,
   duration: 0.8,
   ease: 'power2.inOut',
   // We can even morph the shape if using SVGs with `morphSVG`
 });

}, [isNavActive, elements]);

This pattern creates a highly maintainable and powerful system for the core visual transformation, forming the backbone of the entire motion architecture.


3. Kinetic Typography & Morphing Text Systems




3.1. Animating Variable Fonts in TypeScript


Variable fonts offer a powerful axis for expressive animation, allowing for smooth transitions between weights, slants, and other custom axes.18 The most performant and flexible method for animating these properties is to control them via CSS Custom Properties and animate those properties directly with JavaScript. This avoids manipulating the
font-variation-settings string directly on every frame, which can be less efficient.
The reference project already demonstrates the principle of controlling themes and fonts via root-level CSS variables.6 We can extend this pattern to create a reusable hook for animating the axes of a specific element in response to user interaction or scroll.


TypeScript




import { RefObject, useEffect } from 'react';
import { gsap } from 'gsap';

/**
* A hook to animate the 'wght' axis of a variable font on a target element.
* @param ref - React ref to the DOM element.
* @param scrollProgress - A normalized value (0-1) to drive the animation.
* @param weightRange - The min and max weight values, e.g., .
*/
export function useVariableFontWeight(
 ref: RefObject<HTMLElement>,
 scrollProgress: number,
 weightRange: [number, number] = 
) {
 useEffect(() => {
   if (!ref.current) return;
   
   // Use GSAP to animate the CSS Custom Property '--font-weight'
   // This assumes the element's CSS uses var(--font-weight) in its font-variation-settings
   gsap.to(ref.current, {
     '--font-weight': gsap.utils.mapRange(0, 1, weightRange, weightRange, scrollProgress),
     ease: 'none',
     overwrite: 'auto'
   });
   
 },);
}

This hook can then be applied to any text element to link its font weight directly to the scroll progress, creating dynamic, kinetic typography effects.


3.2. Morphing Text: Comparing Techniques


The "email evolution" narrative requires a more sophisticated text transformation than simple fades or flips. It necessitates morphing one string of characters into another.
Technique 1: Character-Level Flip (The Baseline)
The KineticPhone.tsx component 6 provides a solid baseline. It splits the text into characters and performs a 3D flip on each character that changes between states. This is visually interesting and performant. However, it's a character-for-character replacement, not a true morph, and requires the source and target strings to have the same length.
Technique 2: Generative Path Animation (Recommended)
For a more organic and "sentient" effect, we can use GSAP's SplitText plugin to break both the start and end text into individual characters. Then, using the Flip plugin, we can seamlessly animate each character from its initial position to its final position. For characters that don't exist in the final string, we can animate their opacity to 0 and scale to 0. For new characters, we can animate them in. This creates a fluid, particle-like effect where the text appears to dissolve and reform. This approach is highly flexible and doesn't require strings to be the same length.
Technique 3: WebGL Shader Morphing
This is the most advanced and visually potent technique. It involves rendering the start text and end text to two separate textures (or Signed Distance Fields for crispness) and then using a custom GLSL shader to interpolate between them.19 This allows for true pixel-level morphing, creating stunning liquid or distortion effects. While incredibly powerful, the implementation complexity is high, involving Framebuffer Objects (FBOs) and shader programming. This technique is best reserved for high-impact hero headlines rather than secondary elements like the email address, where the complexity may not justify the return.
Technique 4: CSS Houdini
CSS Houdini's Properties and Values API and Paint API theoretically offer a path to creating such effects with native CSS performance.21 However, as of late 2024, browser support remains incomplete, particularly in Safari and Firefox.22 For a system targeting a 2026 production date where broad compatibility is still paramount, relying on Houdini for a core feature is too risky. It remains a technology to monitor for future exploration.
For the email evolution narrative, Technique 2 (Generative Path Animation with GSAP SplitText and Flip) is the recommended approach. It offers the best balance of visual sophistication, implementation feasibility, and performance.


4. Scroll State Machine & Narrative Orchestration




4.1. The Need for a State Machine


As an interactive narrative unfolds down the page, simply tracking a global scroll percentage (0 to 1) becomes insufficient. A rich story has distinct chapters or phases (e.g., "Hero Intro," "Email Morph 1," "Email Morph 2," "Final CTA"). A Finite State Machine (FSM) is the ideal architectural pattern to manage these discrete states. It provides a structured and predictable way to control which narrative "chapter" is currently active, preventing the chaotic proliferation of independent, overlapping ScrollTrigger instances seen in simpler implementations.6 A centralized state machine makes the application's narrative logic explicit, debuggable, and scalable.


4.2. Designing the useScrollStateMachine Hook


To implement this pattern within our React architecture, we will create a custom hook, useScrollStateMachine. This hook will be the single source of truth for the narrative's current state.
   * Inputs: The hook will accept a configuration array defining the chapters of the narrative. Each chapter object will contain a unique id, a start percentage, and an end percentage of the total scrollable height.
   * Core Logic: It will use a single, master ScrollTrigger instance that monitors the global scroll progress. The onUpdate callback of this trigger will be the engine of the state machine. On each scroll update, it will iterate through the chapters array to determine which one is currently active based on the scroll progress.
   * State Exposure: The hook will return an object containing the currentChapter ID and the chapterProgress (a normalized 0-to-1 value representing the progress within the current chapter). This granular progress value is crucial, as it allows child components to create animations that are perfectly synchronized to the duration of a specific narrative beat, not just the entire page scroll. This state will be passed down through the MotionContext.


TypeScript




// Example chapter configuration
const chapters =;

interface ChapterState {
 currentChapter: string;
 chapterProgress: number;
}

function useScrollStateMachine(scrollProgress: number, chapterDefs: typeof chapters): ChapterState {
 const = useState<ChapterState>({
   currentChapter: 'hero',
   chapterProgress: 0,
 });

 useEffect(() => {
   // Find the active chapter
   const activeChapter = chapterDefs.find(
     (chapter) => scrollProgress >= chapter.start && scrollProgress < chapter.end
   ) |
| chapterDefs;

   // Calculate the progress within that chapter
   const chapterDuration = activeChapter.end - activeChapter.start;
   const progressInChapter = (scrollProgress - activeChapter.start) / chapterDuration;

   // Update state only if it has changed to prevent unnecessary re-renders
   if (
     activeChapter.id!== currentState.currentChapter ||
     Math.abs(progressInChapter - currentState.chapterProgress) > 0.001
   ) {
     setCurrentState({
       currentChapter: activeChapter.id,
       chapterProgress: Math.max(0, Math.min(1, progressInChapter)), // Clamp between 0 and 1
     });
   }
 },);

 return currentState;
}



4.3. Persistence and State Restoration


To create a truly seamless user experience, the narrative's scroll position must be preserved across page reloads. A user refreshing the page halfway through the scroll animation should return to that same point.
   * sessionStorage for Persistence: The sessionStorage API is the appropriate tool for this task. It persists data for the duration of the page session. useRef is not suitable as it does not survive page reloads.
   * Implementation Strategy:
   1. Save on Exit: Attach an event listener to the beforeunload event. In this listener, capture the current scroll position (window.scrollY) and save it to sessionStorage.
   2. Restore on Load: In a useLayoutEffect hook within the main App component, check if a scroll position exists in sessionStorage. If it does, use window.scrollTo(0, savedPosition) to immediately jump to that position before any animations are initialized.
   3. Clear on Completion: Once the position is restored, remove the value from sessionStorage to ensure subsequent visits start from the top.
This ensures that the user's context within the scroll-driven story is not lost, contributing to the "sentient" and thoughtful feel of the interface.


5. WebGPU/View Transition Integration Feasibility




5.1. WebGPU for Generative Backgrounds


The prompt's call for "generative particle fields" and "shader motion blur" points toward computationally intensive graphics that can benefit from a modern graphics API. WebGPU is the successor to WebGL, offering improved performance, more predictable behavior, and access to modern GPU features.23
   * Feasibility & Strategy (2026): By 2026, WebGPU support will be mature in major browsers, but it will not be ubiquitous. Therefore, a progressive enhancement strategy is non-negotiable. The system must be architected to detect API support and render accordingly.
   * Implementation with react-three-fiber: The react-three-fiber library is the ideal abstraction layer for this. It already has experimental support for a WebGPU renderer.24 The implementation would involve:
   1. Feature Detection: On application load, check for the existence of navigator.gpu.
   2. Conditional Rendering:
   * If WebGPU is supported, render a react-three-fiber <Canvas> component configured to use the WebGPU renderer. This canvas can contain a complex, high-particle-count simulation (e.g., 500,000+ particles) managed via GPGPU techniques for maximum performance.23
   * If WebGPU is not supported, fall back to a standard WebGL renderer. The particle effect can be a less intensive version, or a different visual entirely, such as the GLSL shader gradients already present in the reference repository's ImagePlane.tsx.6
   * If even WebGL fails, a final fallback to a simple CSS animated gradient should be in place.
This layered approach ensures a beautiful, performant experience for users on modern hardware while maintaining universal accessibility.


5.2. View Transitions API for Shared-Element Continuity


The View Transitions API is a powerful new browser primitive for animating DOM changes, particularly between page navigations.26 It excels at creating seamless "shared element" transitions, where an element appears to morph from one view to the next.
   * Critical Limitation for Scroll-Driven Animation: The core mechanism of the View Transitions API involves the browser taking a "before" snapshot and an "after" snapshot of the DOM, and then animating between them. This is triggered by a discrete event, such as a navigation or a state update wrapped in document.startViewTransition().27 The API is
not designed to have its transition progress linked to a continuous input like a scrollbar. There is no native mechanism to "scrub" a View Transition timeline. Attempts to trigger a new View Transition on every scroll frame would be disastrous for performance and defeat the purpose of the API.
   * Correct Application in this Architecture: While unsuitable for the primary scroll-driven hero morph, the View Transitions API is the perfect tool for other state changes within the application. It should be used to enhance:
      * Modal Dialogs: When the project detail modal is opened, the project's thumbnail image can seamlessly morph into the modal's header image.
      * Route Changes: If the portfolio were to have separate pages for projects, the API could create fluid transitions between the list view and the detail view.
      * Filtering/Sorting: Animating the reordering of a project grid when a filter is applied.
      * Recommendation: Implement the View Transitions API for discrete state changes to provide modern, performant, and accessible transitions. Rely on GSAP and ScrollTrigger for the continuous, scrubbable hero-to-nav animation. This hybrid approach uses the best tool for each specific job, resulting in a superior overall experience. The React 19 ecosystem is building abstractions like <ViewTransition> to make this even easier.28


6. Performance, Testing, and Modular Deployment




6.1. Performance Auditing & Benchmarking


Ensuring a consistent 60fps is non-negotiable for an experience of this caliber. A rigorous performance auditing process is required.
      * Methodology: Using the Performance tab in Chrome DevTools, record a full scroll from the top to the bottom of the page.
      * Key Metrics & Thresholds:
      * Frames Per Second (FPS): The FPS meter should remain green. Any red bars or prolonged periods below 60fps indicate a jank problem that must be addressed.
      * GPU Process: This track should show consistent activity, indicating that animations are being hardware-accelerated. Spikes or long tasks can be a bottleneck.
      * Main Thread: The goal is to keep the main thread as free as possible during the scroll animation. Look for long tasks (yellow-flagged) in the "Main" track. The animation logic should not be causing significant "Layout" (purple) or "Paint" (green) events, as this indicates layout thrashing. The animation should primarily live in the "Compositor" thread, which is handled automatically by GSAP when animating transform and opacity.
      * Self-Verification: The final implementation must be profiled on a range of devices, including mid-tier mobile phones (e.g., iPhone from 2021) and standard laptops, to validate that the 60fps target is met across the board.


6.2. A Production-Grade Testing Strategy


Testing complex, animation-heavy UIs requires a multi-layered strategy that goes beyond simple unit tests. The reference repository's existing suite 6 provides a solid foundation for functional testing, which we will augment with a robust visual regression pipeline.
      1. Unit & Integration Testing (Vitest): The existing Vitest setup 6 is well-suited for testing the logic of custom hooks like
useCustomScroll and useScrollStateMachine. Mocks for window.scrollY and IntersectionObserver can be used to test the state machine's output under various conditions.
      2. Functional End-to-End Testing (Playwright): The primary goal here is to validate user flows and interactivity, independent of the visual animation. These tests should run quickly and reliably in CI. To achieve this, animations should be disabled using Playwright's built-in options or by setting a global CSS variable that turns off all transitions.29 This ensures that tests for functionality (e.g., "clicking the email link opens a mail client") are not flaky due to animation timings.
      3. Visual Regression Testing (Playwright + Ladle): This is the cornerstone of testing the motion system itself.
         * Component Isolation with Ladle: Instead of running visual tests against the full, complex application, we will use a component development environment. Ladle is recommended over Storybook for its superior performance in Vite-based monorepos, offering near-instant start-up and HMR, which is critical for developer experience.10 We will create stories for key components (
HeroContainer, StickyNav) and for specific animation states (e.g., a story that renders the hero-to-nav transition paused at 50% progress).
         * Snapshotting with Playwright: A separate Playwright test suite will be created to navigate to these Ladle stories and take screenshots using await expect(page).toHaveScreenshot('story-name.png').
         * Handling Animations: For capturing states of a running animation, Playwright's animations: 'disabled' option is invaluable.29 Alternatively, for timeline-based animations, we can pause the GSAP timeline at a specific label before taking the snapshot, ensuring a deterministic and repeatable visual state.
         * CI/CD Integration: The existing GitHub Actions workflow 6 will be extended with a new
visual-regression job. This job will run on a specific Docker container with fixed OS and font rendering to ensure consistency.31 It will use GitHub Actions artifacts to store and retrieve baseline snapshots for comparison on each run.32


6.3. Modularity and Reuse


The entire motion system should be architected as a self-contained, reusable package within the monorepo. This aligns with the production-grade standards of the reference project.6
            * Package Creation: A new package, @ryleebrasseur/motion-system, will be created within the packages/ directory.
            * Exports: This package will export the core building blocks: MotionProvider, useMotionContext, useScrollStateMachine, and any reusable animated components like KineticText or VariableFontHeading.
            * Turborepo Configuration: The root turbo.json 6 will be configured to understand the dependency graph. The
build pipeline will ensure that motion-system is built before any application in the apps/ directory that lists it as a dependency.11 This guarantees that changes in the motion system are correctly propagated to consuming applications.
            * Local Development: The pnpm workspace setup allows for seamless local development. Changes made within the packages/motion-system directory will be instantly available in the apps/robin-noguier application, powered by Vite's fast HMR.


7. Recommendations Summary




Area
	Recommendation
	Justification & Key Technologies
	Core Animation
	Hybrid Engine Approach
	Use GSAP for complex, orchestrated timelines (hero-to-nav). Use Framer Motion for localized, physics-based UI interactions.
	Scroll Orchestration
	Smooth & Robust
	Combine Lenis for smooth scroll normalization with GSAP ScrollTrigger for powerful, reliable event handling and pinning.
	System Architecture
	Decoupled & Scalable
	Implement a React Context (MotionProvider) to manage global motion state and provide an element registry for cross-component animation.
	Narrative Control
	Structured & Explicit
	Use a Finite State Machine (useScrollStateMachine hook) to translate scroll progress into discrete narrative chapters.
	Text Animation
	Kinetic & Modern
	Animate Variable Fonts via CSS Custom Properties with GSAP. Use GSAP SplitText + Flip for generative text morphing effects.
	Future APIs
	Progressive Enhancement
	Use WebGPU for generative particle effects with a WebGL fallback. Use the View Transitions API for discrete state changes (modals, routes), not for scroll-scrubbing.
	Testing
	Comprehensive & Reliable
	Vitest for unit tests. Playwright for functional E2E (animations disabled) and visual regression (using Ladle for component isolation).
	Deployment
	Modular & Reusable
	Package the entire system into a dedicated module within the Turborepo monorepo for use across multiple applications.
	

8. Code Appendix


This section provides complete, production-ready code for the core architectural components discussed.


MotionProvider.tsx




TypeScript




import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, RefObject, useCallback } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// 1. Define types for our context
interface MotionState {
 scrollProgress: number;
 velocity: number;
 currentChapter: string;
 chapterProgress: number;
}

interface MotionContextType extends MotionState {
 registerElement: (id: string, ref: RefObject<HTMLElement>) => void;
 getElement: (id: string) => RefObject<HTMLElement> | undefined;
}

const MotionContext = createContext<MotionContextType | undefined>(undefined);

// 2. Define chapter configuration
const chapters = [
 { id: 'hero', start: 0, end: 0.25 },
 { id: 'morph', start: 0.25, end: 0.5 },
 { id: 'sticky', start: 0.5, end: 0.75 },
 { id: 'footer', start: 0.75, end: 1.0 },
];

// 3. Create the Provider component
export const MotionProvider = ({ children }: { children: ReactNode }) => {
 const = useState<MotionState>({
   scrollProgress: 0,
   velocity: 0,
   currentChapter: 'hero',
   chapterProgress: 0,
 });

 const elementRegistry = useRef<Map<string, RefObject<HTMLElement>>>(new Map());

 const registerElement = useCallback((id: string, ref: RefObject<HTMLElement>) => {
   elementRegistry.current.set(id, ref);
 },);

 const getElement = useCallback((id: string) => {
   return elementRegistry.current.get(id);
 },);

 useEffect(() => {
   const lenis = new Lenis({
     duration: 1.2,
     easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
   });

   lenis.on('scroll', (e: { scroll: number; progress: number; velocity: number }) => {
     const scrollProgress = e.progress;
     const velocity = e.velocity;

     const activeChapter = chapters.find(
       (chapter) => scrollProgress >= chapter.start && scrollProgress < chapter.end
     ) |
| chapters[chapters.length - 1];

     const chapterDuration = activeChapter.end - activeChapter.start;
     const progressInChapter = chapterDuration > 0? (scrollProgress - activeChapter.start) / chapterDuration : 0;

     setMotionState({
       scrollProgress,
       velocity,
       currentChapter: activeChapter.id,
       chapterProgress: Math.max(0, Math.min(1, progressInChapter)),
     });
   });

   function raf(time: number) {
     lenis.raf(time);
     requestAnimationFrame(raf);
   }

   requestAnimationFrame(raf);

   // Integrate Lenis with GSAP ScrollTrigger
   ScrollTrigger.scrollerProxy(document.body, {
     scrollTop(value) {
       if (arguments.length) {
         lenis.scrollTo(value, { immediate: true });
       }
       return lenis.scroll;
     },
     getBoundingClientRect() {
       return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
     },
   });

   ScrollTrigger.addEventListener('refresh', () => lenis.resize());
   ScrollTrigger.refresh();

   return () => {
     lenis.destroy();
     ScrollTrigger.removeEventListener('refresh', () => lenis.resize());
   };
 },);

 const contextValue = {...motionState, registerElement, getElement };

 return (
   <MotionContext.Provider value={contextValue}>
     {children}
   </MotionContext.Provider>
 );
};

// 4. Create a custom hook for easy consumption
export const useMotion = () => {
 const context = useContext(MotionContext);
 if (context === undefined) {
   throw new Error('useMotion must be used within a MotionProvider');
 }
 return context;
};



HeroToNavOrchestrator.tsx




TypeScript




import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { useMotion } from './MotionProvider';

gsap.registerPlugin(Flip);

// This is a non-rendering component that houses the master animation logic.
export const HeroToNavOrchestrator = () => {
 const { getElement, scrollProgress } = useMotion();
 const animationRef = useRef<gsap.core.Timeline | null>(null);

 useEffect(() => {
   // Wait for elements to be registered
   const heroName = getElement('hero-name')?.current;
   const navName = getElement('nav-name')?.current;

   if (heroName && navName &&!animationRef.current) {
     // Set initial states
     gsap.set(navName, { opacity: 0 });

     const timeline = gsap.timeline({
       scrollTrigger: {
         trigger: document.body,
         start: 'top top',
         end: '25% top', // Animate over the first 25% of the page
         scrub: 1,
       },
       onComplete: () => {
         // Ensure final state is clean
         gsap.set(heroName, { opacity: 0 });
         gsap.set(navName, { opacity: 1 });
       },
       onReverseComplete: () => {
         // Ensure initial state is clean
         gsap.set(heroName, { opacity: 1 });
         gsap.set(navName, { opacity: 0 });
       }
     });

     animationRef.current = timeline;

     // The FLIP animation
     timeline.add(() => {
       const state = Flip.getState(heroName);
       
       // Temporarily hide the hero element and show the nav element
       // to allow Flip to calculate the final position.
       heroName.style.opacity = '0';
       navName.style.opacity = '1';

       Flip.from(state, {
         target: navName,
         duration: 1, // Duration is controlled by scrub, but good to set
         ease: 'power2.inOut',
         // Animate other properties like font size, color, etc.
         props: 'color,fontSize', 
       });

       // Revert the temporary style changes so ScrollTrigger can control opacity
       heroName.style.opacity = '1';
       navName.style.opacity = '0';

     }, 0);

     // Fade out the hero element and fade in the nav element over the timeline
     timeline.to(heroName, { opacity: 0, duration: 1, ease: 'none' }, 0);
     timeline.to(navName, { opacity: 1, duration: 1, ease: 'none' }, 0);
   }

   return () => {
     animationRef.current?.kill();
     animationRef.current = null;
   };
 }, [getElement]);

 return null; // This component does not render anything
};



9. Caveats & Future Explorations




9.1. Edge Cases, Fallbacks, and Resilience


A production-grade system must be resilient. The following considerations are critical:
               * prefers-reduced-motion: All animations must be conditional. A simple and effective approach is to use a master gsap.matchMedia() instance. Inside, a media query for (prefers-reduced-motion: no-preference) will contain all animation initializations. The (prefers-reduced-motion: reduce) query will contain fallback logic, which could be simple cross-fades or no animation at all. This ensures the experience is accessible and respects user preferences.
               * API Support Fallbacks: As detailed in Section 5, the use of WebGPU and the View Transitions API must be gated by feature detection ('gpu' in navigator). The system must gracefully degrade to WebGL and then to simple CSS for visual effects, and to standard React state updates for transitions if the newer APIs are unavailable.
               * State Breakage & Debouncing: While Lenis and GSAP's ScrollTrigger are highly optimized, extremely rapid scrolling on low-powered devices can still cause performance issues. The useScrollStateMachine should be designed to be resilient, and if performance issues are noted during testing, debouncing the state updates within the hook could be a necessary optimization. GSAP's ScrollTrigger.normalizeScroll(true) can also help mitigate issues with fast touch-based scrolling on mobile devices.


9.2. Future Explorations: Towards Sentient & Generative Motion


The prompt's vision extends beyond pre-choreographed timelines to interfaces that feel "sentient." This points toward a future of generative and emergent motion design.
               * Emergent Behavior: The next evolution of this system could involve moving beyond a single, master GSAP timeline. Instead, individual animated elements could be given a set of simple, physics-based rules and goals. For example, each character in a text morph could be a particle with a starting point, an end point, and a physics simulation (e.g., flocking behavior, collision detection) that governs its path.33 The "animation" would be the emergent result of these simple systems interacting, creating a unique, non-deterministic, and organic transition every time. This moves from choreography to simulation, creating a truly "alive" feeling. Framer Motion's physics or a dedicated library like
react-three-rapier could power these simulations.
               * Generative UI & Motion: Looking further ahead, the principles of generative design can be applied to motion itself.35 The system could be architected to:
                  * Generate Motion Paths: Instead of manually defining a path for an element, an algorithm could generate a path based on constraints (e.g., "move from A to B without colliding with element C").
                  * Adapt Animation to Content: The system could analyze the content (e.g., the sentiment of text, the dominant colors of an image) and algorithmically adjust animation parameters (easing, duration, physics) to match the mood. An exciting project title might trigger a fast, energetic animation, while a more somber one could elicit a slower, more graceful transition.
                  * AI-Assisted Choreography: Future versions could integrate with LLMs to interpret natural language prompts like "make the header transition feel more liquid" and translate them into GSAP or shader parameters.
By building the proposed architecture on a foundation of modular components and a centralized state machine, we create a system that is not only robust for today's needs but also extensible enough to incorporate these future-facing concepts of emergent and generative motion design.
Works cited
                  1. Robin Noguier's Portfolio - Product Design Portfolios, accessed June 23, 2025, https://www.productdesignportfolios.com/portfolio/robin-noguier
                  2. Robin Noguier - Interactive Designer, accessed June 23, 2025, https://robin-noguier.com/
                  3. Web Animation for Your React App: Framer Motion vs GSAP - Semaphore, accessed June 23, 2025, https://semaphoreci.com/blog/react-framer-motion-gsap
                  4. Top 3 React Animation Libraries - Creole Studios, accessed June 23, 2025, https://www.creolestudios.com/top-react-animation-libraries/
                  5. Flip | GSAP | Docs & Learning, accessed June 23, 2025, https://gsap.com/docs/v3/Plugins/Flip/
                  6. ryleebrasseur/portfolio
                  7. ScrollTrigger | GSAP | Docs & Learning, accessed June 23, 2025, https://gsap.com/docs/v3/Plugins/ScrollTrigger/
                  8. Three.js Project: Geometric Shapes with TSL - YouTube, accessed June 23, 2025, https://www.youtube.com/watch?v=9GTvWZMIeCc
                  9. Exploring React's Experimental View Transitions API - Talent500, accessed June 23, 2025, https://talent500.com/blog/react-experimental-view-transitions-api-guide/
                  10. Introducing Ladle, accessed June 23, 2025, https://ladle.dev/blog/introducing-ladle/
                  11. Configuring tasks | Turborepo, accessed June 23, 2025, https://turbo.build/docs/crafting-your-repository/configuring-tasks
                  12. "Unlocking the Power of GSAP for Stunning Web Animations" - DEV Community, accessed June 23, 2025, https://dev.to/anticoder03/unlocking-the-power-of-gsap-for-stunning-web-animations-1dk3
                  13. Get started with Motion for React | Motion for React (prev Framer ..., accessed June 23, 2025, https://motion.dev/docs/react-quick-start
                  14. GSAP vs. Framer Motion: Which Animation Library Should You Choose for Your Creative Web Projects? - DEV Community, accessed June 23, 2025, https://dev.to/sharoztanveer/gsap-vs-framer-motion-which-animation-library-should-you-choose-for-your-creative-web-projects-4d02
                  15. React Spring or Framer Motion: Which is Better? - Angular Minds, accessed June 23, 2025, https://www.angularminds.com/blog/react-spring-or-framer-motion
                  16. motion.dev, accessed June 23, 2025, https://motion.dev/blog/should-i-use-framer-motion-or-motion-one#:~:text=Motion%20One%20is%20a%20tiny,%2C%20batteries%2Dincluded%20animation%20library.
                  17. Should I use Framer Motion or Motion One? - Motion Blog, accessed June 23, 2025, https://motion.dev/blog/should-i-use-framer-motion-or-motion-one
                  18. Variable fonts - CSS - MDN Web Docs, accessed June 23, 2025, https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_fonts/Variable_fonts_guide
                  19. WebGL Text - Textures, accessed June 23, 2025, https://webglfundamentals.org/webgl/lessons/webgl-text-texture.html
                  20. Creating an Interactive 3D Bulge Text Effect with React Three Fiber - Codrops, accessed June 23, 2025, https://tympanus.net/codrops/2024/03/20/creating-an-interactive-3d-bulge-text-effect-with-react-three-fiber/
                  21. The State of CSS 2025 Survey is out!, accessed June 23, 2025, https://css-tricks.com/the-state-of-css-2025-survey-is-out/
                  22. State of CSS 2025 - Devographics Surveys, accessed June 23, 2025, https://survey.devographics.com/en-US/survey/state-of-css/2025
                  23. GPGPU particles with TSL & WebGPU - Wawa Sensei, accessed June 23, 2025, https://wawasensei.dev/courses/react-three-fiber/lessons/tsl-gpgpu
                  24. [ Source code ] Threejs WebGPU Post Processing with TSL in React Three Fiber - YouTube, accessed June 23, 2025, https://www.youtube.com/watch?v=1HJCvxivxKs
                  25. Particle Effect Maker in WebGPU : r/GraphicsProgramming - Reddit, accessed June 23, 2025, https://www.reddit.com/r/GraphicsProgramming/comments/1kdwazh/particle_effect_maker_in_webgpu/
                  26. View Transition API - MDN Web Docs - Mozilla, accessed June 23, 2025, https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
                  27. Smooth transitions with the View Transition API | View Transitions - Chrome for Developers, accessed June 23, 2025, https://developer.chrome.com/docs/web-platform/view-transitions
                  28. React Labs: View Transitions, Activity, and more, accessed June 23, 2025, https://react.dev/blog/2025/04/23/react-labs-view-transitions-activity-and-more
                  29. Visual regression & snapshot testing - Checkly Docs, accessed June 23, 2025, https://www.checklyhq.com/docs/browser-checks/visual-regression-snapshot-testing/
                  30. Introduction to Ladle | Reflect, accessed June 23, 2025, https://reflect.run/articles/introduction-to-ladle/
                  31. Running Visual Regression Tests with Storybook and Playwright for Free, accessed June 23, 2025, https://markus.oberlehner.net/blog/running-visual-regression-tests-with-storybook-and-playwright-for-free
                  32. Ultimate Guide to Visual Testing with Playwright - BrowserCat, accessed June 23, 2025, https://www.browsercat.com/post/ultimate-guide-visual-testing-playwright
                  33. How to design complex emergent behaviour? : r/gamedev - Reddit, accessed June 23, 2025, https://www.reddit.com/r/gamedev/comments/1fqki4j/how_to_design_complex_emergent_behaviour/
                  34. Introduction to Emergent Behaviours - Unity - YouTube, accessed June 23, 2025, https://www.youtube.com/watch?v=FjDYBZ47roQ
                  35. Interface Design Principles for Generative AI - AI Tools - God of Prompt, accessed June 23, 2025, https://www.godofprompt.ai/blog/interface-design-principles-for-generative-ai
                  36. Best Guide to Generative UI: Uphill The Product Game Today, accessed June 23, 2025, https://www.questlabs.ai/blog/generative-user-interface-guide