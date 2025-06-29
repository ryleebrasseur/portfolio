
import type { RefObject } from 'react';
import type { ScrollState, AnimationControllers } from '../types/scroll-manager';
import type { IBrowserService } from '../services/BrowserService';
import { scrollActions } from '../state/scrollReducer';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** Forces all animation systems to sync to a specific section. */
export async function forceSync(
  targetSection: number,
  stateRef: RefObject<ScrollState>,
  controllers: AnimationControllers,
  browserService: IBrowserService,
  dispatch: React.Dispatch<any>
) {
  console.warn(`🔄 FORCE SYNC triggered. Syncing to section: ${targetSection}`);

  // Use gsap from global or import
  const gsap = window.gsap || (await import('gsap')).gsap;
  const ScrollTrigger = window.ScrollTrigger || (await import('gsap/ScrollTrigger')).ScrollTrigger;
  
  gsap.killTweensOf(window);
  controllers.lenis?.stop();

  const targetY = targetSection * browserService.getInnerHeight();
  browserService.scrollTo(0, targetY);
  controllers.lenis?.scrollTo(targetY, { immediate: true });

  ScrollTrigger.refresh(true);

  dispatch(scrollActions.setCurrentIndex(targetSection));
  dispatch(scrollActions.endAnimation());
}

/** Destroys and reinitializes everything. */
export async function emergencyReset(
  controllers: AnimationControllers,
  reinitialize: () => void,
  dispatch: React.Dispatch<any>
) {
  console.error("🚨 EMERGENCY RESET triggered. Reinitializing scroll system.");

  const gsap = window.gsap || (await import('gsap')).gsap;
  const ScrollTrigger = window.ScrollTrigger || (await import('gsap/ScrollTrigger')).ScrollTrigger;

  gsap.killTweensOf('*');
  ScrollTrigger.killAll();
  controllers.observer?.kill();
  controllers.lenis?.destroy();

  if (controllers.verificationIntervalId) clearInterval(controllers.verificationIntervalId);
  if (controllers.keyboardCleanup) controllers.keyboardCleanup();

  dispatch(scrollActions.resetState());
  reinitialize();
}

/** Periodically checks for state drift. */
export function verifyState(
  stateRef: RefObject<ScrollState>,
  controllers: AnimationControllers,
  browserService: IBrowserService,
  dispatch: React.Dispatch<any>
) {
  if (!stateRef.current || stateRef.current.isAnimating) return;

  const actualY = browserService.getScrollY();
  const viewportHeight = browserService.getInnerHeight();
  const actualSection = Math.round(actualY / viewportHeight);

  if (actualSection !== stateRef.current.currentSection) {
    console.warn(`State drift detected! State: ${stateRef.current.currentSection}, Reality: ${actualSection}`);
    forceSync(actualSection, stateRef, controllers, browserService, dispatch);
  }
}
