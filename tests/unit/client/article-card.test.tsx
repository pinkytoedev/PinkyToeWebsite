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
  content: '',
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

describe('ArticleCard', () => {
  describe('an article with a body', () => {
    it('keeps the compact fixed-height image', () => {
      const { container } = renderCard({ content: 'Real body text.' })
      expect(img(container).className).toContain('h-48')
      expect(img(container).className).not.toContain('h-72')
    })

    it('shows the Read More overlay', () => {
      const { getByText } = renderCard({ content: 'Real body text.' })
      expect(getByText('Read More')).toBeTruthy()
    })

    it('reserves space for the description so cards in a row stay level', () => {
      const { container } = renderCard({ content: 'Real body text.', description: '' })
      const paragraph = container.querySelector('p.min-h-\\[4rem\\]')
      expect(paragraph).not.toBeNull()
    })
  })

  describe('an image-led article with no body', () => {
    it('is sized by the image rather than a fixed box', () => {
      // A fixed height letterboxes a portrait meme into a narrow strip, so
      // widening the card does nothing for it. The image sizes itself, capped.
      const { container } = renderCard({ content: '' })
      const cls = img(container).className
      expect(cls).toContain('max-h-[70vh]')
      expect(cls).toContain('h-auto')
      expect(cls).toContain('w-auto')
      expect(cls).not.toContain('h-48')
    })

    it('never crops the image', () => {
      // These are memes of every aspect ratio; object-cover would cut the joke.
      const { container } = renderCard({ content: '' })
      expect(img(container).className).toContain('object-contain')
      expect(img(container).className).not.toContain('object-cover')
    })

    it('drops the Read More overlay, which promises text that is not there', () => {
      const { queryByText } = renderCard({ content: '' })
      expect(queryByText('Read More')).toBeNull()
    })

    it('does not reserve an empty description block', () => {
      const { container } = renderCard({ content: '', description: '' })
      expect(container.querySelector('p.min-h-\\[4rem\\]')).toBeNull()
    })

    it('still shows a description when there is one', () => {
      const { getByText } = renderCard({ content: '', description: 'A caption.' })
      expect(getByText('A caption.')).toBeTruthy()
    })

    it('lets the headline run to full length instead of clamping it', () => {
      const { getByText } = renderCard({ content: '' })
      const heading = getByText('A very good headline')
      expect(heading.className).not.toContain('line-clamp-2')
      expect(heading.className).toContain('text-2xl')
    })

    it('treats html that renders to nothing as having no body', () => {
      const { container } = renderCard({ content: '<p>&nbsp;</p>', contentFormat: 'html' })
      expect(img(container).className).toContain('max-h-[70vh]')
    })

    it('still links through to the article', () => {
      // The point is that clicking is no longer necessary, not that it is gone —
      // the detail page is still what gets shared.
      const { container } = renderCard({ content: '' })
      expect(container.querySelector('a')?.getAttribute('href')).toBe('/articles/1')
    })
  })
})
