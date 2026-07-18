/**
 * The px allowlist enforced by `tests/token-discipline.spec.ts`.
 *
 * Component CSS must express spacing, colour and radius through `var(--fx-*)`
 * tokens — never a raw hex/rgb/hsl literal, and never an off-ladder px value.
 * A handful of px values ARE canonical fixed dimensions from the README + docs
 * 02/04 layout tables (control heights, touch target, overlay widths, chrome
 * bars); those live here as the single allowlist the gate reads. Hairline
 * borders and focus rings (0–3px) are permitted as canonical fixed dimensions;
 * FDS does ship a border-width tier (`--fx-border-0/1/2/4/8`) — converging the
 * kit onto it is a deliberate future slice, not this gate's job.
 *
 * Adding a value here is a deliberate act: it means "this px is a canonical
 * fixed dimension, not a spacing choice that should have been a token".
 */
export const ALLOWED_PX: readonly number[] = [
  // hairlines / rings (canonical fixed dimensions; FDS border tier convergence deferred)
  0, 1, 2, 3,
  // hover-lift offset — translateY(-2px), the kit's one canonical lift (04 §2.48)
  -2,
  // control heights (doc 04 §sizes) + touch target (02 foundations)
  32, 40, 44, 48,
  // chrome + overlay fixed dimensions (02 layouts / navigation)
  56, 64, 240, 360, 400, 440,
  // media-grid min tile (04 §FxMediaGrid)
  160,
  // layout pane widths (04 §3.1: Sidebar Layout aside 208/256, Split View list 280/320)
  208, 256, 280, 320,
  // icon ladder (02 foundations §icons)
  16, 20, 24,
  // responsive breakpoints (README canonical ranges)
  480, 640, 768, 1024, 1280,
];

/** Literal-colour patterns the gate rejects inside component CSS. */
export const COLOR_LITERAL_RE = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\s*\(/;

/** Matches every `<number>px` occurrence so the gate can allowlist-check each. */
export const PX_RE = /(-?\d+(?:\.\d+)?)px\b/g;
