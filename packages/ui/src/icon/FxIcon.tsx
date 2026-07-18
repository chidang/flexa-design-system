/**
 * FxIcon — the one wrapper every icon renders through (doc 13 D-3).
 *
 * Sizes are clamped to the canonical ladder 16 / 20 / 24 (02 foundations
 * §icons). Icons are decorative by default (`aria-hidden`); passing `label`
 * promotes the glyph to an image with an accessible name — the escape hatch for
 * icon-only controls, which the a11y gate requires to carry one.
 */
import { ICON_MAP, type IconName } from './map';

/** Canonical icon sizes (02 foundations §icons). */
export type IconSize = 16 | 20 | 24;

export interface FxIconProps {
  /** Canonical icon name (see `src/icon/map.ts`). */
  name: IconName;
  /** 16 (inline) · 20 (default UI) · 24 (standalone/touch). */
  size?: IconSize;
  /** Accessible name. Omit for decorative icons (they render `aria-hidden`). */
  label?: string;
  className?: string;
}

export function FxIcon({ name, size = 20, label, className }: FxIconProps) {
  const Glyph = ICON_MAP[name];
  const decorative = label === undefined;
  return (
    <Glyph
      className={className ? `fx-icon ${className}` : 'fx-icon'}
      width={size}
      height={size}
      strokeWidth={2}
      focusable={false}
      aria-hidden={decorative || undefined}
      role={decorative ? undefined : 'img'}
      aria-label={label}
    />
  );
}
