/**
 * Session state manager for debugging and visibility
 * Provides centralized access to session storage with logging
 */

export class SessionState {
  private static prefix = 'motion-system'
  
  static set(key: string, value: any): void {
    const fullKey = `${this.prefix}-${key}`
    const serialized = JSON.stringify(value)
    
    console.log('[SessionState] Setting:', {
      key: fullKey,
      value,
      timestamp: new Date().toISOString()
    })
    
    try {
      sessionStorage.setItem(fullKey, serialized)
    } catch (error) {
      console.error('[SessionState] Failed to set:', fullKey, error)
    }
  }
  
  static get<T = any>(key: string): T | null {
    const fullKey = `${this.prefix}-${key}`
    
    try {
      const value = sessionStorage.getItem(fullKey)
      if (value === null) {
        console.log('[SessionState] Key not found:', fullKey)
        return null
      }
      
      const parsed = JSON.parse(value)
      console.log('[SessionState] Retrieved:', {
        key: fullKey,
        value: parsed,
        timestamp: new Date().toISOString()
      })
      
      return parsed
    } catch (error) {
      console.error('[SessionState] Failed to get:', fullKey, error)
      return null
    }
  }
  
  static remove(key: string): void {
    const fullKey = `${this.prefix}-${key}`
    
    console.log('[SessionState] Removing:', {
      key: fullKey,
      timestamp: new Date().toISOString()
    })
    
    sessionStorage.removeItem(fullKey)
  }
  
  static clear(): void {
    console.log('[SessionState] Clearing all motion-system keys')
    
    const keysToRemove: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key?.startsWith(this.prefix)) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => sessionStorage.removeItem(key))
    console.log('[SessionState] Cleared', keysToRemove.length, 'keys')
  }
  
  static debug(): void {
    console.group('[SessionState] Current state:')
    
    const state: Record<string, any> = {}
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key?.startsWith(this.prefix)) {
        try {
          state[key] = JSON.parse(sessionStorage.getItem(key) || 'null')
        } catch {
          state[key] = sessionStorage.getItem(key)
        }
      }
    }
    
    console.table(state)
    console.groupEnd()
  }
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).SessionState = SessionState
}