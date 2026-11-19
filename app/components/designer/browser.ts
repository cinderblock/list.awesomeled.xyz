import { absoluteUrl } from '~/lib/site';

/**
 * Small browser-only helpers for the designer: clipboard, downloads, file
 * names. Nothing here runs during prerendering — only from event handlers.
 */

/** Copy text to the clipboard; false when the browser refuses */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path (permissions, insecure context)
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the download before the URL goes away
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** "My Holiday Show!" -> "my-holiday-show"; empty titles -> "led-system" */
export function fileSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug || 'led-system';
}

/**
 * The design's link on the canonical site, for things that leave the page
 * (exported diagrams, parts lists): a file made on a preview deployment or a
 * dev server should still lead somewhere that exists.
 */
export function canonicalDesignUrl(query: string): string {
  return absoluteUrl(`/designer${query ? `?${query}` : ''}`);
}

/** Absolute URL of the current design on this origin (what "Copy link" copies) */
export function designUrl(query: string): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}${query ? `?${query}` : ''}`;
}
