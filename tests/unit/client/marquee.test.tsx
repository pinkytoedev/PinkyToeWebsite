import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Marquee } from '../../../client/src/components/ui/marquee'

/**
 * The marquee renders its children twice and scrolls one copy's width, so the
 * two copies meet once per lap. The spacing at that join comes from the track's
 * own gap, and it has to match the gap inside each copy — when the track had no
 * gap at all, every quote sat 96px from its neighbour except the last, which ran
 * straight into the first with nothing between them.
 *
 * jsdom does no layout, so this asserts the structure that produces the spacing
 * rather than the spacing itself. That is enough to catch the regression: it was
 * a missing class, not a wrong measurement.
 */
describe('Marquee', () => {
  const renderMarquee = () =>
    render(
      <Marquee>
        <span>first</span>
        <span>second</span>
      </Marquee>,
    )

  /** The `gap-*` utility on an element, whatever size it happens to be. */
  const gapClass = (element: Element | null | undefined) =>
    Array.from(element?.classList ?? []).find((name) => name.startsWith('gap-'))

  const trackOf = (container: HTMLElement) =>
    container.firstElementChild?.firstElementChild ?? null

  it('spaces the join between the copies the same as the items within them', () => {
    const { container } = renderMarquee()
    const track = trackOf(container)
    const copies = Array.from(track?.children ?? [])

    expect(copies).toHaveLength(2)
    // A track with no gap is the bug; a track whose gap differs from the copies'
    // is the same bug wearing a different number.
    expect(gapClass(track)).toBeDefined()
    for (const copy of copies) {
      expect(gapClass(copy)).toBe(gapClass(track))
    }
  })

  it('renders the children twice and hides the duplicate from assistive tech', () => {
    const { container } = renderMarquee()
    const [original, duplicate] = Array.from(trackOf(container)?.children ?? [])

    expect(original.children).toHaveLength(2)
    expect(duplicate.children).toHaveLength(2)
    expect(original.getAttribute('aria-hidden')).toBeNull()
    expect(duplicate.getAttribute('aria-hidden')).toBe('true')
  })

  it('renders nothing when it has no children', () => {
    const { container } = render(<Marquee>{null}</Marquee>)
    expect(container).toBeEmptyDOMElement()
  })
})
