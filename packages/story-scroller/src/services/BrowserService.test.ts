import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BrowserService, MockBrowserService, createBrowserService } from './BrowserService'

describe('BrowserService', () => {
  describe('Production BrowserService', () => {
    it('should detect client environment correctly', () => {
      const service = new BrowserService()
      // In jsdom test environment, window is defined
      expect(service.isClient()).toBe(true)
    })
    
    it('should handle browser APIs safely', () => {
      const service = new BrowserService()
      // These should not throw even if window properties are missing
      expect(() => service.getScrollX()).not.toThrow()
      expect(() => service.getScrollY()).not.toThrow()
      expect(() => service.getInnerWidth()).not.toThrow()
      expect(() => service.getInnerHeight()).not.toThrow()
      expect(() => service.getUserAgent()).not.toThrow()
    })
    
    it('should handle scroll operations safely', () => {
      const service = new BrowserService()
      // Should not throw even if window.scrollTo is not available
      expect(() => service.scrollTo(100, 200)).not.toThrow()
    })
  })
  
  describe('MockBrowserService', () => {
    let mockService: MockBrowserService
    
    beforeEach(() => {
      mockService = new MockBrowserService()
    })
    
    describe('Scroll operations', () => {
      it('should track scroll position', () => {
        expect(mockService.getScrollX()).toBe(0)
        expect(mockService.getScrollY()).toBe(0)
        
        mockService.scrollTo(100, 200)
        
        expect(mockService.getScrollX()).toBe(100)
        expect(mockService.getScrollY()).toBe(200)
      })
      
      it('should record scroll history', () => {
        mockService.scrollTo(100, 200)
        mockService.scrollTo(200, 400)
        
        const history = mockService.getScrollHistory()
        expect(history).toHaveLength(2)
        expect(history[0]).toMatchObject({ x: 100, y: 200 })
        expect(history[1]).toMatchObject({ x: 200, y: 400 })
      })
      
      it('should dispatch scroll events', () => {
        const scrollHandler = vi.fn()
        mockService.addEventListener('scroll', scrollHandler)
        
        mockService.scrollTo(100, 200)
        
        expect(scrollHandler).toHaveBeenCalledTimes(1)
        expect(scrollHandler).toHaveBeenCalledWith(expect.any(Event))
      })
    })
    
    describe('Event handling', () => {
      it('should add and remove event listeners', () => {
        const handler1 = vi.fn()
        const handler2 = vi.fn()
        
        mockService.addEventListener('click', handler1)
        mockService.addEventListener('click', handler2)
        
        mockService.triggerEvent('click')
        
        expect(handler1).toHaveBeenCalledTimes(1)
        expect(handler2).toHaveBeenCalledTimes(1)
        
        mockService.removeEventListener('click', handler1)
        mockService.triggerEvent('click')
        
        expect(handler1).toHaveBeenCalledTimes(1) // Not called again
        expect(handler2).toHaveBeenCalledTimes(2)
      })
      
      it('should track dispatched events', () => {
        mockService.triggerEvent('custom', { bubbles: true })
        
        expect(mockService.events.dispatched).toHaveLength(1)
        expect(mockService.events.dispatched[0].type).toBe('custom')
      })
    })
    
    describe('DOM operations', () => {
      it('should mock element queries', () => {
        const rect = new DOMRect(10, 20, 300, 400)
        const element = mockService.addMockElement('.test-element', rect)
        
        const found = mockService.querySelector('.test-element')
        expect(found).toBe(element)
        
        const boundingRect = mockService.getBoundingClientRect(found!)
        expect(boundingRect).toEqual(rect)
      })
      
      it('should return null for non-existent elements', () => {
        const element = mockService.querySelector('.non-existent')
        expect(element).toBeNull()
      })
    })
    
    describe('Animation frames', () => {
      it('should queue and execute RAF callbacks', () => {
        const callback1 = vi.fn()
        const callback2 = vi.fn()
        
        const id1 = mockService.requestAnimationFrame(callback1)
        const id2 = mockService.requestAnimationFrame(callback2)
        
        expect(id1).toBe(1)
        expect(id2).toBe(2)
        
        mockService.triggerRAF(1000)
        
        expect(callback1).toHaveBeenCalledWith(1000)
        expect(callback2).toHaveBeenCalledWith(1000)
      })
      
      it('should cancel RAF callbacks', () => {
        const callback = vi.fn()
        const id = mockService.requestAnimationFrame(callback)
        
        mockService.cancelAnimationFrame(id)
        mockService.triggerRAF()
        
        expect(callback).not.toHaveBeenCalled()
      })
    })
    
    describe('Environment configuration', () => {
      it('should allow setting viewport dimensions', () => {
        mockService.setViewportDimensions(1920, 1080)
        
        expect(mockService.getInnerWidth()).toBe(1920)
        expect(mockService.getInnerHeight()).toBe(1080)
        expect(mockService.getViewportDimensions()).toEqual({
          width: 1920,
          height: 1080,
        })
      })
      
      it('should allow setting user agent', () => {
        mockService.setUserAgent('Firefox/123.0')
        expect(mockService.getUserAgent()).toBe('Firefox/123.0')
      })
      
      it('should allow simulating SSR environment', () => {
        mockService.setIsClient(false)
        
        expect(mockService.isClient()).toBe(false)
        expect(mockService.getDocumentBody()).toBeNull()
        expect(mockService.getDocumentElement()).toBeNull()
      })
    })
    
    describe('Reset functionality', () => {
      it('should reset all state', () => {
        // Modify state
        mockService.scrollTo(500, 600)
        mockService.setViewportDimensions(800, 600)
        mockService.addEventListener('test', vi.fn())
        mockService.addMockElement('.test')
        
        // Reset
        mockService.reset()
        
        // Verify reset
        expect(mockService.getScrollX()).toBe(0)
        expect(mockService.getScrollY()).toBe(0)
        expect(mockService.getInnerWidth()).toBe(1024)
        expect(mockService.getInnerHeight()).toBe(768)
        expect(mockService.querySelector('.test')).toBeNull()
        expect(mockService.getScrollHistory()).toHaveLength(0)
        expect(mockService.events.dispatched).toHaveLength(0)
      })
    })
  })
  
  describe('Factory function', () => {
    it('should create production service by default', () => {
      const service = createBrowserService()
      expect(service).toBeInstanceOf(BrowserService)
    })
    
    it('should create mock service when requested', () => {
      const service = createBrowserService(true)
      expect(service).toBeInstanceOf(MockBrowserService)
    })
  })
})

// Example usage in component tests
describe('Example: Using MockBrowserService in component tests', () => {
  it('should simulate scroll behavior', () => {
    const mockBrowser = new MockBrowserService()
    
    // Simulate a scroll-based component
    let currentSection = 0
    const totalSections = 5
    
    mockBrowser.addEventListener('scroll', () => {
      const scrollY = mockBrowser.getScrollY()
      const viewportHeight = mockBrowser.getInnerHeight()
      currentSection = Math.floor(scrollY / viewportHeight)
    })
    
    // Test scrolling to different sections
    mockBrowser.scrollTo(0, mockBrowser.getInnerHeight() * 2) // Scroll to section 2
    expect(currentSection).toBe(2)
    
    mockBrowser.scrollTo(0, mockBrowser.getInnerHeight() * 4) // Scroll to section 4
    expect(currentSection).toBe(4)
  })
  
  it('should simulate responsive behavior', () => {
    const mockBrowser = new MockBrowserService()
    
    // Test mobile viewport
    mockBrowser.setViewportDimensions(375, 667)
    expect(mockBrowser.getInnerWidth()).toBeLessThan(768) // Mobile breakpoint
    
    // Test desktop viewport
    mockBrowser.setViewportDimensions(1920, 1080)
    expect(mockBrowser.getInnerWidth()).toBeGreaterThan(1024) // Desktop breakpoint
  })
  
  it('should simulate browser detection', () => {
    const mockBrowser = new MockBrowserService()
    
    // Test Firefox
    mockBrowser.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0')
    expect(mockBrowser.getUserAgent()).toContain('Firefox')
    
    // Test Chrome
    mockBrowser.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/92.0.4515.159')
    expect(mockBrowser.getUserAgent()).toContain('Chrome')
  })
})