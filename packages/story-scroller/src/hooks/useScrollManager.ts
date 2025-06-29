
import { useRef, useCallback, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { Observer } from 'gsap/Observer';
import type { LenisInstance } from '../types/internal';
import { useScrollContext, useScrollActions } from '../context/ScrollContext';
import { IBrowserService, createBrowserService } from '../services/BrowserService';
import { createAnimationQueue } from '../utils/animation-queue';
import { forceSync, emergencyReset, verifyState } from '../utils/scroll-sync';
import { TIMING, PHYSICS } from '../constants/scroll-physics';
import type { ScrollManagerAPI, ScrollManagerConfig, AnimationControllers, NavigationOptions, ScrollState } from '../types/scroll-manager';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, Observer);

const initLenis = async () => {
  const Lenis = (await import('lenis')).default;
  const lenis = new Lenis({ 
    lerp: PHYSICS.LENIS_LERP, 
    wheelMultiplier: PHYSICS.LENIS_WHEEL_MULTIPLIER,
    gestureDirection: 'vertical',
    normalizeWheel: true,
    smoothTouch: false
  });
  
  // Add necessary classes to HTML element
  document.documentElement.classList.add('lenis');
  console.log('🔧 [initLenis] Added lenis class to html element');
  
  return lenis;
};

export function useScrollManager(config: ScrollManagerConfig): ScrollManagerAPI {
  const { sections, onSectionChange, keyboardNavigation = true, duration = PHYSICS.BASE_ANIMATION_DURATION, easing = (t: any) => 1 - Math.pow(1 - t, 3) } = config;

  const containerRef = useRef<HTMLDivElement>(null);
  const { state } = useScrollContext();
  const actions = useScrollActions();
  const dispatch = useScrollContext().dispatch;

  const browserService = useRef(config.browserService || createBrowserService());
  const animationQueue = useRef(createAnimationQueue());
  const controllers = useRef<AnimationControllers>({ lenis: null, observer: null, scrollTween: null, rafId: null, verificationIntervalId: null, keyboardCleanup: null });
  // Create internal scroll state that matches the ScrollState interface
  const stateRef = useRef({
    currentSection: state.currentIndex || 0,
    targetSection: null,
    isAnimating: state.isAnimating || false,
    isScrolling: false,
    canNavigate: !state.isAnimating,
    scrollPosition: 0,
    velocity: 0,
    lastNavigationTime: state.lastScrollTime || 0,
  });
  
  const gotoSection = useCallback((index: number, options?: NavigationOptions) => {
    console.log('🎯 [useScrollManager.gotoSection] ENTER:', {
      requestedIndex: index,
      indexType: typeof index,
      sectionsLength: sections.length,
      currentState: {
        currentSection: stateRef.current.currentSection,
        isAnimating: stateRef.current.isAnimating
      }
    });
    
    // Use plain JavaScript instead of corrupted gsap.utils.clamp
    const newIndex = Math.max(0, Math.min(sections.length - 1, index));
    console.log('🎯 [useScrollManager.gotoSection] After clamp:', {
      newIndex,
      newIndexType: typeof newIndex,
      isValidNumber: Number.isInteger(newIndex)
    });
    
    const request = animationQueue.current.enqueue({ targetSection: newIndex, source: 'programmatic', priority: 'normal', options });

    if (!request || stateRef.current.isAnimating) {
      console.log('🚫 [useScrollManager.gotoSection] Blocked:', { request: !!request, isAnimating: stateRef.current.isAnimating });
      return;
    }

    // Set animation state immediately in both context and internal state
    actions.gotoSection(newIndex, Date.now());
    stateRef.current.isAnimating = true;
    stateRef.current.targetSection = newIndex;

    // Calculate target position directly instead of using DOM element
    const targetY = newIndex * browserService.current.getInnerHeight();
    
    console.log(`🎬 [useScrollManager] GSAP Animation Setup:`, {
      targetSection: newIndex,
      targetSectionType: typeof newIndex,
      targetY,
      targetYType: typeof targetY,
      currentScrollY: window.scrollY,
      containerHeight: browserService.current.getInnerHeight(),
      scrollToPlugin: !!gsap.plugins.scrollTo,
      calculation: `${newIndex} * ${browserService.current.getInnerHeight()} = ${targetY}`,
      lenisAvailable: !!controllers.current.lenis
    });
    
    // Kill any existing GSAP animations but keep Lenis running
    gsap.killTweensOf(window);
    
    // Use Lenis for smooth scrolling (don't stop it first!)
    if (controllers.current.lenis) {
      const lenis = controllers.current.lenis;
      console.log('🌊 [useScrollManager] Using Lenis for scroll animation', {
        isStopped: lenis.isStopped,
        currentScroll: lenis.scroll,
        targetY,
        canScroll: !lenis.isStopped && lenis.limit > 0
      });
      
      lenis.scrollTo(targetY, {
        duration: options?.duration || duration,
        immediate: false,
        lock: true,
        onComplete: () => {
          console.log('✅ [useScrollManager] Lenis animation completed');
          // Update both internal state and context
          stateRef.current.currentSection = newIndex;
          stateRef.current.isAnimating = false;
          stateRef.current.targetSection = null;
          
          // Update context state
          if (state.currentIndex !== newIndex) actions.setCurrentIndex(newIndex);
          actions.endAnimation();
          
          // Clear queue
          animationQueue.current.clear();
          
          // Call callbacks
          onSectionChange?.(newIndex);
          options?.onComplete?.();
        }
      });
    } else {
      // Fallback to GSAP if Lenis not available
      console.log('🎬 [useScrollManager] Using GSAP fallback for scroll animation');
      controllers.current.scrollTween = gsap.to(window, {
        scrollTo: { y: targetY, autoKill: false },
        duration: options?.duration || duration,
        ease: options?.easing || easing,
      onComplete: () => {
        // Update both internal state and context
        stateRef.current.currentSection = newIndex;
        stateRef.current.isAnimating = false;
        stateRef.current.targetSection = null;
        
        // Update context state
        if (state.currentIndex !== newIndex) actions.setCurrentIndex(newIndex);
        actions.endAnimation();
        
        // Clear queue
        animationQueue.current.clear();
        
        // Call callbacks
        onSectionChange?.(newIndex);
        options?.onComplete?.();
      },
      onInterrupt: () => {
        // Reset animation state on interrupt
        stateRef.current.isAnimating = false;
        stateRef.current.targetSection = null;
        actions.endAnimation();
        
        // Force sync to current position
        forceSync(Math.round(browserService.current.getScrollY() / browserService.current.getInnerHeight()), stateRef, controllers.current, browserService.current, dispatch);
        options?.onInterrupt?.();
      },
    });
    }
  }, [sections.length, duration, easing, onSectionChange, actions, dispatch]);

  // Update internal state when context state changes
  useEffect(() => {
    stateRef.current.currentSection = state.currentIndex || 0;
    stateRef.current.isAnimating = state.isAnimating || false;
    stateRef.current.canNavigate = !state.isAnimating;
    stateRef.current.lastNavigationTime = state.lastScrollTime || 0;
  }, [state.currentIndex, state.isAnimating, state.lastScrollTime]);

  const nextSection = useCallback(() => gotoSection(stateRef.current.currentSection + 1), [gotoSection]);
  const prevSection = useCallback(() => gotoSection(stateRef.current.currentSection - 1), [gotoSection]);

  const reinitialize = useCallback(async () => {
    const bs = browserService.current;
    if (!bs.isClient() || !containerRef.current) return;

    controllers.current.lenis = await initLenis();
    const lenis = controllers.current.lenis;

    const ticker = (time: number) => lenis?.raf(time);
    controllers.current.rafId = gsap.ticker.add(ticker);

    lenis.on('scroll', ScrollTrigger.update);
    
    // CRITICAL: Start Lenis!
    lenis.start();
    console.log('🚀 [useScrollManager] Lenis started and ready', {
      isStarted: !lenis.isStopped,
      currentScroll: lenis.scroll,
      actualScroll: window.scrollY,
      limit: lenis.limit,
      htmlClasses: document.documentElement.classList.toString()
    });

    controllers.current.observer = Observer.create({
        target: window,
        type: 'wheel,touch,pointer',
        onWheel: (self) => {
            // Use deltaY for reliable direction detection
            if (stateRef.current.isAnimating) return;
            if (self.deltaY > 0) { // Scrolling down
                nextSection();
            } else { // Scrolling up
                prevSection();
            }
        },
    });

    const handleKeyDown = (e: KeyboardEvent) => {
        if (stateRef.current.isAnimating) return;
        switch (e.key) {
            case 'ArrowDown': nextSection(); break;
            case 'ArrowUp': prevSection(); break;
            case 'Home': gotoSection(0); break;
            case 'End': gotoSection(sections.length - 1); break;
        }
    };

    if (keyboardNavigation) {
        bs.addEventListener('keydown', handleKeyDown);
        controllers.current.keyboardCleanup = () => bs.removeEventListener('keydown', handleKeyDown);
    }

    // TEMPORARILY DISABLED - state verification causing infinite loops
    // controllers.current.verificationIntervalId = setInterval(() => {
    //   verifyState(stateRef, controllers.current, bs, dispatch);
    // }, TIMING.STATE_VERIFICATION_INTERVAL);
  }, [gotoSection, nextSection, prevSection, keyboardNavigation, sections.length, dispatch]);

  const destroy = useCallback(() => {
    if (controllers.current.rafId) gsap.ticker.remove(controllers.current.rafId);
    controllers.current.observer?.kill();
    controllers.current.lenis?.destroy();
    if (controllers.current.verificationIntervalId) clearInterval(controllers.current.verificationIntervalId);
    if (controllers.current.keyboardCleanup) controllers.current.keyboardCleanup();
  }, []);

  useEffect(() => {
    reinitialize();
    return () => destroy();
  }, [reinitialize, destroy]);

  return {
    containerRef,
    gotoSection,
    nextSection,
    prevSection,
    forceSync: () => forceSync(Math.round(browserService.current.getScrollY() / browserService.current.getInnerHeight()), stateRef, controllers.current, browserService.current, dispatch),
    emergencyReset: () => emergencyReset(controllers.current, reinitialize, dispatch),
    destroy,
  };
}
