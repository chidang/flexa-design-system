# Flexa UI Kit — Single Source of Truth Index

> The 12 SSOT documents that define how every Flexa product looks, behaves, speaks, and is built.
> Built ON TOP of the **Flexa Design System (FDS)** — see `../flexa-design-system.md` and `packages/fds`.
> The visual identity is NOT redesigned here. FDS owns tokens; this kit owns everything above them.
>
> Origin spec: `../Flexa-UI-Kit-Design-Specification.md`.

## The 12 documents

| # | Document | File | Owns |
|---|----------|------|------|
| 1 | **Flexa Design System (FDS)** | `../flexa-design-system.md` + `packages/fds` (SSOT registry `fds.tokens.json`) | Design tokens, color, typography, spacing, radius, shadow, motion, a11y contrast gates. **Already exists — do not fork.** Bridge doc: [`01-design-tokens.md`](01-design-tokens.md) |
| 2 | **Flexa UI Kit** | [`02-ui-kit/`](02-ui-kit/) (12 section files) | Every reusable component & layout: rationale, hierarchy, wireframes, states, responsive |
| 3 | **Flexa UX Bible** | [`03-ux-bible.md`](03-ux-bible.md) | Experience rules: hierarchy, feedback, motion use, error philosophy, productivity |
| 4 | **Flexa Component Bible** | [`04-component-bible.md`](04-component-bible.md) | Engineering contract per component: anatomy, props API, events, tokens consumed, a11y contract |
| 5 | **Flexa Pattern Library** | [`05-pattern-library.md`](05-pattern-library.md) | Reusable UX patterns: CRUD, Search, Wizard, Checkout, Escrow, Dispute, Messaging… |
| 6 | **Flexa Information Architecture** | [`06-information-architecture.md`](06-information-architecture.md) | Screen structure, navigation model, URL scheme, per-persona sitemaps |
| 7 | **Flexa User Flows** | [`07-user-flows.md`](07-user-flows.md) | End-to-end flows for Guest, Buyer, Seller, Admin |
| 8 | **Flexa Screen Specifications** | [`08-screen-specifications.md`](08-screen-specifications.md) | Per-screen spec: layout, components, data, states, permissions |
| 9 | **Flexa API Contract** | [`09-api-contract.md`](09-api-contract.md) | REST conventions, resource models, payloads, errors, pagination, webhooks |
| 10 | **Flexa Copywriting Guide** | [`10-copywriting-guide.md`](10-copywriting-guide.md) | Voice & tone, empty states, errors, notifications, CTAs, microcopy tables |
| 11 | **Flexa Accessibility Guide** | [`11-accessibility-guide.md`](11-accessibility-guide.md) | Keyboard, ARIA, focus, screen readers, contrast, touch targets |
| 12 | **Flexa Prompt Library** | [`12-prompt-library.md`](12-prompt-library.md) | Canonical prompts for AI codegen (Claude/Codex/GPT/Gemini) that respect docs 1–11 |

**Building the kit?** Start at [`13-implementation-roadmap.md`](13-implementation-roadmap.md) — it locks the bootstrap decisions (package location, React+plain-CSS strategy, Lucide icons via `FxIcon` map, MSW mocks, CI gates) and sequences the work into slices U0→U12. Reading order for an implementing agent: this README → `12-prompt-library.md` (task routing) → doc 13 (pick the next open slice).

**Precedence when documents disagree:** FDS (tokens) → Accessibility Guide → UX Bible → Component Bible → UI Kit → Pattern Library → the rest. A screen spec may never override a component contract; a component may never override a token.

## Scope

Platform-agnostic. The kit must serve WordPress plugin admin UIs, Next.js/React apps, mobile apps, internal dashboards, and SaaS products. Nothing in these documents may assume WordPress, React, or any framework — components are specified as *contracts* (structure, behavior, tokens, ARIA), not implementations.

Products powered by the kit: Flexa Marketplace (reference product for IA/flows/screens/API), Flexa Booking, Flexa CRM, Flexa Block, Flexa Explorer, Flexa Media, and future products.

## Shared conventions (binding for all 12 documents)

### Naming

- **Component doc name:** plain English singular — `Button`, `Data Table`, `Escrow Timeline`.
- **Code identifier:** `Fx` prefix, PascalCase — `FxButton`, `FxDataTable`, `FxEscrowTimeline`.
- **CSS class prefix:** `.fx-` kebab-case — `.fx-button`, `.fx-data-table`. State classes `.is-*` (`.is-open`, `.is-loading`), modifier via data attributes `data-variant`, `data-size`, `data-tone`.
- **CSS custom properties:** only FDS vars `--fx-*` (emitted from token ids, e.g. `color.primary` → `var(--fx-color-primary)`). Never raw hex/px in component styles.
- **Design tokens:** referenced by FDS token id (`color.primary`, `space.4`, `radius.md`). Full registry: `packages/fds/src/fds.tokens.json` (189 tokens, FDS v2.9.x).

### Component states (every component defines all that apply)

`default · hover · focus · active · disabled · loading · empty · success · error · warning`

### Responsive ranges (canonical)

| Range | Width | Notes |
|---|---|---|
| Mobile | ≤ 767px | single column, bottom nav, sheets instead of popovers |
| Tablet | 768–1023px | collapsible sidebar, 2-col grids |
| Desktop | 1024–1439px | full sidebar, standard density (FDS `bp.tablet` = 1024 is the tablet/desktop boundary) |
| Wide | ≥ 1440px | max content width `size.container-xl` (1280px) centered; extra columns allowed ≥ `bp.wide` (1536) |

Mobile-first CSS. Containers: `size.container-sm/md/lg/xl` = 640/768/1024/1280px.

### Sizes & density

- Component sizes: `sm | md | lg` (md is default). Density modes: `comfortable` (default) and `compact` (tables/admin).
- Control heights: sm 32px, md 40px, lg 48px. Touch target minimum 44×44px (a11y guide owns this rule).

### Variants vocabulary

- Emphasis: `primary | secondary | ghost | danger` (buttons & actions).
- Tone (status): `neutral | info | success | warning | danger` — maps 1:1 to FDS `color.info/success/warning/danger` + `on-*` pairs.

### Personas (canonical)

`Guest` (unauthenticated) · `Buyer` · `Seller` · `Admin` (platform operator). Support staff are Admins with restricted roles (see Permission Matrix).

### Reference product for grounding

Docs 6–9 (IA, flows, screens, API) are written against **Flexa Marketplace** (multi-vendor marketplace with escrow payments, messaging, disputes, reviews). Other products reuse the same layouts, components, patterns, and API conventions.

### Canonical component inventory

Names below are THE canonical names. Every document must use them verbatim.

- **Layouts (12):** App Shell, Sidebar Layout, Top Navigation Layout, Bottom Navigation (Mobile), Content Area, Right Drawer, Split View, Modal Layout, Wizard Layout, Settings Layout, Authentication Layout, Dashboard Layout, Blank State Layout
- **Navigation (11):** Sidebar, Nested Sidebar, Top Navigation, Tabs, Breadcrumb, Pagination, Search Bar, Command Palette, Context Menu, Quick Actions, Floating Action Button
- **Dashboard (9):** Metric Card, Statistics Card, Charts Container, Activity Feed, Timeline, Recent Activity, Progress Summary, Quick Links, Widget
- **Forms (29):** Input, Textarea, Number Input, Password Input, Email Input, Phone Input, URL Input, Currency Input, Date Picker, Time Picker, Date Range Picker, Select, Autocomplete, Tag Input, Checkbox, Radio Group, Switch, Slider, Stepper, Color Picker, File Upload, Drag & Drop Upload, Avatar Upload, Image Gallery Upload, Rich Text Editor, Markdown Editor, Form Wizard, Field Group, Validation Message
- **Data display (22):** Table, Virtual Table, Data Grid, Card, List, Accordion, Tree, Kanban Board, Calendar, Timeline, Gallery, Media Grid, Statistic Block, Badge, Tag, Chip, Avatar, Progress, Rating, Skeleton Loader, Empty State, Description List
- **Feedback (10):** Toast, Alert, Confirmation Dialog, Loading Overlay, Inline Error, Error Page, Success Page, Warning Banner, Maintenance Banner, Offline State
- **Commerce (14):** Product Card, Listing Card, Pricing Card, Order Card, Invoice Card, Cart Summary, Checkout Summary, Payment Status, Shipping Timeline, Escrow Timeline, Review Card, Seller Card, Buyer Card, Marketplace Statistics
- **Collaboration (8):** Chat, Conversation List, Comment Thread, Mention, Notification Center, Activity Timeline, Audit Log, Version History
- **Admin (10):** Data Management Toolbar, Bulk Actions Bar, Advanced Filters, Saved Filters, Role Badge, Permission Matrix, Audit Timeline, System Logs, Queue Monitor, Background Jobs Panel
- **AI (8):** AI Assistant Panel, Prompt Input, AI Suggestion Card, AI Generation Status, AI Confidence Indicator, AI Diff Viewer, Approve/Reject Panel, AI Activity History

### Canonical screen inventory (Flexa Marketplace reference)

- **Public/Guest:** Home, Search Results, Listing Detail, Seller Profile (public), Sign In, Sign Up, Forgot Password, Email Verification
- **Buyer:** Buyer Dashboard, Checkout (Cart → Payment → Confirm), Orders List, Order Detail (with Escrow Timeline), Messages, Notifications, Reviews (write/manage), Wallet & Payment Methods, Account Settings (Profile / Security / Notifications)
- **Seller:** Seller Onboarding Wizard, Seller Dashboard, Listings (list), Listing Editor (create wizard / edit), Orders List, Order Detail (fulfil), Earnings & Payouts, Reviews (respond), Messages, Analytics, Store Settings
- **Admin:** Admin Dashboard, Users, User Detail, Listings Moderation, Orders, Disputes Queue, Dispute Detail, Payments & Refunds, Categories & Attributes, Reports & Analytics, Audit Log, System Settings, Queue Monitor

### API conventions (summary — doc 09 owns detail)

REST over HTTPS, versioned base path `/v1`. Resources plural kebab-case (`/v1/listings`, `/v1/orders/{id}/escrow-events`). JSON camelCase fields. Cursor pagination (`?cursor=&limit=`, response `{data, pageInfo:{nextCursor,hasMore}}`). Error envelope `{error:{code,message,details[]}}` with stable machine codes (`validation_failed`, `not_found`, `forbidden`…). Money = integer minor units + ISO-4217 `currency`. Timestamps ISO-8601 UTC. Idempotency-Key header on payment-affecting POSTs. Webhook events `domain.event` (`order.paid`, `dispute.opened`).

### Writing rules for these documents

- **English**, information-dense, imperative ("Use X when…"). ASCII wireframes where a picture is needed.
- Component write-ups follow the spec's template: *Purpose · When to use · When NOT to use · Variants · Properties · States · Responsive · Examples · Best practices · Common mistakes*.
- Cross-reference by doc number + anchor (`see 05 § Escrow Flow`), never duplicate normative content — one owner per rule.
- Tokens by id, components by canonical name, screens by canonical name. No hex colors. Raw pixel values only in explicitly canonical measurement statements (the tables above, plus per-component canonical measurements stated in docs 02/04, e.g. toast width 360px) — never in ad-hoc styling guidance.
