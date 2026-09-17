import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { ArticleCard } from '../../../client/src/components/articles/article-card'

vi.mock('wouter', () => ({
  Link: ({ href, children, className }: any) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

vi.mock('../../../client/src/lib/image-helper', () => ({
  getImageUrl: (url: string) => url,
  getPhotoUrl: (url: string) => url,
}))

const baseArticle = {
  id: '1',
  title: 'A very good headline',
  description: '',
  content: 'Real body text.',
  contentFormat: 'plaintext' as const,
  imageUrl: 'https://example.test/funny.png',
  imageType: 'url' as const,
  imagePath: null,
  featured: false,
  publishedAt: new Date('2026-01-02T00:00:00Z'),
  name: 'Someone',
  photo: '',
}

const renderCard = (overrides = {}) =>
  render(<ArticleCard article={{ ...baseArticle, ...overrides } as any} />)

const img = (container: HTMLElement) => container.querySelector('img')!

/**
 * The card for an article with something to read. Posts with no body go
 * through `ImageLedArticleRow` instead, so everything here is about a card
 * staying level with the others in its row.
 */
describe('ArticleCard', () => {
  it('keeps the compact fixed-height image', () => {
    const { container } = renderCard()
    expect(img(container).className).toContain('h-48')
  })

  it('never crops the image', () => {
    // These are memes of every aspect ratio; object-cover would cut the joke.
    const { container } = renderCard()
    expect(img(container).className).toContain('object-contain')
    expect(img(container).className).not.toContain('object-cover')
  })

  it('shows the Read More overlay', () => {
    const { getByText } = renderCard()
    expect(getByText('Read More')).toBeTruthy()
  })

  it('reserves space for the description so cards in a row stay level', () => {
    const { container } = renderCard({ description: '' })
    expect(container.querySelector('p.min-h-\\[4rem\\]')).not.toBeNull()
  })

  it('reserves space for a one-line headline for the same reason', () => {
    const { getByText } = renderCard()
    const heading = getByText('A very good headline')
    expect(heading.className).toContain('min-h-[3rem]')
    expect(heading.className).toContain('line-clamp-2')
  })

  it('links through to the article', () => {
    const { container } = renderCard()
    expect(container.querySelector('a')?.getAttribute('href')).toBe('/articles/1')
  })
})
