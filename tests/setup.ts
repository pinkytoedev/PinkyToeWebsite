import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock console methods to reduce test noise
global.console = {
  ...console,
  // Keep error and warn for important messages
  error: vi.fn(),
  warn: vi.fn(),
  // Suppress info and log for cleaner test output
  info: vi.fn(),
  log: vi.fn(),
}

// Mock fetch for API tests
global.fetch = vi.fn()

// Setup environment variables for tests
process.env.NODE_ENV = 'test'