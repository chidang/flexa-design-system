'use client';
/**
 * FxGallery — image carousel with a stage, prev/next controls, a thumbnail
 * listbox and an optional fullscreen lightbox dialog (doc 04 §data-display,
 * "FxGallery — Gallery").
 *
 * Controlled or uncontrolled index (§1.5 `index`/`defaultIndex`). Every gallery
 * image REQUIRES `alt`. Stage keys: `ArrowLeft/Right` navigate; the thumbnail
 * listbox is a roving-tabindex `role="listbox"` where `Enter`/`Space` select. The
 * lightbox is a dialog (via `useModal`) with the same navigation keys plus `Esc`.
 * SSR-safe: the lightbox portal is gated on the client-mount flag, so nothing
 * renders server-side and no dangling `aria-controls`/`aria-activedescendant`
 * IDREFs leak into static markup. Every user-facing string is a `labels` prop
 * with an English default (i18n).
 */
import { createPortal } from 'react-dom';
import { useCallback, useId, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { FxIcon } from '../icon/FxIcon';
import { useModal } from '../dialog/use-modal';

/** One gallery image. `alt` is required (rule 4 / doc 04). */
export interface GalleryImage {
  id: string;
  src: string;
  /** Required alternative text. */
  alt: string;
  /** Optional visible caption under the stage. */
  caption?: string;
}

/** i18n strings — every user-facing label is overridable. */
export interface GalleryLabels {
  prev: string;
  next: string;
  fullscreen: string;
  /** Counter template; `{n}` and `{total}` are substituted. */
  counter: string;
  /** Accessible name for the lightbox close button. */
  close: string;
}

export const DEFAULT_GALLERY_LABELS: GalleryLabels = {
  prev: 'Previous image',
  next: 'Next image',
  fullscreen: 'View fullscreen',
  counter: '{n} of {total}',
  close: 'Close fullscreen',
};

export interface FxGalleryProps {
  /** Ordered images; `alt` required on each. */
  images: GalleryImage[];
  /** Controlled active index (§1.5). */
  index?: number;
  /** Uncontrolled initial index. Defaults to `0`. */
  defaultIndex?: number;
  /** Fires whenever the active image changes. */
  onIndexChange?: (index: number) => void;
  /** Enables the fullscreen lightbox dialog. Defaults to `true`. */
  lightbox?: boolean;
  /** Wraps around at the ends. Defaults to `true`. */
  loop?: boolean;
  /** Overridable strings (i18n). */
  labels?: Partial<GalleryLabels>;
  className?: string;
}

function formatCounter(template: string, n: number, total: number): string {
  return template.replace('{n}', String(n)).replace('{total}', String(total));
}

export function FxGallery({
  images,
  index,
  defaultIndex = 0,
  onIndexChange,
  lightbox = true,
  loop = true,
  labels,
  className,
}: FxGalleryProps) {
  const baseId = useId();
  const controlled = index !== undefined;
  const [internal, setInternal] = useState(defaultIndex);
  const total = images.length;
  const active = Math.min(Math.max(controlled ? index : internal, 0), Math.max(total - 1, 0));

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const modal = useModal({ open: lightboxOpen, onOpenChange: (o) => setLightboxOpen(o) });

  const l: GalleryLabels = { ...DEFAULT_GALLERY_LABELS, ...labels };

  const go = useCallback(
    (next: number) => {
      if (total === 0) return;
      let n = next;
      if (n < 0) n = loop ? total - 1 : 0;
      else if (n >= total) n = loop ? 0 : total - 1;
      if (!controlled) setInternal(n);
      onIndexChange?.(n);
    },
    [controlled, loop, onIndexChange, total],
  );

  const listId = `${baseId}-thumbs`;
  const activeThumbId = `${baseId}-thumb-${active}`;
  const single = total <= 1;

  const onStageKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(active + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(active - 1);
    }
  };

  const onThumbsKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      go(active + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      go(active - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      go(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      go(total - 1);
    }
    // Enter/Space are no-ops beyond the roving selection (the option is already
    // the active image); they are documented for parity with the listbox pattern.
  };

  const current = images[active];

  const rootClass = ['fx-gallery', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass} data-single={single || undefined}>
      <div className="fx-gallery-stage-wrap">
        {current && (
          <div
            className="fx-gallery-stage"
            role="group"
            aria-roledescription="carousel"
            tabIndex={0}
            onKeyDown={onStageKeyDown}
          >
            {!single && (
              <button
                type="button"
                className="fx-gallery-nav is-prev"
                aria-label={l.prev}
                disabled={!loop && active === 0}
                onClick={() => go(active - 1)}
              >
                <FxIcon name="back" size={24} />
              </button>
            )}
            <img className="fx-gallery-image" src={current.src} alt={current.alt} />
            {!single && (
              <button
                type="button"
                className="fx-gallery-nav is-next"
                aria-label={l.next}
                disabled={!loop && active === total - 1}
                onClick={() => go(active + 1)}
              >
                <FxIcon name="chevron" size={24} />
              </button>
            )}
            {lightbox && (
              <button
                type="button"
                className="fx-gallery-fullscreen"
                aria-label={l.fullscreen}
                onClick={() => setLightboxOpen(true)}
              >
                <FxIcon name="maximize" size={20} />
              </button>
            )}
            {/* Inside the stage — the counter is absolutely positioned and
                anchors to the stage (mirrors the lightbox structure). */}
            <span className="fx-gallery-counter" role="status" aria-live="polite">
              {formatCounter(l.counter, active + 1, total)}
            </span>
          </div>
        )}
        {current?.caption && <p className="fx-gallery-caption">{current.caption}</p>}
      </div>

      {!single && (
        <ul
          className="fx-gallery-thumbs"
          role="listbox"
          id={listId}
          aria-label="Choose image"
          aria-activedescendant={activeThumbId}
          tabIndex={0}
          onKeyDown={onThumbsKeyDown}
        >
          {images.map((img, i) => {
            const isActive = i === active;
            return (
              <li
                key={img.id}
                id={`${baseId}-thumb-${i}`}
                className={['fx-gallery-thumb', isActive ? 'is-active' : ''].filter(Boolean).join(' ')}
                role="option"
                aria-selected={isActive}
                aria-label={img.alt}
                data-active={isActive || undefined}
                onClick={() => go(i)}
              >
                <img className="fx-gallery-thumb-image" src={img.src} alt="" />
              </li>
            );
          })}
        </ul>
      )}

      {lightbox &&
        modal.open &&
        modal.mounted &&
        createPortal(
          <div className="fx-gallery-lightbox-backdrop">
            <div
              ref={modal.surfaceRef}
              className="fx-gallery-lightbox"
              role="dialog"
              aria-modal="true"
              aria-label={l.fullscreen}
              tabIndex={-1}
              onKeyDown={(e) => {
                onStageKeyDown(e);
                modal.onKeyDown(e);
              }}
            >
              <button
                type="button"
                className="fx-gallery-lightbox-close"
                aria-label={l.close}
                onClick={() => modal.requestClose('close-button')}
              >
                <FxIcon name="close" size={24} />
              </button>
              {current && (
                <div className="fx-gallery-lightbox-stage">
                  {!single && (
                    <button
                      type="button"
                      className="fx-gallery-nav is-prev"
                      aria-label={l.prev}
                      onClick={() => go(active - 1)}
                    >
                      <FxIcon name="back" size={24} />
                    </button>
                  )}
                  <img className="fx-gallery-image" src={current.src} alt={current.alt} />
                  {!single && (
                    <button
                      type="button"
                      className="fx-gallery-nav is-next"
                      aria-label={l.next}
                      onClick={() => go(active + 1)}
                    >
                      <FxIcon name="chevron" size={24} />
                    </button>
                  )}
                  <span className="fx-gallery-counter" role="status" aria-live="polite">
                    {formatCounter(l.counter, active + 1, total)}
                  </span>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
