import DOMPurify from 'dompurify';

/**
 * Sanitize article HTML before it is handed to dangerouslySetInnerHTML.
 *
 * Article bodies come from Airtable, so anyone who can edit the base - or
 * anyone who compromises it - could otherwise land stored XSS on every reader.
 *
 * Links are forced to open safely: `target="_blank"` without `rel="noopener"`
 * hands the opener window to the destination page.
 */

let hookInstalled = false;

function installHook(): void {
  if (hookInstalled) return;

  DOMPurify.addHook('afterSanitizeAttributes', node => {
    if (node.tagName === 'A' && node.hasAttribute('href')) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });

  hookInstalled = true;
}

export function sanitizeArticleHtml(html: string | null | undefined): string {
  if (!html) return '';

  installHook();

  // Note: article bodies are pasted straight out of Google Docs and carry a
  // full <html>/<head>/<style> wrapper. DOMPurify drops those by default,
  // which is what we want - injecting a CMS <style> block into the page
  // applies its rules site-wide, not just to the article.
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target'],
  });
}
