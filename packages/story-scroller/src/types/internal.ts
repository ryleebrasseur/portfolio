// Internal types for StoryScroller implementation

export interface LenisInstance {
  scroll: number
  raf: (time: number) => void
  scrollTo: (value: number, options?: { immediate?: boolean }) => void
  on: (event: 'scroll' | 'virtual-scroll', callback: (e?: any) => void) => () => void
  destroy: () => void
}

export interface ObserverInstance {
  kill: () => void
}

export interface ObserverConfig {
  target: Window | HTMLElement
  type: string
  tolerance: number
  preventDefault: boolean
  wheelSpeed: number
  onDown?: () => void
  onUp?: () => void
  onWheel?: (self: { deltaY: number }) => void
}