# UI Kit — Accessibility (index)

> **Normative content lives in [`../11-accessibility-guide.md`](../11-accessibility-guide.md).**
> This file exists so the `02-ui-kit/` folder matches the origin spec's structure
> (`accessibility/` section). It is a pointer + quick card only — it defines no rules,
> and it may never disagree with 11. Per-component ARIA/keyboard tables live in
> `04-component-bible.md`; doc 11 defines the contracts 04 instantiates.

## Where to look

| Topic | Owner |
|---|---|
| Baseline (WCAG 2.2 AA), AAA aspirations, platform scope | 11 §1 |
| Keyboard navigation, APG key maps per widget class, shortcuts safety, skip links | 11 §2 (registry: 05 § Keyboard Shortcuts) |
| Focus management (visible focus, order, dialogs, delete, route change, async) | 11 §3 |
| ARIA doctrine (native-first, landmarks, headings, name/role/value, live regions) | 11 §4 |
| Screen readers (reading order, tables, form association, time/currency, virtual lists, skeletons) | 11 §5 |
| Color & contrast (FDS gates, 3:1 non-text, never color-alone, dark/forced-colors) | 11 §6 (gates: FDS `contrast.ts`) |
| Touch & pointer (44px targets, spacing, drag alternatives, pointer cancellation) | 11 §7 |
| Motion & vestibular (reduced motion, autoplay, flashing, parallax ban) | 11 §8 |
| Forms (error summary, labels, autocomplete, WCAG 2.2 criteria) | 11 §9 |
| Content (titles, link purpose, language, i18n/RTL icon flipping) | 11 §10 |
| Testing, manual script, release gate | 11 §11 |

## Quick card — the 10 most load-bearing rules

1. **WCAG 2.2 AA is the floor for everything** — web, mobile, WP admin; no
   internal-tool exemption. (11 §1)
2. **Everything works by keyboard**, following the APG key maps; composites
   (grid, tree, menu, tabs) are one Tab stop with arrow-key internals. (11 §2)
3. **Focus is always visible**: outline 2px `color.focus-ring`, offset 2px —
   never removed (`:focus-visible` allowed). Focus order = DOM order = visual
   order; positive `tabindex` is banned. (11 §3)
4. **Dialogs**: focus in on open, trapped while open, `Esc` closes, focus
   restores to the invoker. Nothing else may trap focus. (11 §3.3–3.4)
5. **Native HTML first**; ARIA only where HTML has no element. Exactly one
   `main`, one `h1`, no heading skips; every custom widget exposes
   name/role/value. (11 §4)
6. **Live regions, four channels**: Toast = `role="status"` (polite), errors =
   `role="alert"` (assertive), Chat/feed = `role="log"`, loading =
   `aria-busy` + completion announcement. Icon-only controls always have
   `aria-label`; decorative icons `aria-hidden`. (11 §4.5–4.6)
7. **Never color alone**: status = tone + text/icon (Badge says "Overdue",
   not just red); charts need labels/patterns + a data alternative. All color
   pairs go through the FDS contrast gate. (11 §5.4, §6)
8. **Touch targets ≥ 44×44px** (our bar; WCAG floor is 24), ≥ `space.2`
   between targets; every drag has a non-drag alternative; hover-revealed
   actions also appear on focus and on touch. (11 §7)
9. **`prefers-reduced-motion` honored everywhere** (drop transforms, keep
   short fades); nothing autoplays > 5s without pause; parallax is banned.
   (11 §8)
10. **Forms**: every field has a persistent label (placeholder is never the
    label), errors are associated via `aria-describedby` + summarized with
    links on submit, correct `autocomplete` attributes, and sign-in never
    requires a cognitive-only test or blocks paste. (11 §9)

**Definition of done:** axe-clean is necessary, not sufficient — a component
ships only after the 11 §11.1 checklist (keyboard pass, NVDA + VoiceOver pass,
200%/400% reflow, contrast in both schemes, reduced motion, RTL) and screens
pass the 11 §11.3 manual script. Critical-path A/AA failures block release.
