/**
 * The recipe explorer's data and its build-time CSS generation.
 *
 * A "recipe" is the Builder's variant-composition mechanism (Track B, doc 20):
 * pure DATA — `base` + `variants` + `compound` + `default` fragments — that the
 * frozen pipeline turns into a StyleSpec by the props you choose, then into CSS.
 * NO React component is shipped: the recipe is data, and the CSS below is
 * produced by the SAME `recipeToSpec` → `resolveStyleTokens` → `compileCss`
 * the render engine runs. So the snippet a reader copies is exactly what the
 * system emits, every value a token.
 *
 * Two gates keep each recipe honest, dogfooded on the page:
 *   • `findUnknownStyleTokens` on the merged spec — a token-namespace path that
 *     is not a real token (a typo'd `color.nope`) is flagged BEFORE resolution;
 *   • `usedTokens` on the compiled CSS — every `--fx-*` reference must be a
 *     registry token (reused from the example dashboard).
 * Custom properties (`--btn-bg`) are plumbing, not tokens, so they carry the
 * chosen colour without multiplying variants — and the `--fx-*` scan ignores
 * them by construction.
 */
import type { Recipe, Settings } from '@flexa/core';
import { compileCss, DEFAULT_BREAKPOINTS, recipeToSpec } from '@flexa/core';
import { findUnknownStyleTokens, resolveStyleTokens } from 'flexa-design-system';
import { usedTokens, type TokenUsage } from './example';

export interface RecipeInstance {
  /** Displayed inside the rendered element. */
  label: string;
  /** A second line — only used by the block-level recipes (alert/card). */
  note?: string;
  /** The chosen option per variant dimension. */
  settings: Settings;
}

export interface RecipeDemo {
  name: string;
  title: string;
  blurb: string;
  /** The element the recipe styles. */
  tag: 'button' | 'span' | 'div';
  recipe: Recipe;
  instances: RecipeInstance[];
}

/* ── Button: custom-prop tone × size × solid/outline ─────────────────────── */

const BUTTON: Recipe = {
  base: {
    '&': {
      '--btn-bg': 'color.primary',
      '--btn-fg': 'color.on-primary',
      display: 'inline-flex',
      'align-items': 'center',
      'justify-content': 'center',
      gap: 'space.2',
      border: '1px solid transparent',
      'border-radius': 'radius.md',
      'font-family': 'font.family-base',
      cursor: 'pointer',
      color: 'var(--btn-fg)',
      background: 'var(--btn-bg)',
    },
  },
  variants: {
    tone: {
      primary: { '&': { '--btn-bg': 'color.primary', '--btn-fg': 'color.on-primary' } },
      danger: { '&': { '--btn-bg': 'color.danger', '--btn-fg': 'color.on-danger' } },
      neutral: { '&': { '--btn-bg': 'color.surface-alt', '--btn-fg': 'color.text' } },
    },
    size: {
      sm: { '&': { padding: 'space.1 space.3' } },
      md: { '&': { padding: 'space.2 space.5' } },
      lg: { '&': { padding: 'space.3 space.6' } },
    },
    variant: {
      solid: {},
      // Outline reuses the tone's --btn-bg as ink and border — one fragment
      // covers every tone, no per-combination compound needed.
      outline: {
        '&': { background: 'transparent', color: 'var(--btn-bg)', 'border-color': 'var(--btn-bg)' },
      },
    },
  },
  default: { tone: 'primary', size: 'md', variant: 'solid' },
};

/* ── Badge: tone pill ────────────────────────────────────────────────────── */

const BADGE: Recipe = {
  base: {
    '&': {
      '--bdg-bg': 'color.surface-alt',
      '--bdg-fg': 'color.text',
      display: 'inline-flex',
      'align-items': 'center',
      padding: 'space.1 space.3',
      'border-radius': 'radius.full',
      'font-family': 'font.family-base',
      color: 'var(--bdg-fg)',
      background: 'var(--bdg-bg)',
    },
  },
  variants: {
    tone: {
      neutral: { '&': { '--bdg-bg': 'color.surface-alt', '--bdg-fg': 'color.text' } },
      success: { '&': { '--bdg-bg': 'color.success', '--bdg-fg': 'color.on-success' } },
      warning: { '&': { '--bdg-bg': 'color.warning', '--bdg-fg': 'color.on-warning' } },
      info: { '&': { '--bdg-bg': 'color.info', '--bdg-fg': 'color.on-info' } },
    },
  },
  default: { tone: 'neutral' },
};

/* ── Alert: tone accent bar ──────────────────────────────────────────────── */

const ALERT: Recipe = {
  base: {
    '&': {
      '--alt-accent': 'color.info',
      display: 'flex',
      'flex-direction': 'column',
      gap: 'space.1',
      padding: 'space.4 space.5',
      'border-radius': 'radius.md',
      'border-left': '3px solid var(--alt-accent)',
      background: 'color.surface-alt',
      color: 'color.text',
    },
  },
  variants: {
    tone: {
      info: { '&': { '--alt-accent': 'color.info' } },
      success: { '&': { '--alt-accent': 'color.success' } },
      warning: { '&': { '--alt-accent': 'color.warning' } },
      danger: { '&': { '--alt-accent': 'color.danger' } },
    },
  },
  default: { tone: 'info' },
};

/* ── Card: elevate × tone, with a compound ───────────────────────────────── */

const CARD: Recipe = {
  base: {
    '&': {
      display: 'flex',
      'flex-direction': 'column',
      gap: 'space.2',
      padding: 'space.5',
      background: 'color.surface',
      border: '1px solid color.border',
      'border-radius': 'radius.lg',
    },
  },
  variants: {
    elevate: {
      flat: {},
      raised: { '&': { 'box-shadow': 'shadow.md' } },
    },
    tone: {
      plain: {},
      accent: { '&': { 'border-color': 'color.primary' } },
    },
  },
  // A raised, accented card lifts the shadow AND keeps the accent border — the
  // one case a flat option list can't express, which is what `compound` is for.
  compound: [
    {
      when: { elevate: 'raised', tone: 'accent' },
      style: { '&': { 'box-shadow': 'shadow.md', 'border-color': 'color.primary' } },
    },
  ],
  default: { elevate: 'flat', tone: 'plain' },
};

export const RECIPE_DEMOS: RecipeDemo[] = [
  {
    name: 'button',
    title: 'Button',
    blurb:
      'Tone, size and a solid/outline variant. The tone is factored into a --btn-bg custom property, so outline reuses it as ink for any tone without a per-combination rule.',
    tag: 'button',
    recipe: BUTTON,
    instances: [
      { label: 'Primary', settings: { tone: 'primary' } },
      { label: 'Danger', settings: { tone: 'danger' } },
      { label: 'Neutral', settings: { tone: 'neutral' } },
      { label: 'Outline', settings: { tone: 'primary', variant: 'outline' } },
      { label: 'Small', settings: { tone: 'primary', size: 'sm' } },
    ],
  },
  {
    name: 'badge',
    title: 'Badge',
    blurb: 'A status pill in four tones — each tone is a paired fill/on-colour from the token set.',
    tag: 'span',
    recipe: BADGE,
    instances: [
      { label: 'Neutral', settings: { tone: 'neutral' } },
      { label: 'Success', settings: { tone: 'success' } },
      { label: 'Warning', settings: { tone: 'warning' } },
      { label: 'Info', settings: { tone: 'info' } },
    ],
  },
  {
    name: 'alert',
    title: 'Alert',
    blurb: 'A message block with a tone accent bar — the accent is a custom property re-pointed per tone.',
    tag: 'div',
    recipe: ALERT,
    instances: [
      { label: 'Heads up', note: 'An informational message.', settings: { tone: 'info' } },
      { label: 'All done', note: 'Your changes were saved.', settings: { tone: 'success' } },
      { label: 'Careful', note: 'This action needs review.', settings: { tone: 'warning' } },
      { label: 'Blocked', note: 'Something went wrong.', settings: { tone: 'danger' } },
    ],
  },
  {
    name: 'card',
    title: 'Card',
    blurb:
      'Elevation and an accent border as independent dimensions, with a compound rule for the raised-and-accented case.',
    tag: 'div',
    recipe: CARD,
    instances: [
      { label: 'Flat', note: 'Default surface card.', settings: {} },
      { label: 'Raised', note: 'Lifted with a shadow.', settings: { elevate: 'raised' } },
      { label: 'Accent', note: 'Primary border.', settings: { tone: 'accent' } },
      { label: 'Raised + accent', note: 'The compound case.', settings: { elevate: 'raised', tone: 'accent' } },
    ],
  },
];

export interface RecipeBuild {
  /** The compiled, token-resolved CSS for every shown instance (scoped by class). */
  css: string;
  /** `--fx-*` proof (must have no unknowns) plus any off-system token-namespace path. */
  usage: TokenUsage;
  /** The recipe itself, pretty-printed — the "it's just data" proof. */
  recipeJson: string;
}

/**
 * Run each instance through the real pipeline and concatenate the scoped CSS.
 * The `unknown` list unions both gates: a `--fx-*` that is not a registry token
 * AND a bare token-namespace path that never resolved (a typo). Either would
 * surface on the page as a failure.
 */
export function buildRecipe(demo: RecipeDemo): RecipeBuild {
  const blocks: string[] = [];
  const offSystem = new Set<string>();
  demo.instances.forEach((inst, i) => {
    const spec = recipeToSpec(demo.recipe, inst.settings);
    if (!spec) return;
    for (const bad of findUnknownStyleTokens(spec)) offSystem.add(bad);
    const css = compileCss(resolveStyleTokens(spec), {}, {
      scope: `.rx-${demo.name}-${i}`,
      breakpoints: DEFAULT_BREAKPOINTS,
    });
    if (css) blocks.push(css);
  });
  const css = blocks.join('\n');
  const scan = usedTokens(css);
  return {
    css,
    usage: { used: scan.used, unknown: [...new Set([...scan.unknown, ...offSystem])].sort() },
    recipeJson: JSON.stringify(demo.recipe, null, 2),
  };
}
