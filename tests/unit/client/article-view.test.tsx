import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { ArticleView } from '../../../client/src/components/articles/article-view'

vi.mock('wouter', () => ({
  Link: ({ href, children, className }: any) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

vi.mock('../../../client/src/lib/image-helper', () => ({
  getImageUrl: (url: string) => url,
  getPhotoUrl: (url: string) => url,
}))

const OPENING = 'My name is Lauren Matz and I am a bestselling author. Yep, you heard that right.'

const baseArticle = {
  id: '1',
  title: 'A very good headline',
  description: OPENING,
  descriptionIsExcerpt: true,
  content: `${OPENING} And then the rest of the article follows.`,
  contentFormat: 'plaintext' as const,
  imageUrl: 'https://example.test/funny.png',
  imageType: 'url' as const,
  imagePath: null,
  featured: false,
  publishedAt: new Date('2026-09-17T00:00:00Z'),
  name: 'Lauren Matz',
  photo: '',
}

const renderView = (overrides = {}) =>
  render(<ArticleView article={{ ...baseArticle, ...overrides } as any} />)

/**
 * Most posts leave the CMS description empty, and the API fills it with the
 * opening of the article so the list has something under each headline. On the
 * article itself that stand-in would sit directly above the sentences it was
 * cut from, so the reader reads them twice.
 */
describe('ArticleView standfirst', () => {
  it('stays silent when the description is the opening of the article', () => {
    const { container } = renderView()

    // Once in the body, and nowhere else.
    const shown = [...container.querySelectorAll('p')].filter(p =>
      p.textContent?.startsWith('My name is Lauren Matz'),
    )
    expect(shown).toHaveLength(1)
    expect(shown[0].closest('.article-prose')).not.toBeNull()
  })

  it('shows a description an editor actually wrote', () => {
    const { getByText } = renderView({
      description: 'A completely true account of academic publishing.',
      descriptionIsExcerpt: false,
    })

    expect(getByText('A completely true account of academic publishing.')).toBeTruthy()
  })

  it('says it once when the API is too old to say which it is', () => {
    // A cached response from before the flag existed: erring towards silence
    // costs a standfirst, erring the other way repeats the opening.
    const { container } = renderView({ descriptionIsExcerpt: undefined })

    const standfirst = [...container.querySelectorAll('p')].filter(
      p => p.textContent === OPENING,
    )
    expect(standfirst).toHaveLength(0)
  })

  it('never shows one on a post that is only a picture', () => {
    const { queryByText } = renderView({
      content: '',
      description: 'A caption.',
      descriptionIsExcerpt: false,
    })

    expect(queryByText('A caption.')).toBeNull()
  })

  it('still renders the body', () => {
    const { container } = renderView()

    expect(container.querySelector('.article-prose')?.textContent).toContain(
      'And then the rest of the article follows.',
    )
  })
})
