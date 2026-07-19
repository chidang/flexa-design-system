# Screens a11y audit — findings (P-G, doc 16 §1)

> **Status: REPORT-ONLY (2026-07-19).** Recorded by the drift-lock spec
> `apps/ui-kitchen-sink/src/screens/a11y.spec.tsx` (wired into the root
> `pnpm test` via `vitest.config.ts`). Fixes are **wave 2** (doc 16 §4) — they
> touch screens/components owned by the E-tracks this wave. When a fix lands,
> prune the matching `EXPECTED_VIOLATIONS` entry in the spec AND the row here.

## 1. Method

- axe (jest-axe 9 — the exact dependency the kit's per-component gate
  `packages/ui/tests/a11y.spec.ts` uses) over **every screen route** under
  `/screens/*`, **fully loaded**: the real `<App>` is mounted under a
  `MemoryRouter` against the real msw handler set (`flexa-ui-kit/mocks`,
  `setupServer`, origin `http://localhost:3000`, `resetDb()` between tests —
  mirroring `packages/ui/mocks/integration.spec.ts`), and axe only runs after
  skeletons/`aria-busy` markers are gone, the DOM is stable and a
  fixture-derived ready marker is present.
- Axe scope is the `.ks-screen-root` subtree — the composed screen itself, not
  the workbench topbar/ThemeBar harness chrome.
- `color-contrast` is disabled exactly as in the component gate: jsdom has no
  layout; real contrast is covered by the FDS contrast gate.
- Coverage: all 20 reachable screen routes — the 18 headline screens (doc 15
  §4) plus the two support routes (Seller Orders list §3.13 and the seller
  order-fulfil detail deep link). Parameterised routes (seller order detail,
  admin dispute detail) resolve a fixture id from the mock API first.
- **No screen had to be skipped**: none of the composed screens needs canvas or
  layout APIs jsdom lacks (the charts container is a styled div, not `<canvas>`).
  Portal-only overlay content (open dialogs/popovers) is not exercised — same
  limitation as the component gate; open-state SR passes stay manual.

## 2. Findings

16 of 20 screens have **zero** axe violations. The four recorded violations
(one node each):

| Screen (route) | axe rule | Impact | Count | Offending node | Root cause | Suggested owner (wave 2) |
|---|---|---|---|---|---|---|
| Listing Detail (`/screens/listings/:id`, doc 08 §2.3) | `heading-order` | moderate | 1 | `<h3 class="fx-accordion-header">` | The shipping `FxAccordion` keeps its default `headingLevel={3}` but sits directly under the page `h1` — no `h2` in between. Screen-level fix: pass `headingLevel={2}` (the prop exists). | Buyer screens (P-E1 domain) |
| Order Detail (`/screens/orders/:id`, doc 08 §2.5) | `landmark-unique` | moderate | 1 | `<section … aria-label="Order activity">` | The screen wraps `FxActivityTimeline` in its own `<section aria-label="Order activity">` while the component already renders `<section aria-label={label}>` with the same label — two identically named `region` landmarks. Screen-level fix: drop/rename one of the labels. | Buyer screens (P-E1 domain) |
| Seller Listings (`/screens/seller/listings`, doc 08 §3.12) | `heading-order` | moderate | 1 | `<h3 class="fx-product-card-title">…` | `FxProductCard` hardcodes its title as `h3`; the screen's previous heading is the `h1` (no `h2`). Component gap: `FxProductCard` has no `headingLevel` prop (unlike `FxAccordion`) — either add one (additive) or give the screen an intermediate `h2`. | Seller screens (P-E2 domain) + kit (`FxProductCard` additive prop) |
| Seller Listing Editor (`/screens/seller/listings/new`, doc 08 §2.9) | `button-name` | **critical** | 1 | `<button id=":rX:-control" role="combobox" class="fx-select-trigger" …>` | The Category `FxSelect` trigger has no axe-recognized accessible name: `FxFieldGroup` wires only `label[for]` onto the injected control id, and axe does not accept an explicit `<label for>` as the name of a custom combobox `<button>` (placeholder text is the value, not the name). Kit-level fix: `FxFieldGroup` should also inject `aria-labelledby` (label id) into wired children, or `FxSelect` should accept it from the group. Note: selects that pass an explicit `aria-label` (e.g. Search sort) are fine. | Kit (`FxFieldGroup`/`FxSelect` wiring) — affects every labelled `FxSelect` without a chosen value |

## 3. Drift-lock contract

- The spec's `EXPECTED_VIOLATIONS` map records exactly the rule ids above per
  screen; every other screen asserts **zero** violations.
- A **new** rule id on any screen fails `pnpm test` (regression gate).
- A **fixed** rule id does not fail the suite (subset assertion) so wave-2
  fixes never collide with this report-only gate — but prune the allowlist and
  this table in the fixing PR to keep the record honest.
- To regenerate the raw report:
  `A11Y_REPORT=1 pnpm exec vitest run apps/ui-kitchen-sink` and read the
  `A11Y_SCREENS_REPORT` JSON line (includes a sample offending node per rule).
