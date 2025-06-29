/**
 * @fileoverview Scroll synchronization utilities for state recovery and drift correction.
 * Provides force sync and emergency reset capabilities.
 */

import type { RefObject } from 'react';
import type { ScrollState, AnimationControllers } from '../types/scroll-manager';
import type { IBrowserService } from '../services/BrowserService';
import { scrollActions } from '../state/scrollReducer';
import { TIMING, DEBUG_CONFIG } from '../constants/scroll-physics';

// Import GSAP and ScrollTrigger from window to match the global registration
declare global {
  interface Window {
    gsap: any;
    ScrollTrigger: any;
  }
}

/**
 * Forces all animation systems to sync to a specific section.
 * This is the primary recovery mechanism for state drift.
 */
export function forceSync(
  targetSection: number,
  stateRef: RefObject<ScrollState>,
  controllers: AnimationControllers,
  browserService: IBrowserService,
  dispatch: React.Dispatch<any>
) {
  console.warn(`🔄 FORCE SYNC triggered. Syncing to section: ${targetSection}`);

  // 1. Kill any active GSAP tweens on the window
  if (window.gsap) {
    window.gsap.killTweensOf(window);
    // Also kill the current scroll tween if it exists
    if (controllers.scrollTween) {
      controllers.scrollTween.kill();
      controllers.scrollTween = null;
    }
  }

  // 2. Stop Lenis if it's running
  if (controllers.lenis) {
    controllers.lenis.stop();
  }

  // 3. Calculate the exact target scroll position in pixels
  const viewportHeight = browserService.getInnerHeight();
  const targetY = targetSection * viewportHeight;

  // 4. Immediately set the scroll position of the window
  browserService.scrollTo(0, targetY);

  // 5. Immediately tell Lenis where it should be
  if (controllers.lenis) {
    controllers.lenis.scrollTo(targetY, { immediate: true });
  }

  // 6. Force ScrollTrigger to re-calculate its positions
  if (window.ScrollTrigger) {
    window.ScrollTrigger.refresh(true);
  }

  // 7. Update the internal state to reflect the new reality
  if (stateRef.current) {
    stateRef.current.isAnimating = false;
    stateRef.current.isScrolling = false;
    stateRef.current.currentSection = targetSection;
    stateRef.current.targetSection = null;
    stateRef.current.canNavigate = true;
    stateRef.current.scrollPosition = targetY;
    stateRef.current.velocity = 0;
  }

  // 8. Dispatch state updates through the centralized state management
  dispatch(scrollActions.setCurrentIndex(targetSection));
  dispatch(scrollActions.endAnimation());
  dispatch(scrollActions.setScrollPosition(targetY));

  console.log(`✅ Force sync complete. Current section is now ${targetSection}`);
}

/**
 * The "nuclear option". Destroys and reinitializes everything.
 * Use this only when the system is in an unrecoverable state.
 */
export function emergencyReset(
  controllers: AnimationControllers,
  reinitialize: () => void,
  dispatch: React.Dispatch<any>
) {
  console.error('🚨 EMERGENCY RESET triggered. Destroying and reinitializing scroll system.');

  try {
    // 1. Kill all GSAP animations and ScrollTriggers
    if (window.gsap) {
      window.gsap.killTweensOf('*');
      if (controllers.scrollTween) {
        controllers.scrollTween.kill();
        controllers.scrollTween = null;
      }
    }

    if (window.ScrollTrigger) {
      window.ScrollTrigger.killAll();
    }

    // 2. Destroy the Observer and Lenis instances
    if (controllers.observer) {
      controllers.observer.kill();
      controllers.observer = null;
    }

    if (controllers.lenis) {
      controllers.lenis.destroy();
      controllers.lenis = null;
    }

    // 3. Clear any pending timeouts or intervals
    if (controllers.verificationIntervalId) {
      clearInterval(controllers.verificationIntervalId);
      controllers.verificationIntervalId = null;
    }

    // 4. Clean up keyboard listeners
    if (controllers.keyboardCleanup) {
      controllers.keyboardCleanup();
      controllers.keyboardCleanup = null;
    }

    // 5. Remove GSAP ticker callback for Lenis
    if (controllers.lenisTickerCallback && window.gsap) {
      window.gsap.ticker.remove(controllers.lenisTickerCallback);
      controllers.lenisTickerCallback = undefined;
    }

    // 6. Reset window scroll position to top
    window.scrollTo(0, 0);

    // 7. Reset all state through dispatch
    dispatch(scrollActions.resetState());

    // 8. Wait a frame before reinitializing to ensure cleanup is complete
    requestAnimationFrame(() => {
      console.log('🔄 Reinitializing scroll system...');
      reinitialize();
    });

  } catch (error) {
    console.error('❌ Error during emergency reset:', error);
    // Even if there's an error, try to reinitialize
    setTimeout(reinitialize, 100);
  }
}

/**
 * Periodically called to check for drift between the component's state
 * and the actual scroll position of the page.
 */
export function verifyState(
  stateRef: RefObject<ScrollState>,
  controllers: AnimationControllers,
  browserService: IBrowserService,
  dispatch: React.Dispatch<any>
) {
  if (!stateRef.current || stateRef.current.isAnimating) {
    return; // Don't verify during an active animation
  }

  // 1. Get the actual scroll position from the browserService
  const actualY = browserService.getScrollY();
  const viewportHeight = browserService.getInnerHeight();

  // 2. Calculate which section corresponds to that scroll position
  const actualSection = Math.round(actualY / viewportHeight);

  // 3. Compare with the section in our state
  if (actualSection !== stateRef.current.currentSection) {
    console.warn(
      `⚠️ State drift detected! State: ${stateRef.current.currentSection}, Reality: ${actualSection}, ` +
      `ScrollY: ${actualY}, ViewportHeight: ${viewportHeight}`
    );

    // 4. If they don't match, trigger a force sync
    forceSync(actualSection, stateRef, controllers, browserService, dispatch);
  }

  // 5. Also check if Lenis is out of sync
  if (controllers.lenis) {
    const lenisScroll = controllers.lenis.scroll || 0;
    const scrollDiff = Math.abs(lenisScroll - actualY);
    
    if (scrollDiff > 1) { // 1px tolerance
      if (DEBUG_CONFIG.VERBOSE) {
        console.warn(`⚠️ Lenis drift detected! Lenis: ${lenisScroll}, Window: ${actualY}`);
      }
      // Sync Lenis to window position
      controllers.lenis.scrollTo(actualY, { immediate: true });
    }
  }
}

/**
 * Check if the current animation is stuck and needs intervention.
 */
export function checkStuckAnimation(
  stateRef: RefObject<ScrollState>,
  controllers: AnimationControllers,
  browserService: IBrowserService,
  dispatch: React.Dispatch<any>
): boolean {
  if (!stateRef.current || !stateRef.current.isAnimating) {
    return false;
  }

  const now = Date.now();
  const animationDuration = now - stateRef.current.lastNavigationTime;

  if (animationDuration > TIMING.STUCK_ANIMATION_THRESHOLD) {
    console.error(
      `❌ Animation stuck! Started ${animationDuration}ms ago, ` +
      `target: ${stateRef.current.targetSection}, current: ${stateRef.current.currentSection}`
    );

    // Force sync to the current actual position
    const actualY = browserService.getScrollY();
    const viewportHeight = browserService.getInnerHeight();
    const actualSection = Math.round(actualY / viewportHeight);
    
    forceSync(actualSection, stateRef, controllers, browserService, dispatch);
    return true;
  }

  return false;
}

/**
 * Get a diagnostic report of the current state of all systems.
 * Useful for debugging state drift issues.
 */
export function getDiagnosticReport(
  stateRef: RefObject<ScrollState>,
  controllers: AnimationControllers,
  browserService: IBrowserService
): Record<string, any> {
  const actualY = browserService.getScrollY();
  const viewportHeight = browserService.getInnerHeight();
  const actualSection = Math.round(actualY / viewportHeight);
  
  return {
    timestamp: new Date().toISOString(),
    state: stateRef.current ? {
      currentSection: stateRef.current.currentSection,
      targetSection: stateRef.current.targetSection,
      isAnimating: stateRef.current.isAnimating,
      isScrolling: stateRef.current.isScrolling,
      canNavigate: stateRef.current.canNavigate,
      scrollPosition: stateRef.current.scrollPosition,
      velocity: stateRef.current.velocity,
    } : null,
    reality: {
      windowScrollY: actualY,
      calculatedSection: actualSection,
      viewportHeight: viewportHeight,
      lenisScroll: controllers.lenis?.scroll || null,
    },
    controllers: {
      hasLenis: !!controllers.lenis,
      hasObserver: !!controllers.observer,
      hasScrollTween: !!controllers.scrollTween,
      hasVerificationInterval: !!controllers.verificationIntervalId,
    },
  };
}