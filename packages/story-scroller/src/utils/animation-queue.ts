/**
 * Animation queue management for deduplication and priority handling
 * Prevents animation conflicts and ensures smooth transitions
 */

import type { NavigationRequest, NavigationQueue, NavigationOptions } from '../types/scroll-state'

/**
 * Create a unique ID for navigation requests
 */
export function generateNavigationId(): string {
  return `nav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Initialize an empty navigation queue
 */
export function createNavigationQueue(): NavigationQueue {
  return {
    requests: [],
    processing: false,
    lastProcessedId: null,
    highPriorityCount: 0,
  }
}

/**
 * Add a navigation request to the queue with deduplication
 */
export function enqueueNavigation(
  queue: NavigationQueue,
  request: Omit<NavigationRequest, 'id' | 'timestamp'>
): NavigationRequest {
  const now = Date.now()
  const fullRequest: NavigationRequest = {
    ...request,
    id: generateNavigationId(),
    timestamp: now,
  }
  
  // Check for duplicate requests
  const duplicateIndex = queue.requests.findIndex(
    r => r.targetSection === request.targetSection && 
        now - r.timestamp < 100 && // Within 100ms
        r.source === request.source
  )
  
  if (duplicateIndex !== -1) {
    console.log('🚫 Duplicate navigation request ignored:', {
      targetSection: request.targetSection,
      source: request.source,
      timeSinceLastRequest: now - queue.requests[duplicateIndex].timestamp,
    })
    return queue.requests[duplicateIndex]
  }
  
  // Handle priority insertion
  if (request.priority === 'critical') {
    // Critical requests go to the front
    queue.requests.unshift(fullRequest)
  } else if (request.priority === 'high') {
    // High priority requests go after critical but before normal
    const insertIndex = queue.requests.findIndex(r => 
      r.priority !== 'critical' && r.priority !== 'high'
    )
    if (insertIndex === -1) {
      queue.requests.push(fullRequest)
    } else {
      queue.requests.splice(insertIndex, 0, fullRequest)
    }
    queue.highPriorityCount++
  } else {
    // Normal and low priority go to the end
    queue.requests.push(fullRequest)
  }
  
  console.log('📥 Navigation enqueued:', {
    id: fullRequest.id,
    targetSection: fullRequest.targetSection,
    priority: fullRequest.priority,
    queueLength: queue.requests.length,
  })
  
  return fullRequest
}

/**
 * Get the next navigation request from the queue
 */
export function dequeueNavigation(queue: NavigationQueue): NavigationRequest | null {
  if (queue.requests.length === 0) {
    return null
  }
  
  const request = queue.requests.shift()!
  
  if (request.priority === 'high') {
    queue.highPriorityCount = Math.max(0, queue.highPriorityCount - 1)
  }
  
  queue.lastProcessedId = request.id
  
  console.log('📤 Navigation dequeued:', {
    id: request.id,
    targetSection: request.targetSection,
    remainingInQueue: queue.requests.length,
  })
  
  return request
}

/**
 * Clear all pending navigation requests
 */
export function clearNavigationQueue(queue: NavigationQueue): void {
  const cleared = queue.requests.length
  queue.requests = []
  queue.highPriorityCount = 0
  queue.processing = false
  
  if (cleared > 0) {
    console.log('🗑️ Navigation queue cleared:', { clearedCount: cleared })
  }
}

/**
 * Remove specific navigation requests by predicate
 */
export function filterNavigationQueue(
  queue: NavigationQueue,
  predicate: (request: NavigationRequest) => boolean
): NavigationRequest[] {
  const removed: NavigationRequest[] = []
  
  queue.requests = queue.requests.filter(request => {
    if (!predicate(request)) {
      removed.push(request)
      if (request.priority === 'high') {
        queue.highPriorityCount = Math.max(0, queue.highPriorityCount - 1)
      }
      return false
    }
    return true
  })
  
  if (removed.length > 0) {
    console.log('🔍 Filtered navigation queue:', {
      removedCount: removed.length,
      remainingCount: queue.requests.length,
    })
  }
  
  return removed
}

/**
 * Check if a navigation to a specific section is already queued
 */
export function isNavigationQueued(
  queue: NavigationQueue,
  targetSection: number
): boolean {
  return queue.requests.some(r => r.targetSection === targetSection)
}

/**
 * Get queue statistics for debugging
 */
export function getQueueStats(queue: NavigationQueue): {
  total: number
  byPriority: Record<string, number>
  bySource: Record<string, number>
  oldestRequestAge: number | null
  processingTime: number | null
} {
  const now = Date.now()
  const stats = {
    total: queue.requests.length,
    byPriority: { critical: 0, high: 0, normal: 0, low: 0 },
    bySource: {} as Record<string, number>,
    oldestRequestAge: null as number | null,
    processingTime: null as number | null,
  }
  
  queue.requests.forEach((request, index) => {
    // Count by priority
    stats.byPriority[request.priority]++
    
    // Count by source
    stats.bySource[request.source] = (stats.bySource[request.source] || 0) + 1
    
    // Track oldest request
    if (index === 0) {
      stats.oldestRequestAge = now - request.timestamp
    }
  })
  
  return stats
}

/**
 * Merge navigation options with defaults
 */
export function mergeNavigationOptions(
  options?: NavigationOptions,
  defaults?: NavigationOptions
): NavigationOptions {
  return {
    duration: options?.duration ?? defaults?.duration,
    easing: options?.easing ?? defaults?.easing,
    immediate: options?.immediate ?? defaults?.immediate ?? false,
    force: options?.force ?? defaults?.force ?? false,
    onComplete: options?.onComplete ?? defaults?.onComplete,
    onInterrupt: options?.onInterrupt ?? defaults?.onInterrupt,
    metadata: {
      ...defaults?.metadata,
      ...options?.metadata,
    },
  }
}

/**
 * Determine if a navigation request should interrupt the current animation
 */
export function shouldInterruptAnimation(
  currentRequest: NavigationRequest | null,
  newRequest: NavigationRequest
): boolean {
  // Critical requests always interrupt
  if (newRequest.priority === 'critical') {
    return true
  }
  
  // Force option overrides normal rules
  if (newRequest.options?.force) {
    return true
  }
  
  // No current request means nothing to interrupt
  if (!currentRequest) {
    return false
  }
  
  // High priority can interrupt normal/low
  if (newRequest.priority === 'high' && 
      (currentRequest.priority === 'normal' || currentRequest.priority === 'low')) {
    return true
  }
  
  // Recovery requests can interrupt user requests
  if (newRequest.source === 'recovery' && currentRequest.source === 'user') {
    return true
  }
  
  return false
}

/**
 * Calculate appropriate animation duration based on distance
 */
export function calculateAnimationDuration(
  currentSection: number,
  targetSection: number,
  baseDuration: number = 1.2,
  options?: NavigationOptions
): number {
  // Immediate animations have no duration
  if (options?.immediate) {
    return 0
  }
  
  // Use explicit duration if provided
  if (options?.duration !== undefined) {
    return options.duration
  }
  
  // Calculate based on distance
  const distance = Math.abs(targetSection - currentSection)
  
  // Single section: use base duration
  if (distance === 1) {
    return baseDuration
  }
  
  // Multiple sections: scale duration
  // Use sqrt to prevent very long animations
  return baseDuration * Math.sqrt(distance)
}

/**
 * Create a navigation request for recovery scenarios
 */
export function createRecoveryRequest(
  targetSection: number,
  reason: string
): Omit<NavigationRequest, 'id' | 'timestamp'> {
  return {
    targetSection,
    source: 'recovery',
    priority: 'high',
    options: {
      force: true,
      immediate: true,
      metadata: {
        reason,
        timestamp: Date.now(),
      },
    },
  }
}