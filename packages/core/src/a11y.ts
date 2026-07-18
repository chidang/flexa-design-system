/**
 * Document-level accessibility gate (Phase 6, slice 1) — NOT a frozen engine.
 *
 * `validateManifest` (manifest.ts) gates a single element; this walks a whole
 * node tree and enforces a11y invariants that only make sense across a document:
 * a single h1, no heading-level skips, required alt text, no orphaned heading
 * outline, and unique landmarks. Elements DECLARE their a11y semantics in the
 * manifest (`a11y.heading` / `a11y.image` / `a11y.landmark`), so the gate is
 * data-driven — "accessibility là ràng buộc trong schema" (01-vision §6). An
 * undeclared element type simply doesn't participate.
 *
 * Pure + no-throw: returns structured findings (code + severity + nodeId) so the
 * editor can highlight the offending node and the CLI can gate on `error`.
 */

import type { A11ySpec, FlexaNode, Json, Settings } from './types.js';
import type { ElementRegistry } from './registry.js';

export interface A11yFinding {
  code: 'multiple-h1' | 'heading-skip' | 'missing-alt' | 'missing-h1' | 'multiple-landmark';
  severity: 'error' | 'warning';
  nodeId: string;
  message: string;
}

/**
 * ARIA landmarks that must appear at most once per page. `nav`, `complementary`,
 * `region`, `form`, `search` may legitimately repeat (with distinct labels) so
 * they're collected but not gated for uniqueness.
 */
const UNIQUE_LANDMARKS = new Set(['main', 'banner', 'contentinfo']);

/** Parse a declared heading level: `3`, `'3'`, `'h3'` → 3; otherwise null. */
function parseLevel(raw: Json | undefined): number | null {
  if (typeof raw === 'number') return Number.isInteger(raw) && raw >= 1 && raw <= 6 ? raw : null;
  if (typeof raw === 'string') {
    const m = /^h?([1-6])$/.exec(raw.trim());
    return m ? Number(m[1]) : null;
  }
  return null;
}

/** Level a heading node renders at, from its manifest declaration + settings. */
function headingLevel(a11y: A11ySpec, settings: Settings): number | null {
  const h = a11y.heading;
  if (!h) return null;
  if (h.level !== undefined) return parseLevel(h.level);
  if (h.levelFrom !== undefined) return parseLevel(settings[h.levelFrom]);
  return null;
}

/** Image src/alt setting names, honoring the legacy `requiresAlt` boolean. */
function imageFields(a11y: A11ySpec): { srcSetting: string; altSetting: string } | null {
  if (a11y.image) return a11y.image;
  if (a11y.requiresAlt) return { srcSetting: 'src', altSetting: 'alt' };
  return null;
}

/**
 * Landmark role a node renders, from its manifest declaration + settings. A static
 * `landmark` wins; `landmarkFrom` (E2 — mirror of heading.levelFrom) reads the role
 * from a setting so one element (e.g. a section) can opt into any landmark. An
 * empty/absent setting means "not a landmark".
 */
function landmarkRole(a11y: A11ySpec, settings: Settings): string | null {
  if (typeof a11y.landmark === 'string' && a11y.landmark.trim() !== '') return a11y.landmark.trim();
  if (typeof a11y.landmarkFrom === 'string') {
    const raw = settings[a11y.landmarkFrom];
    if (typeof raw === 'string' && raw.trim() !== '') return raw.trim();
  }
  return null;
}

function isNonEmpty(v: Json | undefined): boolean {
  return typeof v === 'string' ? v.trim() !== '' : v !== undefined && v !== null;
}

/**
 * Walk a document tree and report a11y violations. `registry` resolves a node's
 * type → manifest so declared a11y semantics can be read. Traversal is pre-order
 * (= DOM/visual order, since children render in array order), which is what
 * heading-hierarchy checks need.
 */
export function validateDocument(root: FlexaNode, registry: ElementRegistry): A11yFinding[] {
  const findings: A11yFinding[] = [];
  const headings: Array<{ nodeId: string; level: number }> = [];
  const landmarks: Array<{ nodeId: string; role: string }> = [];

  const walk = (node: FlexaNode): void => {
    const a11y = registry.get(node.type)?.a11y;
    if (a11y) {
      const settings = node.settings ?? {};

      const level = headingLevel(a11y, settings);
      if (level !== null) headings.push({ nodeId: node.id, level });

      const landmark = landmarkRole(a11y, settings);
      if (landmark !== null) landmarks.push({ nodeId: node.id, role: landmark });

      const img = imageFields(a11y);
      if (img && isNonEmpty(settings[img.srcSetting]) && !isNonEmpty(settings[img.altSetting])) {
        findings.push({
          code: 'missing-alt',
          severity: 'error',
          nodeId: node.id,
          message: `image has a source ("${img.srcSetting}") but empty alt text ("${img.altSetting}")`,
        });
      }

      // Repeater images (e.g. a gallery): gate alt per entry, not just top-level.
      const items = a11y.imageItems;
      if (items) {
        const list = settings[items.setting];
        if (Array.isArray(list)) {
          list.forEach((entry, i) => {
            if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return;
            const e = entry as Record<string, Json>;
            if (isNonEmpty(e[items.srcField]) && !isNonEmpty(e[items.altField])) {
              findings.push({
                code: 'missing-alt',
                severity: 'error',
                nodeId: node.id,
                message: `image #${i + 1} in "${items.setting}" has a source ("${items.srcField}") but empty alt text ("${items.altField}")`,
              });
            }
          });
        }
      }
    }
    for (const child of node.children ?? []) walk(child);
  };
  walk(root);

  // Heading gate: at most one h1; no skip when going deeper (h1 → h3).
  let seenH1 = false;
  let prevLevel: number | null = null;
  for (const h of headings) {
    if (h.level === 1) {
      if (seenH1) {
        findings.push({
          code: 'multiple-h1',
          severity: 'error',
          nodeId: h.nodeId,
          message: 'more than one <h1> on the page — a page must have a single h1',
        });
      }
      seenH1 = true;
    }
    if (prevLevel !== null && h.level - prevLevel > 1) {
      findings.push({
        code: 'heading-skip',
        severity: 'warning',
        nodeId: h.nodeId,
        message: `heading level skips from h${prevLevel} to h${h.level} — don't skip levels`,
      });
    }
    prevLevel = h.level;
  }

  // Missing-h1 (warning): the page has a heading outline but no top-level h1 —
  // the highest heading should be the h1. We only flag when headings EXIST but
  // none is h1; a page with no heading elements at all may legitimately get its
  // h1 from the theme/host, so that case is left alone (deliberately not noisy).
  if (headings.length > 0 && !seenH1) {
    findings.push({
      code: 'missing-h1',
      severity: 'warning',
      nodeId: headings[0]!.nodeId,
      message: 'the page has headings but no <h1> — the top-level heading should be an h1',
    });
  }

  // Multiple-landmark (warning): main/banner/contentinfo must be unique per page.
  const seenLandmark = new Set<string>();
  for (const l of landmarks) {
    if (!UNIQUE_LANDMARKS.has(l.role)) continue;
    if (seenLandmark.has(l.role)) {
      findings.push({
        code: 'multiple-landmark',
        severity: 'warning',
        nodeId: l.nodeId,
        message: `more than one "${l.role}" landmark — this landmark must be unique on the page`,
      });
    }
    seenLandmark.add(l.role);
  }

  return findings;
}
