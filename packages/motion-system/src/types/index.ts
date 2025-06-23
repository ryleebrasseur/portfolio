import { RefObject } from 'react'

export interface MotionState {
  scrollProgress: number
  velocity: number
  currentChapter: string
  chapterProgress: number
}

export interface Chapter {
  id: string
  start: number
  end: number
}

export interface MotionContextType extends MotionState {
  registerElement: (id: string, ref: RefObject<HTMLElement>) => void
  getElement: (id: string) => RefObject<HTMLElement> | undefined
}

export interface ScrollStateMachineOptions {
  chapters: Chapter[]
  onChapterChange?: (chapter: string) => void
}
