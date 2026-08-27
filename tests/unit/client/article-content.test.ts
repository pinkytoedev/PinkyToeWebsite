import { describe, it, expect } from 'vitest'
import { hasArticleBody, isImageLedArticle } from '../../../client/src/lib/article-content'

/**
 * The whole feature hangs on this predicate: get it wrong in one direction and
 * a real article is blown up to full width with no text under it; wrong in the
 * other and the image-only posts stay as unreadable thumbnails.
 */
describe('hasArticleBody', () => {
  it('is true for plaintext and html bodies with real text', () => {
    expect(hasArticleBody({ content: 'A real article.', contentFormat: 'plaintext' })).toBe(true)
    expect(hasArticleBody({ content: '<p>A real article.</p>', contentFormat: 'html' })).toBe(true)
  })

  it('is false when there is no body at all', () => {
    expect(hasArticleBody({ content: '', contentFormat: 'plaintext' })).toBe(false)
    expect(hasArticleBody({ content: '   \n\t ', contentFormat: 'plaintext' })).toBe(false)
    expect(hasArticleBody(undefined)).toBe(false)
    expect(hasArticleBody({})).toBe(false)
  })

  // These are the ones a naive content.trim() would get wrong: non-empty
  // strings that a browser renders as nothing. They are what the CMS leaves
  // behind when an editor clears a rich-text field.
  it.each([
    ['empty paragraph', '<p></p>'],
    ['non-breaking space', '<p>&nbsp;</p>'],
    ['numeric nbsp entity', '<p>&#160;</p>'],
    ['line break only', '<br>'],
    ['nested empty markup', '<div><p><span></span></p></div>'],
    ['whitespace between tags', '<p>\n  \n</p>'],
  ])('is false for html that renders to nothing: %s', (_label, content) => {
    expect(hasArticleBody({ content, contentFormat: 'html' })).toBe(false)
  })

  it('does not strip tags from a plaintext body', () => {
    // Angle brackets in plaintext are literal characters a reader sees, not
    // markup. Stripping unconditionally would call this article empty.
    expect(hasArticleBody({ content: '<not markup>', contentFormat: 'plaintext' })).toBe(true)
  })

  it('treats a body of only markup-adjacent punctuation in html as empty', () => {
    expect(hasArticleBody({ content: '<p> </p><p> </p>', contentFormat: 'html' })).toBe(false)
  })

  it('isImageLedArticle is the inverse', () => {
    const withBody = { content: 'text', contentFormat: 'plaintext' as const }
    const withoutBody = { content: '<p>&nbsp;</p>', contentFormat: 'html' as const }
    expect(isImageLedArticle(withBody)).toBe(false)
    expect(isImageLedArticle(withoutBody)).toBe(true)
  })
})
