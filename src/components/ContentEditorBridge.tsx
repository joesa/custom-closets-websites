'use client';

import { useEffect, useRef } from 'react';
import { isNonNavigationalHref } from '@/lib/brandLink';

type EngineDocument = Record<string, unknown>;
type ResizeHandle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
type ImagePresentation = { widthPercent: number; aspectRatio: number };

const RESIZE_HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

export function calculateImageResize({
  handle,
  startWidth,
  startHeight,
  deltaX,
  deltaY,
  containerWidth,
}: {
  handle: ResizeHandle;
  startWidth: number;
  startHeight: number;
  deltaX: number;
  deltaY: number;
  containerWidth: number;
}): ImagePresentation {
  const horizontal = handle.includes('e') ? deltaX : handle.includes('w') ? -deltaX : 0;
  const vertical = handle.includes('s') ? deltaY : handle.includes('n') ? -deltaY : 0;
  const width = Math.min(Math.max(startWidth + horizontal, 32), Math.max(containerWidth, 32));
  const height = Math.min(Math.max(startHeight + vertical, 32), 2400);
  return {
    widthPercent: Math.round(Math.min(100, Math.max(5, (width / Math.max(containerWidth, 1)) * 100)) * 10) / 10,
    aspectRatio: Math.round(Math.min(5, Math.max(0.2, width / height)) * 1000) / 1000,
  };
}

const TEXT_STYLE_PROPERTIES = ['fontFamily', 'fontSize', 'fontWeight', 'color', 'textAlign'] as const;
const CSS_PROPERTY_NAMES: Record<(typeof TEXT_STYLE_PROPERTIES)[number], string> = {
  fontFamily: 'font-family',
  fontSize: 'font-size',
  fontWeight: 'font-weight',
  color: 'color',
  textAlign: 'text-align',
};

function rgbToHex(rgb: string): string {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return '#000000';
  const [, r, g, b] = match;
  return `#${[r, g, b].map((part) => Number(part).toString(16).padStart(2, '0')).join('')}`;
}

function encodePointer(value: string) {
  return value.replace(/~/g, '~0').replace(/\//g, '~1');
}

function textMappings(value: unknown, path = '', output: Array<{ path: string; value: string }> = []) {
  if (typeof value === 'string' && value.trim().length > 1) {
    output.push({ path, value: value.trim() });
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => textMappings(item, `${path}/${index}`, output));
  } else if (value && typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) =>
      textMappings(item, `${path}/${encodePointer(key)}`, output)
    );
  }
  return output;
}

function cleanSerializedHtml(root: HTMLElement) {
  const clone = root.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('[data-content-selected]').forEach((node) => node.removeAttribute('data-content-selected'));
  clone.removeAttribute('data-content-editor-root');
  return clone.innerHTML;
}

export function renderedImagePath(source: string, origin = window.location.origin) {
  try {
    const url = new URL(source, origin);
    if (url.pathname === '/_next/image') {
      const original = url.searchParams.get('url');
      if (original) return renderedImagePath(original, origin);
    }
    return decodeURIComponent(url.pathname);
  } catch {
    return source;
  }
}

function imagePresentations(document: EngineDocument): Record<string, ImagePresentation> {
  const structure = document.content_structure;
  if (!structure || typeof structure !== 'object') return {};
  const value = (structure as Record<string, unknown>).imagePresentation;
  return value && typeof value === 'object' ? value as Record<string, ImagePresentation> : {};
}

function resizeTarget(image: HTMLImageElement, path: string, mode: 'engine' | 'custom'): HTMLElement {
  if (mode === 'custom' || /(?:backgroundImage|logo_url)$/.test(path)) return image;
  return image.parentElement || image;
}

/**
 * Width that a `width: 100%` on this element would actually resolve to.
 *
 * The parent's border-box width is NOT that number: a grid/flex item resolves
 * percentages against its grid area / flex base, and a padded parent against
 * its content box. Sizing against the parent instead collapsed images on the
 * first pixel of a drag — a 341px image in a 1240px grid became 27.7%, which
 * the browser then resolved against the 341px track (94px), and each retry
 * shrank it again from the new, smaller size.
 *
 * Probing costs one forced layout per drag, only on pointerdown.
 */
function containingBlockWidth(target: HTMLElement): number {
  const { width: inlineWidth, maxWidth: inlineMaxWidth } = target.style;
  target.style.maxWidth = 'none';
  target.style.width = '100%';
  const measured = target.getBoundingClientRect().width;
  target.style.width = inlineWidth;
  target.style.maxWidth = inlineMaxWidth;
  return measured || target.parentElement?.getBoundingClientRect().width || window.innerWidth;
}

function applyImagePresentation(target: HTMLElement, presentation: ImagePresentation) {
  target.style.width = `${presentation.widthPercent}%`;
  target.style.aspectRatio = String(presentation.aspectRatio);
  target.style.height = 'auto';
  target.style.maxWidth = '100%';
  target.style.marginInline = 'auto';
  if (target instanceof HTMLImageElement && getComputedStyle(target).position === 'absolute') {
    target.style.position = 'relative';
    target.style.inset = 'auto';
    target.style.display = 'block';
  }
}

function isBrandChromeElement(el: Element | null): boolean {
  if (!el || !(el instanceof Element)) return false;
  if (el.closest('a.cs-brand, .cs-brand, .logo, .brand')) return true;
  if (el.closest('header, nav, .site-header, .site-nav')) {
    if (el instanceof HTMLAnchorElement && (el.getAttribute('href') === '/' || el.classList.contains('cs-brand'))) {
      return true;
    }
    if (el instanceof HTMLImageElement) {
      const alt = (el.getAttribute('alt') || '').toLowerCase();
      const cls = (el.getAttribute('class') || '').toLowerCase();
      if (/\blogo\b/.test(alt) || /\b(logo|cs-brand|brand)\b/.test(cls)) return true;
      // First image in header/nav is treated as the brand mark.
      const chrome = el.closest('header, nav, .site-header, .site-nav');
      const firstImg = chrome?.querySelector('img');
      if (firstImg === el) return true;
    }
  }
  return false;
}

/** Convert selected text/chrome into a home-linked logo image (never a lightbox). */
export function placeBrandLogoImage(selected: HTMLElement, img: HTMLImageElement): HTMLImageElement {
  const lightbox = selected.closest('label.img-lightbox');
  const brandAnchor =
    (selected instanceof HTMLAnchorElement && (selected.classList.contains('cs-brand') || selected.getAttribute('href') === '/'))
      ? selected
      : (selected.closest('a.cs-brand, header a[href="/"], nav a[href="/"], a.logo, a.brand') as HTMLAnchorElement | null);

  if (brandAnchor) {
    brandAnchor.setAttribute('href', '/');
    if (!brandAnchor.classList.contains('cs-brand')) brandAnchor.classList.add('cs-brand');
    brandAnchor.replaceChildren(img);
    const wrap = brandAnchor.closest('label.img-lightbox');
    if (wrap) wrap.replaceWith(brandAnchor);
    return img;
  }

  if (isBrandChromeElement(selected) || selected.closest('header, nav, .site-header, .site-nav')) {
    const anchor = selected.ownerDocument.createElement('a');
    anchor.href = '/';
    anchor.className = 'cs-brand';
    anchor.appendChild(img);
    const target = lightbox || selected;
    target.replaceWith(anchor);
    return img;
  }

  selected.replaceChildren(img);
  return img;
}

/** Ensure an image logo navigates home and is not wrapped in a lightbox. */
export function ensureImageLinksHome(img: HTMLImageElement): void {
  const wrap = img.closest('label.img-lightbox');
  if (wrap) {
    wrap.replaceWith(img);
  }
  let anchor = img.closest('a');
  if (!anchor) {
    anchor = img.ownerDocument.createElement('a');
    anchor.href = '/';
    anchor.className = 'cs-brand';
    img.replaceWith(anchor);
    anchor.appendChild(img);
  } else {
    if (isNonNavigationalHref(anchor.getAttribute('href'))) {
      anchor.setAttribute('href', '/');
    }
    if (!anchor.classList.contains('cs-brand')) anchor.classList.add('cs-brand');
  }
}

/** Parse engine JSON-pointer paths that belong to a reorderable array item. */
export function parseEngineArrayMove(path: string): { arrayPath: string; index: number } | null {
  // Prefer the deepest array segment so gallery images win over their parent block.
  const patterns = [
    /^(.*\/images)\/(\d+)$/,
    /^(.*\/specifications)\/(\d+)$/,
    /^(.*\/content_blocks)\/(\d+)(?:\/.*)?$/,
    /^(.*\/products_config)\/(\d+)(?:\/.*)?$/,
    /^(.*\/nav_links)\/(\d+)(?:\/.*)?$/,
    /^(.*\/steps)\/(\d+)(?:\/.*)?$/,
    /^(.*\/testimonials)\/(\d+)(?:\/.*)?$/,
    /^(.*\/stats)\/(\d+)(?:\/.*)?$/,
  ];
  for (const re of patterns) {
    const match = path.match(re);
    if (match) return { arrayPath: match[1], index: Number(match[2]) };
  }
  return null;
}

export default function ContentEditorBridge({
  rootRef,
  mode,
  pagePath = '/',
  engineDocument,
}: {
  rootRef: React.RefObject<HTMLElement | null>;
  mode: 'engine' | 'custom';
  pagePath?: string;
  engineDocument?: EngineDocument;
}) {
  const selectedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editorEnabled = params.get('content_editor') === '1';
    const editorOriginRaw = params.get('editor_origin');
    const sessionToken = params.get('content_editor_token');
    const root = rootRef.current;
    if (!root) return;
    let editorOrigin = '';
    if (editorEnabled && editorOriginRaw && sessionToken) {
      try { editorOrigin = new URL(editorOriginRaw).origin; } catch { return; }
    }
    const authenticatedEditor = Boolean(editorEnabled && editorOrigin && sessionToken);
    let resizeOverlay: HTMLDivElement | null = null;
    let resizeCleanup: (() => void) | null = null;

    const removeResizeOverlay = () => {
      resizeCleanup?.();
      resizeCleanup = null;
      resizeOverlay?.remove();
      resizeOverlay = null;
    };

    const showResizeOverlay = (image: HTMLImageElement, path: string) => {
      removeResizeOverlay();
      const target = resizeTarget(image, path, mode);
      const overlay = document.createElement('div');
      overlay.dataset.dtfResizeOverlay = '1';
      overlay.setAttribute('aria-label', 'Drag the handles to resize this image');
      for (const handle of RESIZE_HANDLES) {
        const control = document.createElement('button');
        control.type = 'button';
        control.dataset.resizeHandle = handle;
        control.setAttribute('aria-label', `Resize image from ${handle}`);
        overlay.appendChild(control);
      }
      document.body.appendChild(overlay);
      resizeOverlay = overlay;

      const updateOverlay = () => {
        if (!target.isConnected || !resizeOverlay) return removeResizeOverlay();
        const rect = target.getBoundingClientRect();
        resizeOverlay.style.left = `${rect.left}px`;
        resizeOverlay.style.top = `${rect.top}px`;
        resizeOverlay.style.width = `${rect.width}px`;
        resizeOverlay.style.height = `${rect.height}px`;
      };
      updateOverlay();

      const pointerDown = (event: PointerEvent) => {
        const control = (event.target as HTMLElement).closest<HTMLElement>('[data-resize-handle]');
        const handle = control?.dataset.resizeHandle as ResizeHandle | undefined;
        if (!handle || !control) return;
        event.preventDefault();
        event.stopPropagation();
        control.setPointerCapture(event.pointerId);
        const startX = event.clientX;
        const startY = event.clientY;
        const startRect = target.getBoundingClientRect();
        const containerWidth = containingBlockWidth(target);
        let presentation = calculateImageResize({
          handle,
          startWidth: startRect.width,
          startHeight: startRect.height,
          deltaX: 0,
          deltaY: 0,
          containerWidth,
        });
        const pointerMove = (moveEvent: PointerEvent) => {
          presentation = calculateImageResize({
            handle,
            startWidth: startRect.width,
            startHeight: startRect.height,
            deltaX: moveEvent.clientX - startX,
            deltaY: moveEvent.clientY - startY,
            containerWidth,
          });
          applyImagePresentation(target, presentation);
          updateOverlay();
        };
        const pointerUp = (upEvent: PointerEvent) => {
          if (control.hasPointerCapture(upEvent.pointerId)) control.releasePointerCapture(upEvent.pointerId);
          control.removeEventListener('pointermove', pointerMove);
          control.removeEventListener('pointerup', pointerUp);
          control.removeEventListener('pointercancel', pointerUp);
          if (mode === 'engine') {
            window.parent.postMessage({
              type: 'dtf:image-resize',
              sessionToken,
              path,
              presentation,
            }, editorOrigin);
          } else {
            window.parent.postMessage({
              type: 'dtf:custom-html',
              sessionToken,
              path: pagePath,
              html: cleanSerializedHtml(root),
            }, editorOrigin);
          }
        };
        control.addEventListener('pointermove', pointerMove);
        control.addEventListener('pointerup', pointerUp);
        control.addEventListener('pointercancel', pointerUp);
      };
      overlay.addEventListener('pointerdown', pointerDown);
      window.addEventListener('scroll', updateOverlay, true);
      window.addEventListener('resize', updateOverlay);
      resizeCleanup = () => {
        overlay.removeEventListener('pointerdown', pointerDown);
        window.removeEventListener('scroll', updateOverlay, true);
        window.removeEventListener('resize', updateOverlay);
      };
    };

    if (mode === 'engine' && engineDocument) {
      const mappings = textMappings(engineDocument);
      const images = Array.from(root.querySelectorAll<HTMLImageElement>('img'));
      const assigned = new Set<HTMLImageElement>();
      const presentations = imagePresentations(engineDocument);
      for (const mapping of mappings.filter((item) => /(?:image|logo)/i.test(item.path))) {
        const match = images.find((image) => !assigned.has(image) &&
          renderedImagePath(image.currentSrc || image.src) === renderedImagePath(mapping.value));
        if (!match) continue;
        assigned.add(match);
        if (authenticatedEditor) match.dataset.contentPath = mapping.path;
        const presentation = presentations[mapping.path];
        if (presentation) applyImagePresentation(resizeTarget(match, mapping.path, mode), presentation);
      }
    }

    if (!authenticatedEditor || !sessionToken) return;
    let referrer = document.querySelector('meta[name="referrer"]') as HTMLMetaElement | null;
    if (!referrer) {
      referrer = document.createElement('meta');
      referrer.name = 'referrer';
      document.head.appendChild(referrer);
    }
    referrer.content = 'no-referrer';
    root.dataset.contentEditorRoot = '1';

    if (mode === 'engine' && engineDocument) {
      const mappings = textMappings(engineDocument);
      const candidates = Array.from(root.querySelectorAll<HTMLElement>('h1,h2,h3,h4,p,a,li,span,figcaption'));
      for (const mapping of mappings) {
        const match = candidates.find((node) =>
          !node.dataset.contentPath && node.textContent?.trim() === mapping.value
        );
        if (match) match.dataset.contentPath = mapping.path;
      }
    } else if (mode === 'custom') {
      let sequence = 0;
      root.querySelectorAll<HTMLElement>('section,article,header,footer,h1,h2,h3,h4,h5,h6,p,a,li,img,figcaption,blockquote').forEach((node) => {
        if (!node.dataset.contentId) node.dataset.contentId = `content-${++sequence}`;
      });
    }

    const announceSelection = (editable: HTMLElement) => {
      selectedRef.current?.removeAttribute('data-content-selected');
      selectedRef.current = editable;
      editable.dataset.contentSelected = '1';
      if (editable instanceof HTMLImageElement) showResizeOverlay(
        editable,
        mode === 'engine' ? editable.dataset.contentPath || '' : `/custom_config/pages/${encodePointer(pagePath)}/html`,
      );
      else removeResizeOverlay();
      const computed = editable instanceof HTMLImageElement ? null : getComputedStyle(editable);
      window.parent.postMessage({
        type: 'dtf:content-select',
        sessionToken,
        path: mode === 'engine'
          ? editable.dataset.contentPath
          : `/custom_config/pages/${encodePointer(pagePath)}/html`,
        value: editable instanceof HTMLImageElement
          ? editable.currentSrc || editable.src
          : editable.textContent?.trim() || '',
        element: editable.tagName.toLowerCase(),
        alt: editable instanceof HTMLImageElement ? editable.alt : undefined,
        href: editable.closest('a')?.getAttribute('href') ?? null,
        style: computed
          ? {
              fontFamily: computed.fontFamily,
              fontSize: computed.fontSize,
              fontWeight: computed.fontWeight,
              color: rgbToHex(computed.color),
              textAlign: computed.textAlign,
            }
          : undefined,
      }, editorOrigin);
    };

    const select = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || target.closest('closet-quote-widget,closet-order-widget,closet-booking-widget,closet-ticket-widget')) return;
      const editable = mode === 'engine'
        ? target.closest<HTMLElement>('[data-content-path]')
        : target.closest<HTMLElement>('[data-content-id]');
      if (!editable || !root.contains(editable)) return;
      event.preventDefault();
      event.stopPropagation();
      announceSelection(editable);
    };

    const command = (event: MessageEvent) => {
      if (event.origin !== editorOrigin || event.source !== window.parent) return;
      if (!event.data || event.data.sessionToken !== sessionToken) return;
      if (mode === 'engine' && event.data.type === 'dtf:engine-content-update') {
        const path = typeof event.data.path === 'string' ? event.data.path : '';
        const value = event.data.value;
        root.querySelectorAll<HTMLElement>('[data-content-path]').forEach((node) => {
          if (node.dataset.contentPath !== path) return;
          if (node instanceof HTMLImageElement && typeof value === 'string') {
            node.src = value;
            node.removeAttribute('srcset');
          } else if (typeof value === 'string' || typeof value === 'number') {
            node.textContent = String(value);
          }
        });
        return;
      }
      if (mode !== 'custom' || event.data.type !== 'dtf:editor-command') return;
      const selected = selectedRef.current;
      if (!selected || !root.contains(selected)) return;
      const action = String(event.data.action || '');
      if (action === 'setValue') {
        const next = String(event.data.value || '');
        const nestedImage = selected.querySelector?.('img') ?? null;
        if (selected instanceof HTMLImageElement) {
          selected.src = next;
          selected.removeAttribute('srcset');
        } else if (isNonNavigationalHref(next) && nestedImage instanceof HTMLImageElement) {
          // Applying an image URL to a link that wraps an image means "swap the
          // picture", never "point this link at a JPEG". Doing the latter is
          // how the Alvarado logo ended up linking to /api/a/<token>.
          nestedImage.src = next;
          nestedImage.removeAttribute('srcset');
        } else if (
          selected instanceof HTMLAnchorElement &&
          !isNonNavigationalHref(next) &&
          /^(https?:\/\/|\/|#|mailto:|tel:)/i.test(next)
        ) {
          selected.href = next;
        } else {
          selected.textContent = next;
        }
      } else if (action === 'setAlt' && selected instanceof HTMLImageElement) {
        selected.alt = String(event.data.value || '');
      } else if (action === 'setHref') {
        const next = String(event.data.value || '');
        const anchor = selected instanceof HTMLAnchorElement ? selected : selected.closest('a');
        if (!anchor || isNonNavigationalHref(next)) return;
        if (!/^(https?:\/\/|\/|#|mailto:|tel:)/i.test(next)) return;
        anchor.setAttribute('href', next);
      } else if (action === 'setAlign' && selected instanceof HTMLImageElement) {
        const align = String(event.data.value || '');
        if (align !== 'left' && align !== 'center' && align !== 'right') return;
        selected.style.display = 'block';
        selected.style.marginLeft = align === 'left' ? '0' : 'auto';
        selected.style.marginRight = align === 'right' ? '0' : 'auto';
      } else if (action === 'setTextStyle' && !(selected instanceof HTMLImageElement)) {
        const style = event.data.style;
        if (!style || typeof style !== 'object') return;
        for (const property of TEXT_STYLE_PROPERTIES) {
          const value = style[property];
          if (typeof value === 'string' && value.trim()) {
            selected.style.setProperty(CSS_PROPERTY_NAMES[property], value.trim());
          }
        }
      } else if (action === 'convertToImage' && !(selected instanceof HTMLImageElement)) {
        const src = String(event.data.value || '');
        if (!src) return;
        const alt = selected.textContent?.trim() || '';
        const img = window.document.createElement('img');
        img.src = src;
        img.alt = alt;
        img.dataset.contentId = `content-img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const placed = isBrandChromeElement(selected)
          ? placeBrandLogoImage(selected, img)
          : (selected.replaceChildren(img), img);
        if (isBrandChromeElement(placed) || placed.closest('a.cs-brand, header, nav')) {
          ensureImageLinksHome(placed);
        }
        announceSelection(placed);
      } else if (action === 'linkHome' && selected instanceof HTMLImageElement) {
        ensureImageLinksHome(selected);
        announceSelection(selected);
      } else if (action === 'duplicate') {
        selected.insertAdjacentElement('afterend', selected.cloneNode(true) as HTMLElement);
      } else if (action === 'remove') {
        if (selected.closest('closet-quote-widget,closet-order-widget,closet-booking-widget,closet-ticket-widget')) return;
        const parent = selected.parentElement;
        selected.remove();
        selectedRef.current = parent;
      } else if (action === 'moveUp' && selected.previousElementSibling) {
        selected.parentElement?.insertBefore(selected, selected.previousElementSibling);
      } else if (action === 'moveDown' && selected.nextElementSibling) {
        selected.parentElement?.insertBefore(selected.nextElementSibling, selected);
      } else return;
      window.parent.postMessage({
        type: 'dtf:custom-html',
        sessionToken,
        path: pagePath,
        html: cleanSerializedHtml(root),
      }, editorOrigin);
    };

    const DRAG_THRESHOLD = 6;
    let dragState: {
      el: HTMLElement;
      startX: number;
      startY: number;
      active: boolean;
      placeholder: HTMLDivElement | null;
    } | null = null;

    const clearDropIndicator = () => {
      root.querySelectorAll('[data-dtf-drop-indicator]').forEach((node) => node.remove());
    };

    const showDropIndicator = (sibling: Element, before: boolean) => {
      clearDropIndicator();
      const line = window.document.createElement('div');
      line.dataset.dtfDropIndicator = '1';
      const rect = sibling.getBoundingClientRect();
      line.style.left = `${rect.left}px`;
      line.style.width = `${rect.width}px`;
      line.style.top = `${before ? rect.top : rect.bottom}px`;
      window.document.body.appendChild(line);
    };

    const moveDraggedAmongSiblings = (el: HTMLElement, clientY: number) => {
      const parent = el.parentElement;
      if (!parent) return;
      const siblings = Array.from(parent.children).filter(
        (node) => node !== el && node instanceof HTMLElement &&
          (mode === 'engine' ? node.hasAttribute('data-content-path') : node.hasAttribute('data-content-id'))
      ) as HTMLElement[];
      const pool = siblings.length > 0
        ? siblings
        : (Array.from(parent.children).filter((node) => node !== el) as HTMLElement[]);
      for (const sibling of pool) {
        const rect = sibling.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        if (clientY < mid) {
          showDropIndicator(sibling, true);
          parent.insertBefore(el, sibling);
          return;
        }
      }
      if (pool.length) {
        const last = pool[pool.length - 1];
        showDropIndicator(last, false);
        if (last.nextSibling) parent.insertBefore(el, last.nextSibling);
        else parent.appendChild(el);
      }
    };

    const commitDrag = (el: HTMLElement) => {
      clearDropIndicator();
      el.removeAttribute('data-dtf-dragging');
      if (mode === 'custom') {
        window.parent.postMessage({
          type: 'dtf:custom-html',
          sessionToken,
          path: pagePath,
          html: cleanSerializedHtml(root),
        }, editorOrigin);
        return;
      }
      const path = el.dataset.contentPath || '';
      const parsed = parseEngineArrayMove(path);
      if (!parsed || !el.parentElement) return;
      const peerEls = Array.from(el.parentElement.children).filter((node) => {
        if (!(node instanceof HTMLElement)) return false;
        const peerPath = node.dataset.contentPath || '';
        const peerMove = parseEngineArrayMove(peerPath);
        return Boolean(peerMove && peerMove.arrayPath === parsed.arrayPath);
      }) as HTMLElement[];
      const from = parsed.index;
      const to = peerEls.findIndex((node) => node === el);
      if (to < 0 || from === to) return;
      window.parent.postMessage({
        type: 'dtf:engine-move',
        sessionToken,
        path: parsed.arrayPath,
        from,
        to,
      }, editorOrigin);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if ((event.target as HTMLElement | null)?.closest?.('[data-resize-handle],[data-dtf-resize-overlay]')) return;
      const target = event.target as HTMLElement | null;
      if (!target || target.closest('closet-quote-widget,closet-order-widget,closet-booking-widget,closet-ticket-widget')) return;
      const editable = mode === 'engine'
        ? target.closest<HTMLElement>('[data-content-path]')
        : target.closest<HTMLElement>('[data-content-id]');
      if (!editable || !root.contains(editable)) return;
      // Prefer moving sections/articles/images as whole blocks when nested text is hit.
      const block = editable.closest<HTMLElement>('section,article,header,footer,figure') || editable;
      const moveEl = (mode === 'custom' && block.hasAttribute('data-content-id')) ? block
        : (editable instanceof HTMLImageElement || editable.tagName === 'IMG') ? editable
        : (mode === 'custom' ? editable : editable);
      dragState = {
        el: moveEl,
        startX: event.clientX,
        startY: event.clientY,
        active: false,
        placeholder: null,
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragState) return;
      const dx = event.clientX - dragState.startX;
      const dy = event.clientY - dragState.startY;
      if (!dragState.active) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        dragState.active = true;
        dragState.el.dataset.dtfDragging = '1';
        announceSelection(dragState.el);
      }
      event.preventDefault();
      moveDraggedAmongSiblings(dragState.el, event.clientY);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!dragState) return;
      const { el, active } = dragState;
      dragState = null;
      if (!active) return;
      event.preventDefault();
      event.stopPropagation();
      commitDrag(el);
      announceSelection(el);
    };

    root.addEventListener('click', select, true);
    root.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('pointermove', onPointerMove, true);
    window.addEventListener('pointerup', onPointerUp, true);
    window.addEventListener('pointercancel', onPointerUp, true);
    window.addEventListener('message', command);
    return () => {
      removeResizeOverlay();
      clearDropIndicator();
      root.removeEventListener('click', select, true);
      root.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('pointermove', onPointerMove, true);
      window.removeEventListener('pointerup', onPointerUp, true);
      window.removeEventListener('pointercancel', onPointerUp, true);
      window.removeEventListener('message', command);
      root.removeAttribute('data-content-editor-root');
    };
  }, [engineDocument, mode, pagePath, rootRef]);

  return <style>{`
    [data-content-editor-root="1"] [data-content-path],
    [data-content-editor-root="1"] [data-content-id] { cursor: grab !important; }
    [data-content-editor-root="1"] [data-content-path]:hover,
    [data-content-editor-root="1"] [data-content-id]:hover { outline: 2px dashed #6366f1 !important; outline-offset: 3px; }
    [data-content-editor-root="1"] [data-content-selected="1"] { outline: 3px solid #4f46e5 !important; outline-offset: 3px; }
    [data-content-editor-root="1"] [data-dtf-dragging="1"] { opacity: 0.55 !important; cursor: grabbing !important; }
    [data-dtf-drop-indicator="1"] { position: fixed; z-index: 2147483645; height: 3px; margin-top: -1px; background: #4f46e5; pointer-events: none; box-shadow: 0 0 0 1px rgb(255 255 255 / 70%); }
    [data-dtf-resize-overlay="1"] { position: fixed; z-index: 2147483646; border: 2px solid #4f46e5; pointer-events: none; box-sizing: border-box; }
    [data-dtf-resize-overlay="1"] [data-resize-handle] { position: absolute; width: 14px; height: 14px; padding: 0; border: 2px solid white; border-radius: 999px; background: #4f46e5; pointer-events: auto; touch-action: none; box-shadow: 0 1px 5px rgb(0 0 0 / 45%); }
    [data-resize-handle="nw"] { left: -8px; top: -8px; cursor: nwse-resize; }
    [data-resize-handle="n"] { left: calc(50% - 7px); top: -8px; cursor: ns-resize; }
    [data-resize-handle="ne"] { right: -8px; top: -8px; cursor: nesw-resize; }
    [data-resize-handle="e"] { right: -8px; top: calc(50% - 7px); cursor: ew-resize; }
    [data-resize-handle="se"] { right: -8px; bottom: -8px; cursor: nwse-resize; }
    [data-resize-handle="s"] { left: calc(50% - 7px); bottom: -8px; cursor: ns-resize; }
    [data-resize-handle="sw"] { left: -8px; bottom: -8px; cursor: nesw-resize; }
    [data-resize-handle="w"] { left: -8px; top: calc(50% - 7px); cursor: ew-resize; }
  `}</style>;
}
