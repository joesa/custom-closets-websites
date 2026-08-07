'use client';

import { useEffect, useRef } from 'react';

type EngineDocument = Record<string, unknown>;

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
    if (params.get('content_editor') !== '1') return;
    const editorOriginRaw = params.get('editor_origin');
    const sessionToken = params.get('content_editor_token');
    if (!editorOriginRaw || !sessionToken) return;
    let editorOrigin: string;
    try { editorOrigin = new URL(editorOriginRaw).origin; } catch { return; }
    const root = rootRef.current;
    if (!root) return;
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
      const images = Array.from(root.querySelectorAll<HTMLImageElement>('img'));
      for (const mapping of mappings.filter((item) => /(?:image|logo)/i.test(item.path))) {
        const match = images.find((image) => {
          return renderedImagePath(image.currentSrc || image.src) === renderedImagePath(mapping.value);
        });
        if (match) match.dataset.contentPath = mapping.path;
      }
    } else if (mode === 'custom') {
      let sequence = 0;
      root.querySelectorAll<HTMLElement>('section,article,header,footer,h1,h2,h3,h4,h5,h6,p,a,li,img,figcaption,blockquote').forEach((node) => {
        if (!node.dataset.contentId) node.dataset.contentId = `content-${++sequence}`;
      });
    }

    const select = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || target.closest('closet-quote-widget,closet-order-widget,closet-booking-widget,closet-ticket-widget')) return;
      const editable = mode === 'engine'
        ? target.closest<HTMLElement>('[data-content-path]')
        : target.closest<HTMLElement>('[data-content-id]');
      if (!editable || !root.contains(editable)) return;
      event.preventDefault();
      event.stopPropagation();
      selectedRef.current?.removeAttribute('data-content-selected');
      selectedRef.current = editable;
      editable.dataset.contentSelected = '1';
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
      }, editorOrigin);
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
        if (selected instanceof HTMLImageElement) {
          selected.src = next;
          selected.removeAttribute('srcset');
        } else if (selected instanceof HTMLAnchorElement && /^(https?:\/\/|\/|#|mailto:|tel:)/i.test(next)) {
          selected.href = next;
        } else {
          selected.textContent = next;
        }
      } else if (action === 'setAlt' && selected instanceof HTMLImageElement) {
        selected.alt = String(event.data.value || '');
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

    root.addEventListener('click', select, true);
    window.addEventListener('message', command);
    return () => {
      root.removeEventListener('click', select, true);
      window.removeEventListener('message', command);
      root.removeAttribute('data-content-editor-root');
    };
  }, [engineDocument, mode, pagePath, rootRef]);

  return <style>{`
    [data-content-editor-root="1"] [data-content-path],
    [data-content-editor-root="1"] [data-content-id] { cursor: pointer !important; }
    [data-content-editor-root="1"] [data-content-path]:hover,
    [data-content-editor-root="1"] [data-content-id]:hover { outline: 2px dashed #6366f1 !important; outline-offset: 3px; }
    [data-content-editor-root="1"] [data-content-selected="1"] { outline: 3px solid #4f46e5 !important; outline-offset: 3px; }
  `}</style>;
}
