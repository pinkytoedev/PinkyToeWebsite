import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { ImageLedArticleRow } from '../../../client/src/components/articles/image-led-article-row'

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
  title: 'A very good headline that goes on for a while',
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

const renderRow = (overrides = {}) =>
  render(<ImageLedArticleRow article={{ ...baseArticle, ...overrides } as any} />)

/** The picture is the whole post, so it has to land without being clicked. */
describe('ImageLedArticleRow', () => {
  it('never crops the image', () => {
    const { container } = renderRow()
    const picture = container.querySelectorAll('img')[1]
    expect(picture.className).toContain('object-contain')
    expect(picture.className).not.toContain('object-cover')
  })

  it('fills the frame behind the picture instead of leaving it empty', () => {
    // A portrait image in a wide frame otherwise sits between two flat slabs.
    const { container } = renderRow()
    const backdrop = container.querySelectorAll('img')[0]
    expect(backdrop.className).toContain('article-hero__backdrop')
    expect(backdrop.getAttribute('aria-hidden')).toBe('true')
    expect(backdrop.getAttribute('alt')).toBe('')
  })

  it('drops the Read More overlay, which promises text that is not there', () => {
    const { queryByText } = renderRow()
    expect(queryByText('Read More')).toBeNull()
  })

  it('lets the headline run to full length instead of clamping it', () => {
    const { getByText } = renderRow()
    const heading = getByText(baseArticle.title)
    expect(heading.className).not.toContain('line-clamp')
    expect(heading.className).not.toContain('min-h-')
  })

  it('does not reserve an empty description block', () => {
    const { container } = renderRow({ description: '' })
    expect(container.querySelector('p.min-h-\\[4rem\\]')).toBeNull()
  })

  it('still shows a description when there is one', () => {
    const { getByText } = renderRow({ description: 'A caption.' })
    expect(getByText('A caption.')).toBeTruthy()
  })

  it('still links through to the article', () => {
    // The point is that clicking is no longer necessary, not that it is gone -
    // the detail page is still what gets shared.
    const { container } = renderRow()
    expect(container.querySelector('a')?.getAttribute('href')).toBe('/articles/1')
  })
})
