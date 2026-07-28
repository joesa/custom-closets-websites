'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  siteRef: React.RefObject<HTMLDivElement | null>;
  tenantId: string;
  pagePath: string;
  apiBaseUrl: string;
  editToken: string | null;
};

function isEditableTarget(el: Element | null): el is HTMLElement {
  if (!el || !(el instanceof HTMLElement)) return false;
  if (
    el.closest(
      'closet-quote-widget, closet-order-widget, closet-booking-widget, closet-ticket-widget'
    )
  ) {
    return false;
  }
  if (el.closest('script, style, noscript')) return false;
  if (el.closest('.lightbox-toggle, input, button, select, textarea')) return false;
  return true;
}

function wrapImgForLightbox(imgHtml: string, useLightbox: boolean): string {
  if (!useLightbox) return imgHtml;
  return `<label class="img-lightbox"><input type="checkbox" class="lightbox-toggle" aria-label="Enlarge image">${imgHtml}</label>`;
}

function tokenStorageKey(tenantId: string) {
  return `eip-token:${tenantId}`;
}

/**
 * Admin-only overlay: click text to edit, click images to replace/remove,
 * Save posts serialized HTML to the dashboard edit-in-place save API.
 *
 * Keeps a dirtyHtml buffer so Save never depends on React re-seeding
 * dangerouslySetInnerHTML (which would wipe contenteditable changes).
 */
export default function EditInPlaceLayer({
  siteRef,
  tenantId,
  pagePath,
  apiBaseUrl,
  editToken,
}: Props) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [resolvedToken, setResolvedToken] = useState<string | null>(editToken);
  const dirtyHtmlRef = useRef<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceImgRef = useRef<HTMLImageElement | null>(null);
  const addModeRef = useRef(false);

  useEffect(() => {
    if (editToken) {
      try {
        sessionStorage.setItem(tokenStorageKey(tenantId), editToken);
      } catch {
        /* ignore */
      }
      setResolvedToken(editToken);
      return;
    }
    try {
      setResolvedToken(sessionStorage.getItem(tokenStorageKey(tenantId)));
    } catch {
      setResolvedToken(null);
    }
  }, [editToken, tenantId]);

  const authHeaders = useCallback((): HeadersInit => {
    const h: Record<string, string> = {};
    if (resolvedToken) h.Authorization = `Bearer ${resolvedToken}`;
    return h;
  }, [resolvedToken]);

  const captureHtml = useCallback(() => {
    const el = siteRef.current;
    if (!el) return dirtyHtmlRef.current || '';
    const html = el.innerHTML;
    dirtyHtmlRef.current = html;
    return html;
  }, [siteRef]);

  const save = useCallback(async () => {
    if (!tenantId || !apiBaseUrl) {
      setStatus('error');
      setMessage('Missing tenant or API URL');
      return;
    }
    if (!resolvedToken) {
      setStatus('error');
      setMessage('Missing edit token — reopen from admin Custom build.');
      return;
    }
    const html = captureHtml();
    if (!html.trim()) {
      setStatus('error');
      setMessage('Nothing to save — page HTML was empty.');
      return;
    }
    setStatus('saving');
    setMessage('Saving…');
    try {
      const res = await fetch(
        `${apiBaseUrl.replace(/\/$/, '')}/api/admin/sites/${tenantId}/edit-in-place/save`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({ path: pagePath, html }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Save failed (${res.status})`);
      setStatus('saved');
      setMessage(
        `Saved (${json.htmlLength ?? html.length} chars). Hard-refresh if needed — then turn OFF Edit in place in admin.`
      );
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Save failed');
    }
  }, [
    apiBaseUrl,
    authHeaders,
    captureHtml,
    pagePath,
    resolvedToken,
    tenantId,
  ]);

  const uploadImage = useCallback(
    async (file: File): Promise<string> => {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(
        `${apiBaseUrl.replace(/\/$/, '')}/api/admin/sites/${tenantId}/edit-in-place/upload`,
        {
          method: 'POST',
          headers: authHeaders(),
          body: form,
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Upload failed (${res.status})`);
      if (typeof json.url !== 'string') throw new Error('Upload returned no URL');
      return json.url;
    },
    [apiBaseUrl, authHeaders, tenantId]
  );

  useEffect(() => {
    const root = siteRef.current;
    if (!root) return;

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!isEditableTarget(target)) return;
      if (!root.contains(target)) return;

      const img = target.closest('img');
      if (img && root.contains(img)) {
        event.preventDefault();
        event.stopPropagation();
        const action = window.prompt(
          'Image actions: type "replace", "remove", or Cancel',
          'replace'
        );
        if (!action) return;
        const a = action.trim().toLowerCase();
        if (a === 'remove' || a === 'delete') {
          const wrap = img.closest('label.img-lightbox');
          ;(wrap || img).remove();
          captureHtml();
          setStatus('idle');
          setMessage('Image removed — click Save.');
          return;
        }
        if (a === 'replace' || a === 'r') {
          replaceImgRef.current = img as HTMLImageElement;
          addModeRef.current = false;
          fileRef.current?.click();
        }
        return;
      }

      let el: HTMLElement | null = target as HTMLElement;
      if (el.tagName === 'IMG') return;
      const block = el.closest(
        'p, h1, h2, h3, h4, h5, h6, li, span, a, figcaption, blockquote, td, th, label'
      ) as HTMLElement | null;
      el = block || el;
      if (!el || !root.contains(el)) return;
      if (el.isContentEditable) return;
      if (el.closest('.svc-drawer-wrap .side-drawer')) return;

      event.preventDefault();
      el.contentEditable = 'true';
      el.classList.add('eip-editing');
      el.focus();

      const finish = (commit: boolean) => {
        el!.contentEditable = 'false';
        el!.classList.remove('eip-editing');
        el!.removeEventListener('keydown', onKey);
        el!.removeEventListener('blur', onBlur);
        if (commit) {
          captureHtml();
          setStatus('idle');
          setMessage('Text updated — click Save.');
        }
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          finish(false);
        }
        if (
          e.key === 'Enter' &&
          !e.shiftKey &&
          el!.tagName !== 'P' &&
          el!.tagName !== 'LI'
        ) {
          e.preventDefault();
          finish(true);
        }
      };
      const onBlur = () => finish(true);
      el.addEventListener('keydown', onKey);
      el.addEventListener('blur', onBlur);
    };

    root.addEventListener('click', onClick, true);
    return () => root.removeEventListener('click', onClick, true);
  }, [captureHtml, siteRef]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setStatus('saving');
      setMessage('Uploading image…');
      const url = await uploadImage(file);
      const site = siteRef.current;
      const useLightbox = Boolean(site?.querySelector('.img-lightbox'));
      if (addModeRef.current && site) {
        const tmp = document.createElement('div');
        tmp.innerHTML = wrapImgForLightbox(
          `<img src="${url}" alt="" style="max-width:100%;height:auto;" />`,
          useLightbox
        );
        const node = tmp.firstElementChild;
        if (node) site.appendChild(node);
        setMessage('Image added — click Save.');
      } else if (replaceImgRef.current) {
        replaceImgRef.current.src = url;
        replaceImgRef.current.removeAttribute('srcset');
        setMessage('Image replaced — click Save.');
      }
      captureHtml();
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      replaceImgRef.current = null;
      addModeRef.current = false;
    }
  };

  return (
    <>
      <div className="sticky top-0 z-[10000] bg-amber-500 text-black px-4 py-2 flex flex-wrap items-center gap-3 shadow-lg">
        <span className="text-sm font-bold tracking-wide">
          EDIT IN PLACE — public site offline
        </span>
        <button
          type="button"
          onClick={() => void save()}
          disabled={status === 'saving' || !resolvedToken}
          className="px-3 py-1 rounded bg-black text-amber-300 text-xs font-semibold disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => {
            addModeRef.current = true;
            replaceImgRef.current = null;
            fileRef.current?.click();
          }}
          className="px-3 py-1 rounded bg-black/80 text-white text-xs font-semibold"
        >
          Add image
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-3 py-1 rounded bg-black/80 text-white text-xs font-semibold"
        >
          Reload
        </button>
        <span className="text-xs opacity-90 flex-1 min-w-[12rem]">
          Click text to edit · click image → replace/remove · Save when done · turn OFF in admin
        </span>
        {message ? (
          <span
            className={`text-xs font-medium ${
              status === 'error' ? 'text-red-900' : 'text-black/80'
            }`}
          >
            {message}
          </span>
        ) : null}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(ev) => void onFile(ev)}
      />
      <style>{`
        [data-custom-site] .eip-editing {
          outline: 2px solid #f59e0b !important;
          outline-offset: 2px;
        }
        [data-custom-site] img { cursor: pointer; }
      `}</style>
    </>
  );
}
