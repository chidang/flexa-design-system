# Changelog

All notable changes to `flexa-ui-kit` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this package follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html), with its major version
tracking the Flexa Design System major it targets.

## [0.1.0] — 2026-07-18

Initial release. 133 accessible, token-only React components built on
`flexa-design-system@^2`, delivered across the U1→U11 slices.

### Added

- **Forms & Inputs** — Button, Input, Textarea, Checkbox, Radio Group, Switch,
  Field Group, Validation Message, and the advanced form set (Select, Combobox,
  Date/Time pickers, Slider, Stepper, Phone Input, Form Wizard, and more).
- **Display Primitives** — Badge, Tag, Chip, Avatar, Progress, Skeleton, Empty
  State, Card, Description List.
- **Overlays & Layering** — Toast, Alert, Confirmation Dialog, Dialog, Right
  Drawer, Tooltip, Loading Overlay.
- **Navigation** — Tabs, Breadcrumb, Pagination, Search Bar, Command Palette,
  Sidebar.
- **Data Display** — Table, List, Tree, Calendar, Timeline, Gallery, Rating.
- **Layouts & Dashboard** — app shells, split/wizard/blank-state layouts,
  dashboard widgets.
- **Commerce** — Listing Card, Cart, Checkout Summary, Order Card, Invoice Card,
  Seller Card, Escrow Timeline, Payment Status, and related surfaces.
- **Collaboration & Feedback** — Chat, Comments, Notifications, status surfaces.
- **Admin & System** — filters, permissions, audit, queues, jobs.
- **AI** — assistant panels, suggestions, diffs, approvals.
- **Mocks** (`flexa-ui-kit/mocks`, `flexa-ui-kit/mocks/browser`) — a deterministic,
  MSW-backed mock backend with coherent Seller/Listing/Cart/Order/Escrow fixtures
  for building reference screens. `msw` is an optional peer.
- **Build artifacts** — ESM + `.d.ts` (`dist/`), a bundled `dist/styles.css`, and
  compiled mocks (`dist/mocks/`).

### Notes

- Every component is WCAG-gated (`jest-axe`) and token-only (no hard-coded CSS
  values), verified by six CI gates: enum-drift, showcase-registry,
  class-contract, token-discipline, a11y, icon-map.
- Publishing is a human step (`pnpm publish` from `packages/ui`); `workspace:^`
  resolves the FDS dependency to a `^2` range on publish.

[0.1.0]: https://github.com/chidang/flexa-builder/releases/tag/flexa-ui-kit%400.1.0
