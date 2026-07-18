# Flexa UI

[![npm](https://img.shields.io/npm/v/flexa-ui-kit.svg)](https://www.npmjs.com/package/flexa-ui-kit)
[![downloads](https://img.shields.io/npm/dm/flexa-ui-kit.svg)](https://www.npmjs.com/package/flexa-ui-kit)
[![license](https://img.shields.io/npm/l/flexa-ui-kit.svg)](./LICENSE)

📖 **[Design system, token reference & live playground → fds.sitebefy.com](https://fds.sitebefy.com)**

A **React component kit built on the [Flexa Design System](https://www.npmjs.com/package/flexa-design-system)**.
133 accessible, token-only components across forms, display, overlays, navigation,
data, layouts, commerce, collaboration, admin, and AI — every one WCAG-gated in CI
and themed entirely through FDS tokens.

Flexa UI is the product layer that sits **on top of** FDS: FDS ships the tokens and
the `var(--fx-*)` pipeline, Flexa UI ships the components that consume them. It
depends on FDS **one way** and never imports the Flexa Builder core.

## Install

```sh
npm install flexa-ui-kit flexa-design-system react react-dom
```

`react` / `react-dom` (>=18) are peer dependencies; `flexa-design-system` is a
direct dependency and provides the token CSS.

## Quick start

```tsx
import 'flexa-design-system/theme.css'; // FDS tokens → :root CSS variables
import 'flexa-ui-kit/styles.css';           // every component's token-only CSS

import { FxButton, FxCard } from 'flexa-ui-kit';

export function Example() {
  return (
    <FxCard>
      <FxButton tone="primary">Save changes</FxButton>
    </FxCard>
  );
}
```

Theme it by swapping the FDS theme — brand color, scheme (light/dark), and density
all flow from FDS `emitTheme(...)` output; no component-level overrides.

## What's in the box

| Category | Examples |
|---|---|
| Forms & Inputs | Button, Input, Textarea, Checkbox, Radio Group, Switch, Field Group, Validation Message, Select, Combobox, Date/Time, Slider, Stepper, Form Wizard |
| Display Primitives | Badge, Tag, Chip, Avatar, Progress, Skeleton, Empty State, Card, Description List |
| Overlays & Layering | Toast, Alert, Confirmation Dialog, Dialog, Right Drawer, Tooltip, Loading Overlay |
| Navigation | Tabs, Breadcrumb, Pagination, Search Bar, Command Palette, Sidebar |
| Data Display | Table, List, Tree, Calendar, Timeline, Gallery, Rating |
| Layouts & Dashboard | App shells, split views, dashboard widgets |
| Commerce | Listing Card, Cart, Checkout Summary, Order Card, Escrow Timeline, Payment Status |
| Collaboration & Feedback | Chat, Comments, Notifications, Status pages |
| Admin & System | Filters, Permissions, Audit, Queues, Jobs |
| AI | Assistant panels, Suggestions, Diffs, Approvals |

Browse the full inventory with live variants in the
[kitchen-sink](https://fds.sitebefy.com) and per-component docs.

## Principles

- **Token-only CSS.** Every value is an FDS token (`var(--fx-*)`); no hard-coded
  colors or spacing. Enforced by the `token-discipline` CI gate.
- **Accessible by construction.** Each component ships a `jest-axe` a11y spec; the
  `a11y` gate fails the build on any violation.
- **One component per file.** Predictable structure; the registry is the single
  inventory both the kitchen-sink and docs iterate.
- **No utility classes.** Flexa UI is a component library, not a CSS framework —
  its closest relatives are Radix + React Aria, styled by FDS tokens.

## Mocks (`flexa-ui-kit/mocks`)

For building and testing real product screens, the package ships a deterministic,
[MSW](https://mswjs.io)-backed mock backend — coherent fixtures (Sellers, Listings,
Carts, Orders, Escrow) faithful to the Flexa API contract.

```ts
// Node-safe: fixtures + handlers + id minter
import { handlers, resetDb, LISTINGS } from 'flexa-ui-kit/mocks';

// Browser: Service Worker wiring
import { startMockWorker } from 'flexa-ui-kit/mocks/browser';
await startMockWorker();
```

`msw` is an **optional peer** — install it only if you use the mocks.

## Versioning

Flexa UI's **major** version tracks the Flexa Design System **major** it targets;
this release is built against `flexa-design-system@^2` and declares that compatible
range. Minor releases add components or props (additive, back-compatible); patches
are fixes. See [CHANGELOG.md](./CHANGELOG.md).

## License

[MIT](./LICENSE) © chidang and Flexa Builder contributors
