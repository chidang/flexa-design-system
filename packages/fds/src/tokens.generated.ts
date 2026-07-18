// AUTO-GENERATED from fds.tokens.json — do not edit by hand.
// Regenerate with `pnpm --filter flexa-design-system gen` (runs in `build`).
//
// fds.tokens.json is the DTCG source of truth; this inlines it so the package
// imports its tokens as a plain JS module (no runtime JSON import / import
// attribute — works in raw Node ESM, bundlers, and the browser). Kept in sync
// by tests/tokens-generated.spec.ts.

export const rawTokens: Record<string, unknown> = {
  "$description": "Flexa Design System — canonical token source (DTCG 2025.10). SSOT for TS constants, the PHP mirror, and the theme.json bridge. Three tiers: ref (primitive, holds literals) -> semantic (intent-named, aliases) -> c (component, aliases). Only the ref tier holds raw values; upper tiers are aliases so themes re-point without touching elements. This document is the DEFAULT (light) token set; dark/other modes are theme variants (Phase 5.5 Slice 3).",
  "ref": {
    "$description": "Primitive tier — raw scales, context-free, referenced only by the semantic tier.",
    "neutral": {
      "0": {
        "$value": "#ffffff"
      },
      "50": {
        "$value": "#f8fafc"
      },
      "100": {
        "$value": "#f1f5f9"
      },
      "200": {
        "$value": "#e2e8f0"
      },
      "300": {
        "$value": "#cbd5e1"
      },
      "400": {
        "$value": "#94a3b8"
      },
      "500": {
        "$value": "#64748b"
      },
      "600": {
        "$value": "#475569"
      },
      "700": {
        "$value": "#334155"
      },
      "800": {
        "$value": "#1e293b"
      },
      "900": {
        "$value": "#0f172a"
      },
      "950": {
        "$value": "#020617"
      },
      "$type": "color"
    },
    "brand": {
      "50": {
        "$value": "#eff6ff"
      },
      "100": {
        "$value": "#dbeafe"
      },
      "200": {
        "$value": "#bfdbfe"
      },
      "300": {
        "$value": "#93c5fd"
      },
      "400": {
        "$value": "#60a5fa"
      },
      "500": {
        "$value": "#3b82f6"
      },
      "600": {
        "$value": "#2563eb"
      },
      "700": {
        "$value": "#1d4ed8"
      },
      "800": {
        "$value": "#1e40af"
      },
      "900": {
        "$value": "#1e3a8a"
      },
      "$type": "color"
    },
    "success": {
      "500": {
        "$value": "#16a34a"
      },
      "600": {
        "$value": "#15803d"
      },
      "$type": "color"
    },
    "warning": {
      "500": {
        "$value": "#d97706"
      },
      "600": {
        "$value": "#b45309"
      },
      "$type": "color"
    },
    "danger": {
      "500": {
        "$value": "#dc2626"
      },
      "600": {
        "$value": "#b91c1c"
      },
      "700": {
        "$value": "#991b1b"
      },
      "800": {
        "$value": "#7f1d1d"
      },
      "$type": "color"
    },
    "info": {
      "500": {
        "$value": "#0891b2"
      },
      "600": {
        "$value": "#0e7490"
      },
      "$type": "color"
    },
    "space": {
      "0": {
        "$value": "0rem"
      },
      "1": {
        "$value": "0.25rem"
      },
      "2": {
        "$value": "0.5rem"
      },
      "3": {
        "$value": "0.75rem"
      },
      "4": {
        "$value": "1rem"
      },
      "5": {
        "$value": "1.25rem"
      },
      "6": {
        "$value": "1.5rem"
      },
      "8": {
        "$value": "2rem"
      },
      "10": {
        "$value": "2.5rem"
      },
      "12": {
        "$value": "3rem"
      },
      "16": {
        "$value": "4rem"
      },
      "20": {
        "$value": "5rem"
      },
      "24": {
        "$value": "6rem"
      },
      "$type": "dimension"
    },
    "font-size": {
      "$type": "dimension",
      "xs": {
        "$value": "0.75rem"
      },
      "sm": {
        "$value": "0.875rem"
      },
      "base": {
        "$value": "1rem"
      },
      "lg": {
        "$value": "1.125rem"
      },
      "xl": {
        "$value": "1.25rem"
      },
      "2xl": {
        "$value": "1.5rem"
      },
      "3xl": {
        "$value": "1.875rem"
      },
      "4xl": {
        "$value": "2.25rem"
      },
      "5xl": {
        "$value": "3rem"
      }
    },
    "font-weight": {
      "$type": "fontWeight",
      "regular": {
        "$value": 400
      },
      "medium": {
        "$value": 500
      },
      "semibold": {
        "$value": 600
      },
      "bold": {
        "$value": 700
      }
    },
    "line-height": {
      "$type": "number",
      "tight": {
        "$value": 1.2
      },
      "normal": {
        "$value": 1.5
      },
      "relaxed": {
        "$value": 1.75
      }
    },
    "radius": {
      "$type": "dimension",
      "none": {
        "$value": "0rem"
      },
      "sm": {
        "$value": "0.125rem"
      },
      "md": {
        "$value": "0.375rem"
      },
      "lg": {
        "$value": "0.5rem"
      },
      "xl": {
        "$value": "0.75rem"
      },
      "2xl": {
        "$value": "1rem"
      },
      "full": {
        "$value": "9999px"
      }
    },
    "border-width": {
      "0": {
        "$value": "0px"
      },
      "1": {
        "$value": "1px"
      },
      "2": {
        "$value": "2px"
      },
      "4": {
        "$value": "4px"
      },
      "8": {
        "$value": "8px"
      },
      "$type": "dimension"
    },
    "shadow": {
      "$type": "shadow",
      "sm": {
        "$value": {
          "color": "rgba(15,23,42,0.08)",
          "offsetX": "0",
          "offsetY": "1px",
          "blur": "2px",
          "spread": "0"
        }
      },
      "md": {
        "$value": {
          "color": "rgba(15,23,42,0.10)",
          "offsetX": "0",
          "offsetY": "4px",
          "blur": "8px",
          "spread": "-2px"
        }
      },
      "lg": {
        "$value": {
          "color": "rgba(15,23,42,0.12)",
          "offsetX": "0",
          "offsetY": "12px",
          "blur": "20px",
          "spread": "-4px"
        }
      },
      "xl": {
        "$value": {
          "color": "rgba(15,23,42,0.16)",
          "offsetX": "0",
          "offsetY": "24px",
          "blur": "40px",
          "spread": "-8px"
        }
      }
    },
    "duration": {
      "$type": "duration",
      "fast": {
        "$value": "120ms"
      },
      "normal": {
        "$value": "240ms"
      },
      "slow": {
        "$value": "400ms"
      },
      "loop": {
        "$value": "1200ms"
      }
    },
    "easing": {
      "$type": "cubicBezier",
      "standard": {
        "$value": [
          0.2,
          0,
          0,
          1
        ]
      },
      "in": {
        "$value": [
          0.4,
          0,
          1,
          1
        ]
      },
      "out": {
        "$value": [
          0,
          0,
          0.2,
          1
        ]
      },
      "in-out": {
        "$value": [
          0.4,
          0,
          0.2,
          1
        ]
      }
    },
    "z": {
      "$type": "number",
      "base": {
        "$value": 0
      },
      "dropdown": {
        "$value": 1000
      },
      "sticky": {
        "$value": 1100
      },
      "fixed": {
        "$value": 1200
      },
      "modal": {
        "$value": 1300
      },
      "popover": {
        "$value": 1400
      },
      "tooltip": {
        "$value": 1500
      }
    },
    "breakpoint": {
      "$type": "dimension",
      "tablet": {
        "$value": "1024px"
      },
      "desktop": {
        "$value": "1280px"
      },
      "wide": {
        "$value": "1536px"
      }
    },
    "opacity": {
      "0": {
        "$value": 0
      },
      "5": {
        "$value": 0.05
      },
      "10": {
        "$value": 0.1
      },
      "25": {
        "$value": 0.25
      },
      "50": {
        "$value": 0.5
      },
      "75": {
        "$value": 0.75
      },
      "100": {
        "$value": 1
      },
      "$type": "number"
    }
  },
  "color": {
    "$type": "color",
    "$description": "Semantic color — the ONLY color tier elements may use. fg/bg go in pairs so contrast is guaranteed at the token layer (WCAG 2.2 AA; CI contrast-check in Slice 3).",
    "bg": {
      "$value": "{ref.neutral.0}",
      "$description": "Page background."
    },
    "surface": {
      "$value": "{ref.neutral.0}",
      "$description": "Card / raised surface."
    },
    "surface-alt": {
      "$value": "{ref.neutral.50}"
    },
    "text": {
      "$value": "{ref.neutral.900}",
      "$description": "Primary text on bg/surface."
    },
    "text-muted": {
      "$value": "{ref.neutral.600}"
    },
    "text-subtle": {
      "$value": "{ref.neutral.500}",
      "$description": "Tertiary text (timestamps, helper copy) — AA for normal text on bg/surface (FDS 2.11)."
    },
    "primary": {
      "$value": "{ref.brand.600}"
    },
    "on-primary": {
      "$value": "{ref.neutral.0}",
      "$description": "Text/icon ON primary — AA-paired with color.primary."
    },
    "primary-hover": {
      "$value": "{ref.brand.700}"
    },
    "primary-active": {
      "$value": "{ref.brand.800}"
    },
    "secondary": {
      "$value": "{ref.neutral.600}",
      "$description": "Second brand accent (Design Packs, FDS 2.1). Neutral slate by default — a pack re-points it."
    },
    "on-secondary": {
      "$value": "{ref.neutral.0}",
      "$description": "Text/icon ON secondary — AA-paired with color.secondary."
    },
    "secondary-hover": {
      "$value": "{ref.neutral.700}"
    },
    "secondary-active": {
      "$value": "{ref.neutral.800}"
    },
    "border": {
      "$value": "{ref.neutral.200}"
    },
    "border-strong": {
      "$value": "{ref.neutral.300}"
    },
    "focus-ring": {
      "$value": "{ref.brand.500}"
    },
    "scrim": {
      "$value": "rgba(0,0,0,0.4)",
      "$description": "Translucent backdrop behind modals / drawers / offcanvas — a fixed overlay veil, constant across schemes (a decorative overlay, so no on-color contrast pair)."
    },
    "success": {
      "$value": "{ref.success.600}"
    },
    "on-success": {
      "$value": "{ref.neutral.0}"
    },
    "warning": {
      "$value": "{ref.warning.600}"
    },
    "on-warning": {
      "$value": "{ref.neutral.0}"
    },
    "danger": {
      "$value": "{ref.danger.600}"
    },
    "on-danger": {
      "$value": "{ref.neutral.0}"
    },
    "danger-hover": {
      "$value": "{ref.danger.700}"
    },
    "danger-active": {
      "$value": "{ref.danger.800}"
    },
    "info": {
      "$value": "{ref.info.600}"
    },
    "on-info": {
      "$value": "{ref.neutral.0}"
    },
    "primary-soft": {
      "$value": "#e5ecfd",
      "$description": "Soft tint fill (selected rows, quiet chips) — the tone mixed 12% into the light surface, PRE-COMPUTED to a literal (scrim precedent) because interop surfaces (export/Figma/IDE/pickers) require concrete values (FDS 2.12). Dark re-mixes over the dark surface via mode override. Pair with full-strength tone text."
    },
    "primary-border-soft": {
      "$value": "#a8c1f7",
      "$description": "Border for soft-tinted surfaces (FDS 2.12) — same derivation at 40%."
    },
    "success-soft": {
      "$value": "#e3f0e8"
    },
    "success-border-soft": {
      "$value": "#a1ccb1"
    },
    "warning-soft": {
      "$value": "#f6eae1"
    },
    "warning-border-soft": {
      "$value": "#e1ba9d"
    },
    "danger-soft": {
      "$value": "#f7e4e4"
    },
    "danger-border-soft": {
      "$value": "#e3a4a4"
    },
    "info-soft": {
      "$value": "#e2eef2"
    },
    "info-border-soft": {
      "$value": "#9fc7d3"
    }
  },
  "space": {
    "0": {
      "$value": "{ref.space.0}"
    },
    "1": {
      "$value": "{ref.space.1}"
    },
    "2": {
      "$value": "{ref.space.2}"
    },
    "3": {
      "$value": "{ref.space.3}"
    },
    "4": {
      "$value": "{ref.space.4}"
    },
    "5": {
      "$value": "{ref.space.5}"
    },
    "6": {
      "$value": "{ref.space.6}"
    },
    "8": {
      "$value": "{ref.space.8}"
    },
    "10": {
      "$value": "{ref.space.10}"
    },
    "12": {
      "$value": "{ref.space.12}"
    },
    "16": {
      "$value": "{ref.space.16}"
    },
    "20": {
      "$value": "{ref.space.20}"
    },
    "24": {
      "$value": "{ref.space.24}"
    },
    "$type": "dimension",
    "$description": "Semantic spacing — aliases ref.space so themes retune the scale while element-facing names stay stable."
  },
  "radius": {
    "$type": "dimension",
    "none": {
      "$value": "{ref.radius.none}"
    },
    "sm": {
      "$value": "{ref.radius.sm}"
    },
    "md": {
      "$value": "{ref.radius.md}"
    },
    "lg": {
      "$value": "{ref.radius.lg}"
    },
    "xl": {
      "$value": "{ref.radius.xl}"
    },
    "2xl": {
      "$value": "{ref.radius.2xl}"
    },
    "full": {
      "$value": "{ref.radius.full}"
    }
  },
  "border": {
    "0": {
      "$value": "{ref.border-width.0}"
    },
    "1": {
      "$value": "{ref.border-width.1}"
    },
    "2": {
      "$value": "{ref.border-width.2}"
    },
    "4": {
      "$value": "{ref.border-width.4}"
    },
    "8": {
      "$value": "{ref.border-width.8}"
    },
    "$type": "dimension",
    "$description": "Semantic border widths."
  },
  "shadow": {
    "$type": "shadow",
    "sm": {
      "$value": "{ref.shadow.sm}"
    },
    "md": {
      "$value": "{ref.shadow.md}"
    },
    "lg": {
      "$value": "{ref.shadow.lg}"
    },
    "xl": {
      "$value": "{ref.shadow.xl}"
    }
  },
  "font": {
    "$type": "fontFamily",
    "$description": "Semantic font families.",
    "family-base": {
      "$value": "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    },
    "family-heading": {
      "$value": "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    },
    "family-mono": {
      "$value": "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      "$description": "Monospace stack for code, IDs and tabular figures (FDS 2.10)."
    },
    "tracking-wide": {
      "$type": "dimension",
      "$value": "0.04em",
      "$description": "Letter-spacing for uppercase overlines / small labels (FDS 2.10)."
    }
  },
  "font-weight": {
    "$type": "fontWeight",
    "$description": "Semantic font weights — alias the ref ramp so components never touch refs (FDS 2.10).",
    "regular": {
      "$value": "{ref.font-weight.regular}"
    },
    "medium": {
      "$value": "{ref.font-weight.medium}"
    },
    "semibold": {
      "$value": "{ref.font-weight.semibold}"
    },
    "bold": {
      "$value": "{ref.font-weight.bold}"
    }
  },
  "line-height": {
    "$type": "number",
    "$description": "Semantic line heights — alias the ref ramp so components never touch refs (FDS 2.10).",
    "tight": {
      "$value": "{ref.line-height.tight}"
    },
    "normal": {
      "$value": "{ref.line-height.normal}"
    },
    "relaxed": {
      "$value": "{ref.line-height.relaxed}"
    }
  },
  "text": {
    "$type": "typography",
    "$description": "Semantic type roles — composite tokens (family+size+weight+line-height applied together). Consumed as a bundle; the runtime maps a composite to its CSS declarations (Slice 2/5). Also emitted as per-property custom properties `--fx-text-<name>-{size,weight,line-height}` (FDS 2.10).",
    "heading-xl": {
      "$value": {
        "fontFamily": "{font.family-heading}",
        "fontSize": "{ref.font-size.4xl}",
        "fontWeight": "{ref.font-weight.bold}",
        "lineHeight": "{ref.line-height.tight}"
      }
    },
    "heading-lg": {
      "$value": {
        "fontFamily": "{font.family-heading}",
        "fontSize": "{ref.font-size.3xl}",
        "fontWeight": "{ref.font-weight.bold}",
        "lineHeight": "{ref.line-height.tight}"
      }
    },
    "heading-md": {
      "$value": {
        "fontFamily": "{font.family-heading}",
        "fontSize": "{ref.font-size.2xl}",
        "fontWeight": "{ref.font-weight.semibold}",
        "lineHeight": "{ref.line-height.tight}"
      }
    },
    "heading-sm": {
      "$value": {
        "fontFamily": "{font.family-heading}",
        "fontSize": "{ref.font-size.xl}",
        "fontWeight": "{ref.font-weight.semibold}",
        "lineHeight": "{ref.line-height.tight}"
      },
      "$description": "Card/section titles — same mapping as the base-typography h4 rule (FDS 2.10)."
    },
    "body": {
      "$value": {
        "fontFamily": "{font.family-base}",
        "fontSize": "{ref.font-size.base}",
        "fontWeight": "{ref.font-weight.regular}",
        "lineHeight": "{ref.line-height.normal}"
      }
    },
    "body-lg": {
      "$value": {
        "fontFamily": "{font.family-base}",
        "fontSize": "{ref.font-size.lg}",
        "fontWeight": "{ref.font-weight.regular}",
        "lineHeight": "{ref.line-height.normal}"
      },
      "$description": "Lead/emphasized body copy (FDS 2.10)."
    },
    "body-sm": {
      "$value": {
        "fontFamily": "{font.family-base}",
        "fontSize": "{ref.font-size.sm}",
        "fontWeight": "{ref.font-weight.regular}",
        "lineHeight": "{ref.line-height.normal}"
      }
    },
    "label": {
      "$value": {
        "fontFamily": "{font.family-base}",
        "fontSize": "{ref.font-size.sm}",
        "fontWeight": "{ref.font-weight.medium}",
        "lineHeight": "{ref.line-height.normal}"
      }
    },
    "caption": {
      "$value": {
        "fontFamily": "{font.family-base}",
        "fontSize": "{ref.font-size.xs}",
        "fontWeight": "{ref.font-weight.regular}",
        "lineHeight": "{ref.line-height.normal}"
      },
      "$description": "Timestamps, fine print, dense metadata (FDS 2.10)."
    }
  },
  "motion": {
    "$description": "Semantic motion — gated by prefers-reduced-motion at :root emission (Slice 3).",
    "duration-fast": {
      "$type": "duration",
      "$value": "{ref.duration.fast}"
    },
    "duration-normal": {
      "$type": "duration",
      "$value": "{ref.duration.normal}"
    },
    "duration-slow": {
      "$type": "duration",
      "$value": "{ref.duration.slow}"
    },
    "duration-loop": {
      "$type": "duration",
      "$value": "{ref.duration.loop}",
      "$description": "Continuous/looping animation cycle (spinners, shimmer, marquee) — FDS 2.12. NOT zeroed under prefers-reduced-motion (a 0s infinite loop still animates every frame); loop consumers must gate with `animation: none` themselves."
    },
    "easing-standard": {
      "$type": "cubicBezier",
      "$value": "{ref.easing.standard}"
    },
    "easing-in": {
      "$type": "cubicBezier",
      "$value": "{ref.easing.in}"
    },
    "easing-out": {
      "$type": "cubicBezier",
      "$value": "{ref.easing.out}"
    },
    "easing-in-out": {
      "$type": "cubicBezier",
      "$value": "{ref.easing.in-out}"
    }
  },
  "z": {
    "$type": "number",
    "$description": "Semantic stacking layers.",
    "base": {
      "$value": "{ref.z.base}"
    },
    "dropdown": {
      "$value": "{ref.z.dropdown}"
    },
    "sticky": {
      "$value": "{ref.z.sticky}"
    },
    "fixed": {
      "$value": "{ref.z.fixed}"
    },
    "modal": {
      "$value": "{ref.z.modal}"
    },
    "popover": {
      "$value": "{ref.z.popover}"
    },
    "tooltip": {
      "$value": "{ref.z.tooltip}"
    }
  },
  "size": {
    "$type": "dimension",
    "$description": "Container widths — on WordPress these bridge settings.layout.contentSize/wideSize (Slice 4) — plus fixed interaction sizes.",
    "container-sm": {
      "$value": "640px"
    },
    "container-md": {
      "$value": "768px"
    },
    "container-lg": {
      "$value": "1024px"
    },
    "container-xl": {
      "$value": "1280px"
    },
    "container-full": {
      "$value": "100%"
    },
    "tap": {
      "$value": "44px",
      "$description": "Minimum touch-target hit area (WCAG 2.5.8 / a11y guide) — bind under pointer:coarse so pointer UIs keep their compact metrics."
    }
  },
  "bp": {
    "$type": "dimension",
    "$description": "Semantic breakpoints — map to the frozen compiler's @responsive; themeable so a host can retune.",
    "tablet": {
      "$value": "{ref.breakpoint.tablet}"
    },
    "desktop": {
      "$value": "{ref.breakpoint.desktop}"
    },
    "wide": {
      "$value": "{ref.breakpoint.wide}"
    }
  },
  "opacity": {
    "$type": "number",
    "$description": "Semantic opacity — interaction/emphasis states. disabled & muted are the grounded needs; the ref.opacity ramp is available for one-off overlays.",
    "disabled": {
      "$value": "{ref.opacity.50}",
      "$description": "Faded look for disabled controls."
    },
    "muted": {
      "$value": "{ref.opacity.75}",
      "$description": "De-emphasized (secondary) content."
    }
  },
  "c": {
    "$description": "Component tier — narrow, only where a semantic token is insufficient. Aliases the semantic tier.",
    "button": {
      "radius": {
        "$type": "dimension",
        "$value": "{radius.md}"
      },
      "padding-x": {
        "$type": "dimension",
        "$value": "{space.4}"
      },
      "padding-y": {
        "$type": "dimension",
        "$value": "{space.2}"
      }
    }
  }
};
