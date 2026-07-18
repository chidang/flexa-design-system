/**
 * FxAiConfidenceIndicator — qualitative model-confidence meter (doc 04 §3.10
 * "FxAiConfidenceIndicator — AI Confidence Indicator").
 *
 * A 3-segment meter filled by band (low=1, medium=2, high=3) plus a band label.
 * Confidence is qualitative per the AI doctrine (ai.md §4): the visible framing
 * is the band, never a bare percentage; the exact percent lives in the accessible
 * name and the "how computed" tooltip. Never colour-only — a text label or the
 * tooltip is always present. Pure presentational (no hooks) → renders as an RSC.
 */
import { FxTooltip } from '../tooltip/tooltip';
import { FxIcon } from '../icon/FxIcon';

/** Which band a value falls into (prop-only union — not a §5 enum). */
export type ConfidenceBand = 'low' | 'medium' | 'high';

/** Baked-in strings — every one a prop (§i18n). `{percent}` substituted. */
export interface AiConfidenceLabels {
  low: string;
  medium: string;
  high: string;
  /** Tooltip trigger name / percent template (`{percent}` → the value). */
  percent: string;
}

export const DEFAULT_AI_CONFIDENCE_LABELS: AiConfidenceLabels = {
  low: 'Low confidence',
  medium: 'Medium confidence',
  high: 'High confidence',
  percent: 'Confidence {percent}%',
};

export interface FxAiConfidenceIndicatorProps {
  /** Model confidence 0..1. */
  value: number;
  /** Band thresholds: `<low` = low, `<medium` = medium, else high. */
  bands?: { low: number; medium: number };
  /** Presentation. Defaults to `badge`. */
  variant?: 'badge' | 'dots' | 'inline';
  /** Meter size. Defaults to `md`. */
  size?: 'sm' | 'md';
  /** Render the band label text. Defaults to `true`. */
  showLabel?: boolean;
  /** Tooltip text describing how confidence was computed. */
  explanation?: string;
  /** i18n overrides, merged over English defaults. */
  labels?: Partial<AiConfidenceLabels>;
  className?: string;
}

const DEFAULT_BANDS = { low: 0.4, medium: 0.75 } as const;
const TONE_BY_BAND: Record<ConfidenceBand, 'danger' | 'warning' | 'success'> = {
  low: 'danger',
  medium: 'warning',
  high: 'success',
};
const FILLED_BY_BAND: Record<ConfidenceBand, number> = { low: 1, medium: 2, high: 3 };

function bandFor(value: number, bands: { low: number; medium: number }): ConfidenceBand {
  if (value < bands.low) return 'low';
  if (value < bands.medium) return 'medium';
  return 'high';
}

export function FxAiConfidenceIndicator({
  value,
  bands = DEFAULT_BANDS,
  variant = 'badge',
  size = 'md',
  showLabel = true,
  explanation,
  labels,
  className,
}: FxAiConfidenceIndicatorProps) {
  // Honest guard: render nothing for a non-finite value.
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;

  const l = { ...DEFAULT_AI_CONFIDENCE_LABELS, ...labels };
  const band = bandFor(value, bands);
  const tone = TONE_BY_BAND[band];
  const filled = FILLED_BY_BAND[band];
  const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const bandLabel = l[band];
  const ariaLabel = `${bandLabel} (${percent}%)`;

  const rootClass = ['fx-ai-confidence-indicator', className].filter(Boolean).join(' ');

  const meter = (
    <span
      className="fx-ai-confidence-indicator-meter"
      role="img"
      aria-label={ariaLabel}
      data-band={band}
      data-tone={tone}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="fx-ai-confidence-indicator-seg"
          data-filled={i < filled || undefined}
          aria-hidden="true"
        />
      ))}
    </span>
  );

  const body = (
    <span className={rootClass} data-variant={variant} data-size={size} data-band={band} data-tone={tone}>
      {meter}
      {showLabel && <span className="fx-ai-confidence-indicator-label">{bandLabel}</span>}
      {explanation && (
        <FxTooltip content={explanation}>
          <button
            type="button"
            className="fx-ai-confidence-indicator-info"
            aria-label={l.percent.replace('{percent}', String(percent))}
          >
            <FxIcon name="info" size={16} />
          </button>
        </FxTooltip>
      )}
    </span>
  );

  return body;
}
