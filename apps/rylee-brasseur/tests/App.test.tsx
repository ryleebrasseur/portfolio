import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../src/App'

// Mock the components
vi.mock('../src/components/Hero/HeroSectionWebGL', () => ({
  default: () => <div data-testid="hero-section">Hero Section</div>,
}))

vi.mock('../src/components/CustomCursor/CustomCursor', () => ({
  default: () => <div data-testid="custom-cursor">Custom Cursor</div>,
}))

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('renders HeroSectionWebGL component', () => {
    render(<App />)
    expect(screen.getByTestId('hero-section')).toBeInTheDocument()
  })

  it('renders CustomCursor component', () => {
    render(<App />)
    expect(screen.getByTestId('custom-cursor')).toBeInTheDocument()
  })
})
