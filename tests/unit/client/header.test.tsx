import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from '../../../client/src/components/layout/header'

// Mock wouter router
vi.mock('wouter', () => ({
  Link: ({ href, children, onClick }: any) => (
    <a href={href} onClick={onClick} data-testid="link">
      {children}
    </a>
  ),
  useLocation: () => ['/']
}))

// Mock hooks
vi.mock('../../../client/src/hooks/use-mobile', () => ({
  useIsMobile: () => false
}))

// Mock constants
vi.mock('../../../client/src/lib/constants', () => ({
  ROUTES: {
    HOME: '/',
    ARTICLES: '/articles',
    TEAM: '/team'
  },
  SITE_NAME: 'The Pinky Toe',
  SOCIAL_LINKS: {
    instagram: 'https://instagram.com/pinkytoepaper'
  }
}))

// Mock logo components
vi.mock('../../../client/src/assets/logo', () => ({
  PinkyToeWordLogo: ({ className }: any) => (
    <div className={className} data-testid="word-logo">Word Logo</div>
  ),
  PinkyToeLogo: ({ className }: any) => (
    <div className={className} data-testid="toe-logo">Toe Logo</div>
  )
}))

describe('Header Component', () => {
  it('should render the header with navigation links', () => {
    render(<Header />)
    
    // Check if main navigation elements are present
    expect(screen.getByRole('banner')).toBeInTheDocument()
    
    // Check for logo
    expect(screen.getByTestId('word-logo')).toBeInTheDocument()
    
    // Check for navigation links (they should be in the DOM)
    const links = screen.getAllByTestId('link')
    expect(links.length).toBeGreaterThan(0)
  })

  it('should handle scroll effect', () => {
    render(<Header />)
    
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
    
    // Initially should have py-2 class
    expect(header).toHaveClass('py-2')
    
    // Simulate scroll event
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true })
    fireEvent.scroll(window)
    
    // Note: The component might need additional testing for scroll behavior
    // depending on how the scroll listener is implemented
  })

  it('should render without crashing', () => {
    const { container } = render(<Header />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should have proper semantic structure', () => {
    render(<Header />)
    
    // Should have header element
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
    
    // Should be sticky positioned
    expect(header).toHaveClass('sticky')
    expect(header).toHaveClass('top-0')
  })
})