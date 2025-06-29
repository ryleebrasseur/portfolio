/**
 * @fileoverview Animation queue implementation for managing navigation requests.
 * Provides deduplication, priority handling, and conflict prevention.
 */

import type { NavigationRequest, AnimationQueue } from '../types/scroll-manager';
import { TIMING } from '../constants/scroll-physics';

/**
 * Creates a robust animation queue to manage navigation requests,
 * prevent conflicts, and handle deduplication.
 */
export function createAnimationQueue(): AnimationQueue {
  let requests: NavigationRequest[] = [];
  let processing = false;
  let lastProcessedId: string | null = null;

  /**
   * Add a new navigation request to the queue.
   * Implements deduplication logic to prevent rapid-fire duplicates.
   */
  const enqueue = (request: Omit<NavigationRequest, 'id' | 'timestamp'>): NavigationRequest | null => {
    const fullRequest: NavigationRequest = {
      ...request,
      id: `nav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    // Deduplication: Check if a request for the same target was enqueued recently
    const isDuplicate = requests.some(
      (r) =>
        r.targetSection === fullRequest.targetSection &&
        fullRequest.timestamp - r.timestamp < TIMING.DEDUPLICATION_THRESHOLD
    );

    if (isDuplicate) {
      console.log(`❌ Queue: Duplicate request for section ${fullRequest.targetSection} ignored (within ${TIMING.DEDUPLICATION_THRESHOLD}ms window)`);
      return null;
    }

    // Check if we're already processing a request to the same section
    if (processing && requests.some(r => r.targetSection === fullRequest.targetSection)) {
      console.log(`❌ Queue: Request for section ${fullRequest.targetSection} already being processed`);
      return null;
    }

    // Add to queue based on priority
    if (fullRequest.priority === 'critical') {
      // Critical requests go to the front
      requests.unshift(fullRequest);
    } else if (fullRequest.priority === 'high') {
      // High priority requests go after critical but before normal/low
      const criticalCount = requests.filter(r => r.priority === 'critical').length;
      requests.splice(criticalCount, 0, fullRequest);
    } else {
      // Normal and low priority go to the end
      requests.push(fullRequest);
    }

    console.log(`✅ Queue: Request ${fullRequest.id} added (target: ${fullRequest.targetSection}, priority: ${fullRequest.priority})`);
    return fullRequest;
  };

  /**
   * Get the next request to process from the queue.
   * Respects priority ordering.
   */
  const dequeue = (): NavigationRequest | null => {
    if (requests.length === 0) {
      return null;
    }

    // Get the highest priority request (queue is already sorted by priority)
    const nextRequest = requests.shift()!;
    lastProcessedId = nextRequest.id;
    processing = true;

    console.log(`📤 Queue: Processing request ${nextRequest.id} (target: ${nextRequest.targetSection})`);
    return nextRequest;
  };

  /**
   * Clear all pending requests.
   * Typically called after successful navigation or emergency reset.
   */
  const clear = () => {
    const pendingCount = requests.length;
    if (pendingCount > 0) {
      console.log(`🧹 Queue: Clearing ${pendingCount} pending requests`);
      requests = [];
    }
    processing = false;
  };

  /**
   * Peek at the highest priority request without removing it.
   */
  const peek = (): NavigationRequest | null => {
    return requests.length > 0 ? requests[0] : null;
  };

  /**
   * Check if a similar request exists in the queue.
   */
  const hasSimilar = (targetSection: number, withinMs: number = TIMING.DEDUPLICATION_THRESHOLD): boolean => {
    const now = Date.now();
    return requests.some(
      r => r.targetSection === targetSection && (now - r.timestamp) < withinMs
    );
  };

  return {
    requests,
    processing,
    lastProcessedId,
    enqueue,
    dequeue,
    clear,
    peek,
    hasSimilar,
  };
}

/**
 * Calculate appropriate animation duration based on distance.
 * Longer distances get slightly longer animations for smoother feel.
 */
export function calculateAnimationDuration(
  currentSection: number,
  targetSection: number,
  baseDuration: number = TIMING.BASE_DURATION
): number {
  const distance = Math.abs(targetSection - currentSection);
  
  if (distance === 0) return 0;
  if (distance === 1) return baseDuration;
  
  // Scale duration based on distance, but cap it
  const scaledDuration = baseDuration * (1 + (distance - 1) * 0.2);
  return Math.min(scaledDuration, TIMING.MAX_DURATION);
}

/**
 * Determine if a navigation should interrupt the current animation.
 * Critical priority or force flag can interrupt.
 */
export function shouldInterruptAnimation(
  currentRequest: NavigationRequest | null,
  newRequest: NavigationRequest
): boolean {
  if (!currentRequest) return true;
  
  // Critical priority always interrupts
  if (newRequest.priority === 'critical') return true;
  
  // Force flag overrides
  if (newRequest.options?.force) return true;
  
  // High priority can interrupt normal/low
  if (newRequest.priority === 'high' && 
      (currentRequest.priority === 'normal' || currentRequest.priority === 'low')) {
    return true;
  }
  
  return false;
}