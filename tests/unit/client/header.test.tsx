import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from '../../../client/src/components/layout/header'

// Mock wouter router
vi.mock('wouter', () => ({
  Link: ({ href, children, onClick }: any) => (
    <a href={href} onClick={(event) => { event.preventDefault(); onClick?.(event) }} data-testid="link">
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
    GAMES: '/games',
    TEAM: '/team'
  },
  SITE_NAME: 'The Pinky Toe',
  SOCIAL_LINKS: {
    INSTAGRAM: 'https://instagram.com/pinkytoepaper'
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
    expect(screen.getAllByTestId('toe-logo')).toHaveLength(2)
    expect(screen.getByText('the pinky toe')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Games' })).toHaveAttribute('href', '/games')
    
    // Check for navigation links (they should be in the DOM)
    const links = screen.getAllByTestId('link')
    expect(links.length).toBeGreaterThan(0)
  })

  it('should handle scroll effect', () => {
    render(<Header />)
    
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
    
    expect(header).toHaveClass('py-1')
    
    // Simulate scroll event
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true })
    fireEvent.scroll(window)
    expect(header).toHaveClass('shadow-lg')
  })

  it('shows the Games link in the mobile menu and closes the menu on navigation', () => {
    render(<Header />)
    fireEvent.click(screen.getByRole('button', { name: 'Toggle mobile menu' }))
    const gamesLinks = screen.getAllByRole('link', { name: /Games/ })
    expect(gamesLinks).toHaveLength(2)
    expect(gamesLinks[1]).toHaveAttribute('href', '/games')
    fireEvent.click(gamesLinks[1])
    expect(screen.getAllByRole('link', { name: /Games/ })).toHaveLength(1)
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