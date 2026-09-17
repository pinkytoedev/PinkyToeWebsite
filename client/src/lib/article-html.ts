import { sanitizeArticleHtml } from "./sanitize";

/**
 * Turn CMS article HTML into something worth reading.
 *
 * Bodies are pasted straight out of Google Docs, and a Docs export is not a
 * web page. Two habits of that exporter decide how an article reads here:
 *
 *  - Every visual decision - italics, bold, alignment - lives in a `<style>`
 *    block full of `.c3 { font-style: italic }` rules. Sanitization drops that
 *    block (rightly: injecting it restyles the whole site), so the classes
 *    survive with nothing behind them and every emphasised phrase renders as
 *    flat body text.
 *  - Blank lines are written as real paragraphs - `<p class="c4"><span
 *    class="c0"></span></p>` - rather than as margins. Under `prose` each one
 *    costs a full line of scroll, which is most of why articles feel twice as
 *    long as they are.
 *
 * So the stylesheet is read *before* it is thrown away, the handful of
 * declarations that are safe to honour are re-expressed as real elements, and
 * the padding paragraphs go. Everything else about the markup is left alone.
 */

/** The only presentation worth carrying over from a Docs stylesheet. */
export interface DocsClassStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  /**
   * Centre and right only. Docs marks most body paragraphs `text-align:
   * justify`, which on a phone-width column opens rivers of whitespace between
   * words; browser justification has no hyphenation to fall back on.
   */
  align?: "center" | "right";
}

const STYLE_BLOCK = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
const CSS_COMMENT = /\/\*[\s\S]*?\*\//g;
/** A bare single-class selector: `.c3`. Anything with a combinator is ignored. */
const SIMPLE_CLASS_SELECTOR = /^\.([A-Za-z_][\w-]*)$/;

const BOLD_WEIGHT = /^(bold(er)?|[789]00)$/;

/** Characters that occupy markup but render as nothing. */
const INVISIBLE = /[\s ​‌﻿]/g;

/**
 * Elements that make a block worth keeping even with no text in it.
 *
 * `br` is deliberately absent: `<p><br></p>` is Docs writing a blank line, not
 * content, and it is the single most common thing in these bodies.
 */
const MEANINGFUL_CONTENT = "img,picture,video,audio,iframe,svg,hr,table,figure,blockquote,pre";

/** Blocks that are only there to hold something. */
const DISPOSABLE_BLOCKS = "p,div,span,li,h1,h2,h3,h4,h5,h6";

/**
 * Read `.className { ... }` rules out of the raw HTML's `<style>` blocks.
 *
 * This is a text scan, never an injection: the stylesheet is read for four
 * declarations and the rest - including anything that could load a resource or
 * reposition an element - is discarded.
 */
export function parseDocsClassStyles(html: string): Map<string, DocsClassStyle> {
  const styles = new Map<string, DocsClassStyle>();
  if (!html) return styles;

  STYLE_BLOCK.lastIndex = 0;
  let block: RegExpExecArray | null;

  while ((block = STYLE_BLOCK.exec(html)) !== null) {
    const css = block[1].replace(CSS_COMMENT, "");

    for (const rule of css.split("}")) {
      const brace = rule.indexOf("{");
      if (brace === -1) continue;

      const selectors = rule.slice(0, brace).split(",");
      const declared = readDeclarations(rule.slice(brace + 1));
      if (!declared) continue;

      for (const selector of selectors) {
        const match = SIMPLE_CLASS_SELECTOR.exec(selector.trim());
        if (!match) continue;

        // Later rules win, the same way the cascade would have resolved them.
        styles.set(match[1], { ...styles.get(match[1]), ...declared });
      }
    }
  }

  return styles;
}

function readDeclarations(body: string): DocsClassStyle | null {
  const style: DocsClassStyle = {};
  let found = false;

  for (const declaration of body.split(";")) {
    const colon = declaration.indexOf(":");
    if (colon === -1) continue;

    const property = declaration.slice(0, colon).trim().toLowerCase();
    const value = declaration.slice(colon + 1).trim().toLowerCase();

    switch (property) {
      case "font-weight":
        style.bold = BOLD_WEIGHT.test(value);
        found = true;
        break;
      case "font-style":
        style.italic = value === "italic" || value === "oblique";
        found = true;
        break;
      case "text-decoration":
      case "text-decoration-line":
        style.underline = value.includes("underline");
        found = true;
        break;
      case "text-align":
        if (value === "center" || value === "right") {
          style.align = value;
          found = true;
        }
        break;
    }
  }

  return found ? style : null;
}

/**
 * Sanitize an article body, then make it readable.
 *
 * Order matters: the stylesheet has to be read off the raw string, because
 * sanitization is what removes it.
 */
export function prepareArticleHtml(html: string | null | undefined): string {
  if (!html) return "";

  const classStyles = parseDocsClassStyles(html);
  const safe = sanitizeArticleHtml(html);

  // Any environment without a DOM parser still gets a correct - just
  // untidied - article rather than an empty one.
  if (typeof DOMParser === "undefined") return safe;

  const root = new DOMParser().parseFromString(safe, "text/html").body;

  restoreEmphasis(root, classStyles);
  unwrapRedirectLinks(root);
  tidyImages(root);
  dropEmptyBlocks(root);
  collapseBreakRuns(root);
  stripPresentationAttributes(root);

  return root.innerHTML;
}

/** Re-express the surviving Docs classes as `<strong>`, `<em>` and `<u>`. */
function restoreEmphasis(root: HTMLElement, classStyles: Map<string, DocsClassStyle>): void {
  if (classStyles.size === 0) return;

  root.querySelectorAll<HTMLElement>("[class]").forEach(element => {
    const resolved: DocsClassStyle = {};
    for (const name of Array.from(element.classList)) {
      Object.assign(resolved, classStyles.get(name));
    }

    if (resolved.align) element.style.textAlign = resolved.align;

    // Nothing to emphasise in an empty span, and it is about to be removed.
    if (element.textContent?.replace(INVISIBLE, "") === "") return;

    // Outermost first, so the result nests as <u><em><strong>text.
    if (resolved.underline) wrapChildren(element, "u");
    if (resolved.italic) wrapChildren(element, "em");
    if (resolved.bold) wrapChildren(element, "strong");
  });
}

function wrapChildren(element: HTMLElement, tag: "u" | "em" | "strong"): void {
  // An ancestor already says this, and <strong><strong> says it no louder.
  if (element.closest(tag)) return;

  const wrapper = element.ownerDocument.createElement(tag);
  while (element.firstChild) wrapper.appendChild(element.firstChild);
  element.appendChild(wrapper);
}

/**
 * Point Docs' `google.com/url?q=...` wrappers at where they actually go.
 *
 * The redirect costs the reader a hop through Google, leaks the click, and
 * expires; the real destination is sitting in the query string.
 */
function unwrapRedirectLinks(root: HTMLElement): void {
  root.querySelectorAll<HTMLAnchorElement>("a[href]").forEach(anchor => {
    const href = anchor.getAttribute("href") || "";
    if (!/^https?:\/\/(www\.)?google\.com\/url\?/i.test(href)) return;

    let target: string | null = null;
    try {
      target = new URL(href).searchParams.get("q");
    } catch {
      return;
    }

    if (!target || !/^https?:\/\//i.test(target)) return;

    anchor.setAttribute("href", target);
    // Docs often uses the wrapper URL as the link text as well.
    if (anchor.textContent?.trim() === href) anchor.textContent = target;
  });
}

/**
 * Give body images the sizing information the layout needs.
 *
 * Docs writes dimensions as inline `style`, which is stripped below - moving
 * them to attributes keeps the aspect ratio available to the browser, so the
 * page does not jump as each image arrives.
 */
function tidyImages(root: HTMLElement): void {
  root.querySelectorAll<HTMLImageElement>("img").forEach(image => {
    for (const axis of ["width", "height"] as const) {
      if (image.hasAttribute(axis)) continue;
      const pixels = parseInt(image.style[axis], 10);
      if (Number.isFinite(pixels) && pixels > 0) image.setAttribute(axis, String(pixels));
    }

    image.setAttribute("loading", "lazy");
    image.setAttribute("decoding", "async");
  });
}

/** Remove the blank paragraphs Docs uses instead of margins. */
function dropEmptyBlocks(root: HTMLElement): void {
  // Innermost first: emptying <p><span></span></p> is what makes the paragraph
  // itself removable.
  const blocks = Array.from(root.querySelectorAll<HTMLElement>(DISPOSABLE_BLOCKS)).reverse();

  for (const block of blocks) {
    if (block.textContent?.replace(INVISIBLE, "") !== "") continue;
    if (block.querySelector(MEANINGFUL_CONTENT)) continue;
    block.remove();
  }
}

/** `<br><br><br>` is someone reaching for a paragraph break. Give them one. */
function collapseBreakRuns(root: HTMLElement): void {
  root.querySelectorAll("br").forEach(brk => {
    let next = brk.nextSibling;

    while (next) {
      if (next.nodeType === 3 && (next.textContent || "").replace(INVISIBLE, "") === "") {
        next = next.nextSibling;
        continue;
      }
      if (next.nodeType === 1 && (next as Element).tagName === "BR") {
        const redundant = next;
        next = next.nextSibling;
        redundant.parentNode?.removeChild(redundant);
        continue;
      }
      break;
    }
  });
}

/**
 * Drop the class, id and inline styling the CMS carries in.
 *
 * The stylesheet that gave those classes meaning is gone, so they are dead
 * weight that can only collide with the site's own styles - `.c1` is not a
 * name Docs has any claim to. Alignment set above is the one thing kept.
 */
function stripPresentationAttributes(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>("[class],[id],[style]").forEach(element => {
    const align = element.style.textAlign;

    element.removeAttribute("class");
    element.removeAttribute("id");
    element.removeAttribute("style");

    if (align === "center" || align === "right") element.style.textAlign = align;
  });
}
