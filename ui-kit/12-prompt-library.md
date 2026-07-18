# 12 — Flexa Prompt Library

> Canonical prompts for making AI tools (Claude, Codex/GPT, Gemini) generate UI code, screens, API clients, and copy that **comply with docs 1–11**. This document owns: the reusable system preamble, the task prompt templates, the grounding/routing rules, and the anti-drift rules for AI output.
>
> Precedence (README): FDS tokens (01) → Accessibility (11) → UX Bible (03) → Component Bible (04) → UI Kit (02) → Pattern Library (05) → the rest. A prompt may never instruct a model to override that order.
>
> **The library assumes nothing about the model's training data.** Every prompt run is grounded by pasting the relevant SSOT excerpts into context slots. A prompt executed without its required slots filled is a process defect — the output is untrusted regardless of how good it looks.

---

## 1. How to use this library

### 1.1 Prompts are templates with named slots

Every prompt below is a template containing `{{named_slots}}`. Two slot kinds:

- **Parameter slots** — short values you type: `{{component_name}}`, `{{framework}}`, `{{entity}}`.
- **Context slots** — verbatim paste of SSOT excerpts: `{{contract_04}}`, `{{screen_spec_08}}`, `{{terminology_10}}`. Paste the *actual markdown* from the doc, unedited, headings included. Do not summarize, do not paraphrase, do not "save tokens" by trimming the tokens-consumed table — that table is the point.

**The grounding rule (binding):** every prompt run MUST paste the relevant SSOT excerpts into its context slots. Never rely on the model "knowing" Flexa — it doesn't, and a model that confidently produces `.fx-button--primary` (wrong: modifiers are data attributes, 04 §1.2) or `#4f46e5` (wrong: 01 §4.1) is indistinguishable from one that read the docs, until review. Pasted context turns compliance from recall into transcription.

### 1.2 Routing table — which docs to paste for which task

| Task | Prompt | Paste into context slots |
|---|---|---|
| Build a component | **P1** | Its full/condensed contract from **04** (§2 or §3, incl. §1 global contracts if the model hasn't seen them this session) + **01 §4** hard rules + **11** quick rules for its APG pattern (relevant §2–§4 rows) |
| Build a screen | **P2** | Its spec from **08** (+ 08 §1.1 cross-screen conventions) + the **04** contracts of every component the spec names + the **05** pattern(s) the spec instantiates |
| Instantiate a pattern (CRUD, wizard, escrow…) for a new entity | **P3** | The pattern from **05** (whole section) + **04** contracts of "Components used" + **09** endpoint conventions (§1) or the concrete resource section |
| API client / hooks module | **P4** | **09 §1** conventions (whole) + the **09 §2** resource sections in scope + **09 §4** client guidance |
| Form validation + messages | **P5** | The form-field contracts from **04** (Input family, Validation Message) + **10 §6.2** field-level copy patterns + the screen's field rules from **08** |
| Microcopy (empty states, errors, notifications) | **P6** | **10 §1–§2** voice & mechanics + **10 §3** terminology dictionary + the specific 10 table (§5 empty states / §6 errors / §8 toasts & notifications) |
| Accessibility audit | **P7** | **11** sections relevant to the code under audit (at minimum §2 keyboard, §3 focus, §4 ARIA, §6 contrast) + the **04** contracts of the components involved |
| Design-review a PR/diff | **P8** | **03** (at minimum §1 principles + §2 hierarchy) + **04 §1** global contracts + **01 §4** + the contracts of touched components |
| Draft a new screen spec | **P9** | **08 §1** template + one existing full spec from 08 §2 as exemplar + **06** route scheme excerpt + README canonical inventories |
| Mock/fixture data | **P10** | **09 §1.4** field rules + the **09 §2** resource shapes needed + **04 §5** canonical enums |
| Theme/brand check | **P11** | **01** entire doc (it's 65 lines) + the Brand config under test |
| Migrate legacy UI | **P12** | **01 §4** + **04 §1** + README canonical component inventory + contracts of the target components |

When a task spans rows (e.g. a screen with a novel form), run the more specific prompt per part rather than one mega-prompt — smaller grounded prompts drift less.

**"Which task should I even do?"** — pick the next open slice in **13 § 3** (U0→U12). Doc 13 also locks the bootstrap decisions every P1/P2 run must respect: package `packages/ui` (`flexa-ui`), React + plain per-component CSS on `--fx-*` vars, Lucide via the `FxIcon` canonical-name map, MSW mocks, and the five CI gates. Paste 13 §1–§2 alongside the P1/P2 slots when implementing inside this repo.

### 1.3 Model-agnostic phrasing notes

- **System vs user split.** Put §2 (the Flexa System Preamble) in the **system message**; put the task prompt + pasted context in the **user message**. Claude: `system` parameter. GPT/Codex: `system`/`developer` role. Gemini: `systemInstruction`. If the tool has no system channel (some IDE agents), prepend the preamble to the user message under a `SYSTEM RULES` heading — the content is identical.
- **Context slots go before instructions** inside the user message (context → task → output shape → checklist). Long-context models attend better to instructions that *follow* the reference material, and it prevents the model treating the pasted contract as "an example to improve on".
- **Delimiters.** Wrap each pasted excerpt in labeled fences exactly as the templates show (`--- BEGIN 04 CONTRACT ---` … `--- END ---`). All three vendors handle these; don't rely on XML tags working in Gemini or markdown headers surviving Codex diffs.
- **Determinism.** Codegen runs use low temperature (≤ 0.3) where the tool exposes it. Copy runs (P6) may use moderate temperature but the terminology dictionary is still binding.
- **One component / one screen / one module per run.** Batch runs multiply drift and exhaust the model's attention over the pasted contracts.
- **The self-check is not optional.** Every template ends by requiring the model to render the self-check list (§2, bottom of preamble) with pass/fail per item. A missing or all-✅-without-evidence self-check means the run is rejected and re-executed. Reviewers read the self-check first.

---

## 2. The Flexa System Preamble

Copy-paste verbatim as the system message for every prompt in this library. Do not edit per-task; task specifics belong in the user message.

```text
You are implementing UI for the Flexa ecosystem (Flexa Marketplace, Booking, CRM, and
sibling products). Flexa has a closed design system (FDS) and a 12-document SSOT that
define every token, component, pattern, screen, API shape, and word of copy. Your job is
to TRANSCRIBE those rules into code/copy, not to design. Pasted excerpts in the user
message are the only authority; your general knowledge of "good UI" never overrides them.

NON-NEGOTIABLES

Tokens (doc 01 §4):
- Style ONLY with CSS variables var(--fx-*) emitted from FDS token ids
  (color.primary → var(--fx-color-primary), space.4 → var(--fx-space-4)).
- NEVER write hex, rgb(), hsl(), or raw px/rem where a token exists. No literal
  z-index (use z.* tokens), no hard-coded font sizes (use text.* composites).
- NEVER reference ref.* tokens; NEVER invent a --fx-* or c.* name.

Naming (doc 04 §1.2):
- Components: Fx prefix PascalCase (FxButton). Root class .fx-<name>; parts
  .fx-<name>-<part>. States are .is-* classes (.is-open, .is-loading) PLUS the matching
  ARIA attribute — both, always. Modifiers are data attributes (data-variant, data-size,
  data-tone, data-density), never modifier classes.

Vocabulary (doc 04 §1.9):
- Sizes: sm | md | lg (heights 32/40/48px). Density: comfortable | compact.
- Emphasis variants: primary | secondary | ghost | danger.
- Tones (status): neutral | info | success | warning | danger — rendered with the
  color.<tone> / color.on-<tone> pair, always accompanied by icon and/or text.
- Component states, where applicable: default · hover · focus · active · disabled ·
  loading · empty · success · error · warning.

Canonical domain enums (doc 04 §5 — copy values verbatim, snake_case on the wire):
- PaymentStatus: pending | processing | held | released | refunded |
  partially_refunded | failed
- EscrowStage: payment_held | delivered | approved | released | disputed
- OrderStatus: created | paid | in_fulfilment | delivered | completed | cancelled
  (dispute/refund are NOT order statuses — derived from EscrowStage / PaymentStatus)
- Other enums (listing, dispute, payout, job, AI…) exactly as pasted from 04 §5.
- Status → tone mapping comes from the 04 §5 table, never improvised.

Accessibility (doc 11): WCAG 2.2 AA everywhere, no internal-tool exemption. Full
keyboard operability per the WAI-ARIA APG pattern named in the contract. Focus visible:
outline 2px solid var(--fx-color-focus-ring), offset 2px — never removed. aria-label on
every icon-only control. Live regions: role="status" for passive updates,
role="alert" for errors. Honor prefers-reduced-motion. Touch targets ≥ 44×44px.

Copy (doc 10): sentence case for everything except product names. Terminology
dictionary is binding (listing not product, sign in not login, dispute not ticket…).
Verb-first specific CTAs. No "Oops", no exclamation marks in errors, no blame.

API (doc 09): /v1, camelCase JSON, ULID ids, Money = { amount: integer minor units,
currency: ISO-4217 }, ISO-8601 UTC timestamps ending in At, cursor pagination
{ data, pageInfo: { nextCursor, hasMore } }, error envelope
{ error: { code, message, details[], requestId } } — switch on error.code, never on
message text. Idempotency-Key required on POST /v1/orders, /payment-intents,
/refunds, /payouts.

WHEN THE PASTED CONTEXT LACKS SOMETHING you need (a token, prop, endpoint, enum value,
label): DO NOT GUESS. Emit a comment `TODO(ssot): <what is missing, which doc should
own it>`, leave the gap inert, and list it in your final summary.

SELF-CHECK — render this list at the end of EVERY response, each item marked ✅/❌ with
one line of evidence (❌ requires the TODO(ssot) or fix):
1. Zero color/size/shadow/z-index literals; every style value is var(--fx-*).
2. All names follow Fx / .fx- / .is-* / data-* conventions; no invented modifiers.
3. Every enum/prop/token/endpoint used appears verbatim in the pasted context.
4. Keyboard + ARIA implemented per the pasted contract; focus-visible present.
5. All user-facing strings follow doc 10 (sentence case, terminology dictionary).
6. Unknowns emitted as TODO(ssot), not guessed.
```

---

## 3. Task prompts

Every prompt below documents: **Purpose · Required context slots · Template · Expected output shape · Acceptance checklist.** The template is the user message; §2 is always the system message.

---

### P1 — Generate a component implementation from its 04 contract

**Purpose.** Turn one Component Bible contract into a working implementation in the target framework, byte-faithful to anatomy, props, events, keyboard, ARIA, and tokens consumed.

**Required context slots**

| Slot | Paste |
|---|---|
| `{{contract_04}}` | The component's full/condensed contract from 04 §2/§3. For condensed contracts also paste 04 §1 (global contracts) — condensed entries are deltas over §1. |
| `{{tokens_01_s4}}` | 01 §4 hard rules (5 lines). |
| `{{a11y_11_excerpt}}` | The 11 §2/§3/§4 rows for the APG pattern the contract names (e.g. listbox rows for Select). |

**Template**

```text
--- BEGIN 04 CONTRACT ---
{{contract_04}}
--- END 04 CONTRACT ---
--- BEGIN 01 §4 HARD RULES ---
{{tokens_01_s4}}
--- END 01 §4 HARD RULES ---
--- BEGIN 11 ACCESSIBILITY EXCERPT ---
{{a11y_11_excerpt}}
--- END 11 ACCESSIBILITY EXCERPT ---

TASK: Implement {{component_name}} as Fx{{component_pascal}} in {{framework}}
(React function component + TS | Vue 3 SFC + TS | standards-based web component).

Rules of engagement:
1. The contract is exhaustive. Implement EVERY prop, event, state, keyboard behavior,
   and ARIA attribute it lists — and NOTHING it doesn't. No convenience props, no extra
   variants, no "improved" API.
2. Anatomy classes must match the contract's part tree exactly (.fx-* names verbatim).
   States = .is-* class + ARIA attribute together (04 §1.2 rule 1).
3. Styles: emit a co-located stylesheet (or CSS-in-file for web components) using ONLY
   var(--fx-*) from the "Tokens consumed" table plus the 04 §1.4 baseline map. Where the
   table marks a c.* token "(proposed)", alias it to the semantic token given in the
   same row and add a comment citing 04 §1.4.
4. Controlled/uncontrolled per 04 §1.5 where the component bears a value.
5. Follow 04 §1.7 accessibility baseline: focus-visible outline via
   var(--fx-color-focus-ring); disabled semantics per contract (native disabled vs
   aria-disabled for composite items); loading = aria-busy + .is-loading, no layout
   shift; dev-error when an icon-only instance lacks aria-label.
6. Cite doc sections in comments for every non-obvious decision
   (e.g. // 04 §1.7.3: menu items stay focusable while disabled).
7. Anything the contract doesn't cover: TODO(ssot), do not guess.

OUTPUT, in order:
a. The component file (complete, compiling).
b. The stylesheet.
c. A props → contract traceability table (prop | contract line | implemented ✅).
d. Usage example (5–10 lines) showing default + one variant + one state.
e. The self-check list.
```

**Expected output shape.** One component file + one style file + traceability table + usage snippet + self-check. No storybook files, no tests (separate run), no barrel exports unless asked.

**Acceptance checklist**

- [ ] Every prop in the contract's table exists with the exact type/default; no extra props beyond 04 §1.3 common props.
- [ ] Anatomy diff: every `.fx-` part in the contract appears; no unlisted classes.
- [ ] Keyboard table reproduced behavior-for-behavior (spot-check 3 keys).
- [ ] Tokens: grep for `#`, `rgb(`, `px` outside canonical metrics — zero hits not covered by the contract's own tables.
- [ ] `:focus-visible` outline present; state classes paired with ARIA.
- [ ] Self-check rendered with evidence; all `TODO(ssot)` items are genuine contract gaps.

---

### P2 — Generate a full screen from its 08 spec

**Purpose.** Compose an entire screen from **existing** components per its Screen Specification. Composition only — the model may not invent components.

**Required context slots**

| Slot | Paste |
|---|---|
| `{{screen_spec_08}}` | The full screen spec from 08 (§2 flagship or §3 condensed) **plus 08 §1.1** cross-screen conventions. |
| `{{contracts_04}}` | The 04 contracts (full or condensed) of every component named in the spec's "Regions & components" table. Condensed is fine — the components already exist; the model needs props/events, not re-implementation detail. |
| `{{pattern_05}}` | The 05 pattern section(s) the spec instantiates (e.g. A3 Filtering, A13 Escrow Flow). |

**Template**

```text
--- BEGIN 08 SCREEN SPEC ---
{{screen_spec_08}}
--- END 08 SCREEN SPEC ---
--- BEGIN 04 CONTRACTS (components on this screen) ---
{{contracts_04}}
--- END 04 CONTRACTS ---
--- BEGIN 05 PATTERN(S) ---
{{pattern_05}}
--- END 05 PATTERN(S) ---

TASK: Implement the "{{screen_name}}" screen in {{framework}} for persona
{{persona}}, composing EXISTING Fx components only (import from '{{kit_import_path}}').

Rules of engagement:
1. COMPOSITION ONLY. You may create: the screen component, thin layout wrappers using
   space.* gap utilities, and data-wiring hooks/containers. You may NOT create new UI
   components, restyle kit components, or add classes to .fx- roots beyond className
   passthrough. If the spec names a component whose contract is NOT pasted above, STOP
   at that region: render `TODO(ssot): missing contract for <Component>` and report it —
   do not approximate it from divs.
2. Follow the spec's region order and wireframe. Exactly one primary-emphasis action,
   the one the spec names (03 §2 via 08).
3. Data requirements: wire the listed doc-09 endpoints; first-paint calls block with
   Skeleton Loader shapes as specified, deferred calls load after. Money renders from
   { amount, currency }; statuses render through the mapped components (Payment Status,
   Escrow Timeline) — never raw enum strings in the UI.
4. Implement every row of the spec's States field: loading skeleton regions, the named
   Empty State(s) with copy pointers as TODO(copy: 10 §5 "<row>") if exact copy is not
   pasted, error handling per 09 §4.4 mapping, permission-denied.
5. Interactions: implement the spec's numbered rules; where a rule says "per 05 §X",
   the pasted pattern section is normative.
6. Responsive deltas as specified over the canonical ranges (Mobile ≤767 / Tablet
   768–1023 / Desktop 1024–1439 / Wide ≥1440), mobile-first CSS.
7. Fire the spec's analytics events (screen_viewed once per navigation; action events
   on success).

OUTPUT, in order:
a. Screen component file(s) — screen + hooks/container if you split.
b. Region → component traceability table (spec region | components used | spec line).
c. A "not implemented / TODO(ssot)" list (empty if none).
d. The self-check list.
```

**Expected output shape.** 1–3 files (screen, optional container/hook), traceability table, TODO list, self-check. No new component files.

**Acceptance checklist**

- [ ] Every region in the spec's table appears in code, in order; no invented regions.
- [ ] All rendered components are canonical inventory names imported from the kit; zero bespoke `div`-widgets standing in for named components.
- [ ] One `data-variant="primary"` action visible per view.
- [ ] All States rows handled (loading/empty/error/permission-denied) — search for "empty", "skeleton", "error" in output.
- [ ] Endpoints, params, and pagination match the spec's Data requirements verbatim.
- [ ] Missing-contract regions stopped with `TODO(ssot)`, not faked.

---

### P3 — Generate a pattern instance from 05

**Purpose.** Apply a Pattern Library pattern (e.g. A1 CRUD, A5 Wizard, A4 Bulk Actions) to a new entity that has no dedicated screen spec yet — internal tools, new products, admin surfaces.

**Required context slots**

| Slot | Paste |
|---|---|
| `{{pattern_05}}` | The complete pattern section from 05 (Problem → Anti-patterns, all fields). |
| `{{contracts_04}}` | Condensed 04 contracts for the pattern's "Components used" list. |
| `{{api_09}}` | 09 §1 conventions; plus the entity's 09 §2 resource section if it exists, else a filled `{{entity_fields}}` parameter table you author (name, type, enum values, constraints). |

**Template**

```text
--- BEGIN 05 PATTERN ---
{{pattern_05}}
--- END 05 PATTERN ---
--- BEGIN 04 CONTRACTS ---
{{contracts_04}}
--- END 04 CONTRACTS ---
--- BEGIN 09 API CONVENTIONS / RESOURCE ---
{{api_09}}
--- END 09 ---

TASK: Instantiate the "{{pattern_name}}" pattern for entity "{{entity}}"
(fields: {{entity_fields}}) in {{framework}}, persona {{persona}}.

Rules of engagement:
1. The pattern's Behavior spec is a numbered test list — implement every rule and key
   your code comments to the rule numbers (// 05 A1.4: optimistic delete with undo).
2. Components used: only the pattern's named components (contracts pasted). The
   pattern's Anti-patterns section is a reject list — violating any entry fails review.
3. API shape: derive endpoints for {{entity}} from 09 §1 conventions (plural
   kebab-case, cursor pagination, error envelope, PATCH partial-merge, transitions as
   POST verbs). If the resource section is pasted, use it verbatim instead of deriving.
   Mark every endpoint you DERIVED (vs transcribed) with // derived per 09 §1.3 —
   backend must confirm.
4. Variations: pick the sanctioned variation matching the parameters above and say
   which; never invent an unsanctioned one.
5. Loading/empty/error per the pattern's behavior spec; copy slots as
   TODO(copy: 10 §<table>) unless copy is pasted.

OUTPUT, in order:
a. Implementation file(s).
b. Behavior-spec traceability: rule number | where implemented.
c. Derived-endpoint list for backend confirmation.
d. The self-check list.
```

**Expected output shape.** Implementation files + rule traceability + derived-endpoint list + self-check.

**Acceptance checklist**

- [ ] Every numbered behavior rule traceable to code; none skipped silently.
- [ ] No anti-pattern from the pasted section present.
- [ ] Derived endpoints follow 09 §1 to the letter (plural kebab-case, no `PATCH status`, cursor pagination) and are flagged for backend confirmation.
- [ ] Entity fields flow through validated forms / typed models, not `any`.

---

### P4 — Generate an API client / hooks module from 09

**Purpose.** Produce the typed client layer for a set of resources: request functions or hooks, error-envelope handling, cursor-pagination helper, idempotency keys, auth/refresh behavior.

**Required context slots**

| Slot | Paste |
|---|---|
| `{{api_conventions_09_s1}}` | 09 §1 in full (base URL/versioning, auth, naming, fields, requests, responses, pagination, filtering, errors, idempotency, rate limits, concurrency, misc). |
| `{{resources_09_s2}}` | The 09 §2 resource sections in scope (models + endpoint tables + scopes). |
| `{{client_guidance_09_s4}}` | 09 §4 (screen→endpoint map as needed, realtime rules, caching/ETag, error→UI mapping). |

**Template**

```text
--- BEGIN 09 §1 CONVENTIONS ---
{{api_conventions_09_s1}}
--- END 09 §1 ---
--- BEGIN 09 §2 RESOURCES ---
{{resources_09_s2}}
--- END 09 §2 ---
--- BEGIN 09 §4 CLIENT GUIDANCE ---
{{client_guidance_09_s4}}
--- END 09 §4 ---

TASK: Generate a typed API client module for resources: {{resource_list}}, in
TypeScript, style: {{client_style}} (plain fetch functions | React Query hooks |
SWR hooks). Runtime: {{runtime}}.

Rules of engagement:
1. TYPES ARE TRANSCRIPTION. Every interface field, optionality, and enum literal comes
   from the pasted resource models. id: string (ULID). Money = { amount: number;
   currency: string } with a doc comment "integer minor units". Timestamps are strings
   (ISO-8601 UTC). Closed enums (payment/escrow/order/listing/dispute status) are
   exhaustive unions; open enums get `| (string & {})` and UIs treat unknown as
   "unknown" (09 §1.1).
2. Error handling: one ApiError class wrapping the envelope
   { error: { code, message, details[], requestId } }. Consumers switch on error.code —
   expose code as a typed union of the pasted machine-code catalog. Implement the 09
   §4.4 ladder: unauthorized → single silent refresh then re-auth signal; rate_limited/
   service_unavailable → retry honoring Retry-After; precondition_failed/state_conflict
   → surface for refetch. Never retry non-idempotent POSTs automatically.
3. Pagination: one cursor helper — request ?cursor=&limit= (default 20, max 100),
   return { data, pageInfo: { nextCursor, hasMore } }, plus an iterate/loadMore utility.
   Cursors are opaque; never construct or parse them.
4. Idempotency: auto-generate and attach Idempotency-Key on POST /v1/orders,
   /v1/payment-intents, /v1/refunds, /v1/payouts (and expose an override). Re-submits
   after network failure reuse the SAME key.
5. Concurrency: PATCH on version-carrying admin resources requires ifMatch — make it a
   required parameter there, absent elsewhere.
6. Headers: Authorization Bearer injection point, X-Request-Id passthrough, ETag /
   If-None-Match support on the read endpoints 09 §4.3 prioritizes.
7. State transitions are POST verb methods (orders.deliver(id)), never a generic
   updateStatus. Filters/sort/include/fields params typed per endpoint allowlists —
   only the params the pasted tables document.

OUTPUT, in order:
a. types.ts (resource models + enums + error types).
b. client.ts core (transport, auth, errors, pagination, idempotency).
c. One file per resource (or hooks module) with all documented endpoints.
d. Endpoint traceability table (method+path | function/hook | scope | idem/if-match).
e. The self-check list.
```

**Expected output shape.** `types.ts` + `client.ts` + per-resource modules + traceability + self-check.

**Acceptance checklist**

- [ ] Zero endpoints/fields/enum values not present in the pasted 09 sections.
- [ ] Idempotency keys on exactly the four required POSTs; same-key reuse on retry.
- [ ] `error.code` union matches the machine-code catalog; no switching on HTTP status alone.
- [ ] Pagination helper never fabricates cursors; `hasMore`/`nextCursor` drive iteration.
- [ ] `If-Match` required where 09 §1.12 says so, impossible elsewhere.

---

### P5 — Generate form validation + copy from 04 + 10

**Purpose.** For one form, produce field validation rules wired to the Validation Message component with error copy that follows the 10 §6.2 formulas.

**Required context slots**

| Slot | Paste |
|---|---|
| `{{field_contracts_04}}` | 04 contracts of the field components used (Input, Currency Input, Select…) + the Validation Message contract. |
| `{{copy_rules_10}}` | 10 §6 (error messages, incl. §6.2 field patterns) + 10 §2 mechanics + 10 §3 terminology dictionary rows relevant to the form's domain. |
| `{{field_rules_08}}` | The screen spec's field/validation rules from 08 (or your authored field table: name, type, constraints, required). |

**Template**

```text
--- BEGIN 04 FIELD + VALIDATION MESSAGE CONTRACTS ---
{{field_contracts_04}}
--- END 04 ---
--- BEGIN 10 COPY RULES ---
{{copy_rules_10}}
--- END 10 ---
--- BEGIN FIELD RULES (08 / authored) ---
{{field_rules_08}}
--- END FIELD RULES ---

TASK: Produce the validation layer + user-facing messages for the "{{form_name}}"
form in {{framework}} (validation lib: {{validation_lib}} or none/plain).

Rules of engagement:
1. One schema/ruleset from the field rules — types, required, min/max, formats. Server
   remains authoritative: also map 09 validation_failed details[].field dot-paths back
   onto these fields; unmapped paths go to the form-level error summary.
2. Copy per 10 §6.2 formulas: state the requirement not the failure ("Enter a valid
   email address"); include the constraint with its value ("Price must be at least
   US$1.00"); required = "Enter a {field}" / "Select a {field}"; one message per field.
   Sentence case, no exclamation marks, terminology dictionary respected.
3. Wire to Validation Message per its contract (error tone + icon + text, associated
   via aria-describedby; role/live behavior exactly as the contract states). On submit
   failure, focus moves to the first invalid field.
4. Success confirmations only where 10 §6.2 sanctions them (anxiety-resolving checks),
   nowhere else.
5. Validation timing: per the pasted contracts/spec (typically validate on blur, re-
   validate on change once invalid) — if unspecified, TODO(ssot), don't invent policy.

OUTPUT, in order:
a. Schema/rules file.
b. Message catalog (field × rule → copy) as a typed object.
c. Wiring snippet (fields + Validation Message + submit handler with details[] mapping
   and first-invalid focus).
d. The self-check list.
```

**Expected output shape.** Schema + message catalog + wiring snippet + self-check.

**Acceptance checklist**

- [ ] Every message follows a 10 §6.2 formula; zero "Invalid X" phrasings; constraints state their values.
- [ ] `details[].field` dot-paths mapped; leftovers hit the summary, not a toast.
- [ ] `aria-describedby` wiring and first-invalid-field focus present.
- [ ] No stacked messages per field; no green ticks on every field.

---

### P6 — Write microcopy per 10

**Purpose.** Produce empty states, error messages, toasts, notifications, or CTA labels for a screen/feature — copy only, no code.

**Required context slots**

| Slot | Paste |
|---|---|
| `{{voice_10}}` | 10 §1 voice & tone + §2 mechanics. |
| `{{terminology_10_s3}}` | 10 §3 terminology dictionary — the whole table. This slot is mandatory for every P6 run. |
| `{{target_tables_10}}` | The 10 table(s) matching the copy type: §5 empty states, §6 errors, §7 confirmations, §8 toasts & notifications, §9 escrow & money language, §4 CTA rules. |
| `{{feature_context}}` | 2–5 sentences you write: persona, screen, what happened/what's empty, what the user can do next, any amounts/objects involved. |

**Template**

```text
--- BEGIN 10 VOICE & MECHANICS ---
{{voice_10}}
--- END 10 ---
--- BEGIN 10 §3 TERMINOLOGY DICTIONARY ---
{{terminology_10_s3}}
--- END 10 §3 ---
--- BEGIN 10 TARGET TABLES ---
{{target_tables_10}}
--- END 10 ---
--- FEATURE CONTEXT ---
{{feature_context}}
--- END CONTEXT ---

TASK: Write {{copy_type}} copy (empty state | error set | toast/notification set |
confirmation dialog | CTA labels) for the context above, persona {{persona}}.

Rules of engagement:
1. Reuse before writing: if a pasted table row already covers this case, return that
   row verbatim and say so. New copy only for genuinely uncovered cases.
2. Formulas are binding — empty state: what this is → why empty → what next + one CTA,
   ≤ 2 sentences; error: what happened + why (if known) + recovery, ≤ 2 sentences,
   never "Oops", never bare "Something went wrong!"; toast ≤ 60 chars, object named;
   money copy always states amount + currency and whether money moved.
3. Terminology dictionary is law — run every noun/verb against it. A right-column
   word is a defect.
4. Sentence case; no exclamation marks in errors; CTAs verb-first and specific; the
   CTA must be performable NOW by this persona.
5. Distinguish first-run empty vs filtered-empty when writing empty states.
6. For each string, name the doc-10 table/row pattern it instantiates.

OUTPUT: a table — surface | string | 10 §/row it follows | notes (placeholders like
{amount} typed). Then the self-check list (items 3, 5, 6 apply; mark 1–2, 4 n/a).
```

**Expected output shape.** A copy table with provenance per string; no code.

**Acceptance checklist**

- [ ] Every string traceable to a 10 formula/table; reused rows marked as verbatim.
- [ ] Dictionary scan clean (spot-check: product/login/ticket/basket absent).
- [ ] Lengths within formula budgets; toasts ≤ 60 chars.
- [ ] Money strings carry amount + currency + moved/not-moved.

---

### P7 — Accessibility audit against 11

**Purpose.** Audit existing code (component, screen, or diff) against the Accessibility Guide; output a violations table with WCAG SC references and concrete fixes.

**Required context slots**

| Slot | Paste |
|---|---|
| `{{a11y_11}}` | 11 §2 keyboard + §3 focus + §4 ARIA + §6 color & contrast at minimum; add §7 touch, §8 motion, §9 forms as relevant. |
| `{{contracts_04}}` | 04 contracts of the components in the code (keyboard/ARIA blocks are the per-component ground truth). |
| `{{code_under_audit}}` | The code, complete files preferred over fragments. |

**Template**

```text
--- BEGIN 11 ACCESSIBILITY GUIDE EXCERPTS ---
{{a11y_11}}
--- END 11 ---
--- BEGIN 04 CONTRACTS ---
{{contracts_04}}
--- END 04 ---
--- BEGIN CODE UNDER AUDIT ---
{{code_under_audit}}
--- END CODE ---

TASK: Audit the code against WCAG 2.2 AA as specified by the pasted doc-11 excerpts
and doc-04 contracts. Static analysis only — state what you cannot verify statically
(real contrast ratios, SR announcement timing) as "needs runtime check" rather than
guessing a pass.

For every violation report:
| # | Severity (blocker/major/minor) | Location (file:line or element) | What's wrong |
Rule violated (11 §x.y and/or 04 contract line) | WCAG SC (e.g. 2.4.7 Focus Visible,
4.1.2 Name Role Value) | Concrete fix (code-level, using kit conventions) |

Sweep at minimum:
1. Keyboard: reachability, operability, APG pattern conformance, focus order vs visual
   order, traps (only where sanctioned: modal).
2. Focus: :focus-visible via var(--fx-color-focus-ring), outline never removed
   without replacement, focus return on overlay close.
3. ARIA: state class ↔ attribute pairing (.is-open ↔ aria-expanded…), icon-only
   aria-label, live regions (role="status" vs role="alert"), name/role/value on
   custom widgets.
4. Color/contrast: tone conveyed with icon/text not color alone; literals that bypass
   the token pairs (any hex/rgb is BOTH a token defect and a contrast risk).
5. Touch: 44×44 target rule, hover-only affordances.
6. Motion: prefers-reduced-motion honored for any animation.
7. Forms: label association, error announcement, aria-describedby.

OUTPUT: violations table (sorted by severity) → "needs runtime check" list → a
3-line summary (counts per severity) → the self-check list (audits: items 3 and 6
apply — every cited rule must exist in the pasted excerpts; no invented SC numbers).
```

**Expected output shape.** Violations table + runtime-check list + summary + self-check. No rewritten files (fixes are per-row snippets).

**Acceptance checklist**

- [ ] Every row cites a real pasted rule AND a real WCAG 2.2 SC number.
- [ ] No hallucinated passes: unverifiable items are in the runtime-check list.
- [ ] Fixes use kit conventions (tokens, `.is-*` + ARIA pairing), not generic advice.
- [ ] Severity honest: missing focus outline / keyboard trap = blocker, not minor.

---

### P8 — Design-review a PR/diff against 03 + 04

**Purpose.** Review a diff for UX-rule and contract violations: anti-pattern catalog, token discipline, hierarchy, naming, state vocabulary.

**Required context slots**

| Slot | Paste |
|---|---|
| `{{ux_bible_03}}` | 03 §1 (testable principles C/S/P/A/M) + §2 (hierarchy & density); add §3 feedback / §5 safety ladder when the diff touches async ops or destructive actions. |
| `{{global_contracts_04_s1}}` | 04 §1 complete (naming, common props, token discipline, controlled/uncontrolled, events, a11y baseline, type vocabulary). |
| `{{tokens_01_s4}}` | 01 §4 hard rules. |
| `{{contracts_04}}` | Contracts of components the diff touches or composes. |
| `{{diff}}` | The unified diff (or full changed files). |

**Template**

```text
--- BEGIN 03 UX BIBLE EXCERPTS ---
{{ux_bible_03}}
--- END 03 ---
--- BEGIN 04 §1 GLOBAL CONTRACTS ---
{{global_contracts_04_s1}}
--- END 04 §1 ---
--- BEGIN 01 §4 HARD RULES ---
{{tokens_01_s4}}
--- END 01 §4 ---
--- BEGIN 04 CONTRACTS (touched components) ---
{{contracts_04}}
--- END 04 ---
--- BEGIN DIFF ---
{{diff}}
--- END DIFF ---

TASK: Design-review this diff. You are the reviewer of record for docs 01/03/04
compliance; functional correctness is out of scope.

Check, in this order:
1. Token discipline (01 §4): any hex/rgb/raw-px/literal z-index/hard-coded font size
   in added lines → REQUEST CHANGES, per-line.
2. Naming (04 §1.2): Fx/.fx-/.is-/data-* conventions; modifier classes
   (.fx-x--primary) are defects; state class without matching ARIA attribute is a
   defect.
3. Contract fidelity: props/events/variants used on kit components exist in the pasted
   contracts with correct types; invented props flagged.
4. Hierarchy (03 §2): one primary action per view; whitespace-over-borders; text.*
   composites only; ≤ 2 nesting levels in content.
5. UX-rule ids: check the diff against every C/S/P/A/M rule in the pasted 03 excerpt
   that its surface type makes applicable; cite rule ids (e.g. "violates 03 C7").
6. Vocabulary drift: sizes outside sm|md|lg, tones outside the 5, statuses outside
   the 04 §5 enums, terminology-dictionary violations in added strings.

OUTPUT:
a. Verdict: APPROVE | APPROVE WITH NITS | REQUEST CHANGES.
b. Findings table: # | severity | file:line | finding | rule id (01 §4.n / 03 Xn /
   04 §1.n) | suggested change.
c. Positive-confirmation list: which checks passed with evidence (not just silence).
d. The self-check list (items 3 and 6: every cited rule id exists in pasted context).
```

**Expected output shape.** Verdict + findings table + positive confirmations + self-check.

**Acceptance checklist**

- [ ] Any literal color/px in added lines produced REQUEST CHANGES.
- [ ] Every finding carries a rule id present in the pasted excerpts.
- [ ] Passed checks are positively confirmed, not implied.
- [ ] No style-preference comments dressed up as rules.

---

### P9 — Draft a new screen spec in 08's template

**Purpose.** For designers/PMs extending the system: draft a screen spec that slots into 08 §3 (condensed) or §2 (full), using only canonical components, patterns, and API conventions. Output is a **draft for human review**, never auto-merged.

**Required context slots**

| Slot | Paste |
|---|---|
| `{{spec_template_08_s1}}` | 08 §1 (how to read a screen spec + §1.1 conventions + §1.2 permission vocabulary). |
| `{{exemplar_08}}` | One existing full spec from 08 §2 closest in shape to the new screen. |
| `{{inventories_readme}}` | README canonical component inventory + canonical screen inventory. |
| `{{ia_06_excerpt}}` | The 06 URL-scheme/sitemap section for the persona area the screen lives in. |
| `{{screen_brief}}` | Your brief: persona, purpose, data involved, entry points, one primary action. |

**Template**

```text
--- BEGIN 08 §1 SPEC TEMPLATE & CONVENTIONS ---
{{spec_template_08_s1}}
--- END 08 §1 ---
--- BEGIN 08 EXEMPLAR SPEC ---
{{exemplar_08}}
--- END EXEMPLAR ---
--- BEGIN README CANONICAL INVENTORIES ---
{{inventories_readme}}
--- END INVENTORIES ---
--- BEGIN 06 IA EXCERPT ---
{{ia_06_excerpt}}
--- END 06 ---
--- BEGIN SCREEN BRIEF ---
{{screen_brief}}
--- END BRIEF ---

TASK: Draft a {{full_or_condensed}} screen specification for "{{screen_name}}" in
exactly the 08 §1 field order, mirroring the exemplar's level of detail.

Rules of engagement:
1. Components: canonical inventory names VERBATIM, only. If the screen genuinely needs
   a component that does not exist, do NOT name a new one inside the spec — add a
   "Proposed components" appendix describing the gap and the nearest existing
   component, marked TODO(ssot: 04 addition required).
2. Route follows the 06 scheme; personas/permissions from the pasted §1.2 vocabulary.
3. Exactly one primary action; state it in Purpose.
4. Data requirements in 09 conventions; if endpoints don't exist yet, write them in
   09 §1 style and mark each (proposed).
5. ASCII wireframe for the desktop range; mobile wireframe only if structure differs.
6. States: loading skeleton regions, first-run AND filtered empty where the screen
   lists things, error, permission-denied. Copy pointers to 10 tables, not inline copy.
7. Analytics: screen_viewed + snake_case action events.
8. Mark the whole output DRAFT — FOR HUMAN REVIEW at top.

OUTPUT: the spec in 08 markdown format → Proposed components/endpoints appendix →
open questions list → the self-check list.
```

**Expected output shape.** One markdown spec + proposals appendix + open questions + self-check.

**Acceptance checklist**

- [ ] Field order matches 08 §1 exactly; nothing renamed.
- [ ] Every component name greps against the README inventory; new needs live only in the appendix.
- [ ] One primary action; permissions use §1.2 ids; enums use 04 §5 values.
- [ ] Proposed endpoints marked `(proposed)` and 09-conventional.

---

### P10 — Generate mock/fixture data matching 09 resource shapes

**Purpose.** Deterministic fixtures for tests, storybook-style harnesses, and previews: valid enums, ULIDs, Money objects, coherent state combinations.

**Required context slots**

| Slot | Paste |
|---|---|
| `{{resources_09_s2}}` | The 09 §2 resource model sections to mock (field tables / JSON examples). |
| `{{field_rules_09_s14}}` | 09 §1.4 field naming & common fields + §1.7 pagination shape. |
| `{{enums_04_s5}}` | 04 §5 canonical domain enums + status→tone table (for coherence rules). |

**Template**

```text
--- BEGIN 09 §2 RESOURCE MODELS ---
{{resources_09_s2}}
--- END 09 §2 ---
--- BEGIN 09 §1.4 / §1.7 FIELD & PAGE RULES ---
{{field_rules_09_s14}}
--- END 09 §1 ---
--- BEGIN 04 §5 CANONICAL ENUMS ---
{{enums_04_s5}}
--- END 04 §5 ---

TASK: Generate fixture data for {{resource_list}} in {{output_format}}
(TS module with typed exports | JSON files), {{count}} records per resource,
seedable/deterministic (seed: {{seed}}).

Rules of engagement:
1. Shapes are transcription: every field from the pasted models, camelCase, correct
   optionality. No extra fields, no snake_case keys.
2. ids: valid 26-char Crockford-base32 ULIDs, lexically increasing with createdAt
   (ULIDs sort by creation time — 09 §1.4). Foreign keys reference ids that exist in
   the sibling fixtures.
3. Money: { amount: <integer minor units>, currency: "USD" } (vary currency only if
   asked). Never floats, never negative (direction is in the field name).
4. Timestamps: ISO-8601 UTC with milliseconds and Z, ending in At;
   createdAt ≤ updatedAt ≤ domain-event timestamps.
5. Enums: values verbatim from 04 §5 / the pasted models. COHERENCE RULES: an order's
   paymentStatus/escrow stage/order status must be a legal combination (e.g. escrow
   stage released ⇒ payment status released; stage disputed ⇒ order status disputed);
   spread records across the enum space including at least one of each closed-enum
   value; include the edge states (partially_refunded, on_hold, failed).
6. Collections wrap as { data: [...], pageInfo: { nextCursor, hasMore } } with a real
   opaque-looking cursor string on non-final pages and nextCursor: null on the last.
7. Realistic-but-fake content: no real names/emails/domains (use example.com), no
   lorem ipsum in user-visible strings (10's no-lorem spirit) — plausible marketplace
   content ("Vintage brass desk lamp").

OUTPUT: fixture file(s) → a coverage note (which enum values appear where) → the
self-check list (item 3 is the load-bearing one).
```

**Expected output shape.** Fixture files + enum coverage note + self-check.

**Acceptance checklist**

- [ ] Random-sample 3 records: fields/types match the pasted model exactly.
- [ ] All closed-enum values represented; combinations legal per the coherence rules.
- [ ] ULIDs valid, sortable, cross-referenced; Money integers; timestamps ordered.
- [ ] Collection wrapper matches 09 §1.7 including terminal `nextCursor: null`.

---

### P11 — Theme/brand check against 01 §3

**Purpose.** Given a product's Brand config, verify (or derive) correct usage: no new colors, semantic-pair usage only, contrast pairs intact, brand knobs instead of raw token edits.

**Required context slots**

| Slot | Paste |
|---|---|
| `{{tokens_01}}` | The entire `01-design-tokens.md` (65 lines — always paste whole). |
| `{{brand_config}}` | The Brand object under test (primary/secondary colors, fonts, radius preset, container width, fontScale, density). |
| `{{usage_under_test}}` | Optional: stylesheet/theme code claiming to implement the brand. |

**Template**

```text
--- BEGIN 01 DESIGN TOKENS (FULL) ---
{{tokens_01}}
--- END 01 ---
--- BEGIN BRAND CONFIG ---
{{brand_config}}
--- END BRAND ---
--- BEGIN USAGE UNDER TEST (optional) ---
{{usage_under_test}}
--- END USAGE ---

TASK: {{check_or_derive}} (check: audit the usage against the brand + 01 rules |
derive: state what the themed UI may and may not do given this brand).

Rules of engagement:
1. Brand is the ONLY theming surface (01 §3): primary/secondary colors, fonts, radius
   preset, container width, fontScale, density. Everything else derives via
   applyBrand — hover/active shades, on-* contrast picks, focus ring. Flag any
   hand-picked hover shade, any third accent color, any direct --fx-* value
   assignment, any ref.* re-point outside a theme definition.
2. No new colors: UI code may consume only the semantic tokens listed in 01 §2, and
   only in the shipped pairs (text-on-fill = the paired on-* token). A new
   combination requires the same contrast gate FDS uses — flag as
   TODO(ssot: contrast gate run required), never approve on eyeballing. Do NOT
   claim numeric contrast ratios you cannot compute from pasted values.
3. Scheme correctness: components stay scheme-agnostic (semantic vars only); scheme
   switching only via data-fx-scheme; scoped themes only via [data-fx-theme].
4. Density/fontScale: spacing must ride the space.* ramp (density rescales it) —
   custom margins compensating for density are defects; font sizes only via text.*
   composites (fontScale-driven).

OUTPUT:
a. Verdict per concern: colors | pairs/contrast | scheme | typography | spacing —
   PASS / FAIL / NEEDS GATE, with the 01 rule cited.
b. Findings table for FAILs (location | violation | 01 rule | fix).
c. If deriving: the "allowed palette" — the exact token ids this UI may use and the
   pairs they must appear in.
d. The self-check list.
```

**Expected output shape.** Per-concern verdicts + findings + (optionally) allowed-palette + self-check.

**Acceptance checklist**

- [ ] No approval of unverifiable contrast — new pairs are NEEDS GATE, not PASS.
- [ ] Every hand-authored `--fx-*` value or off-Brand knob flagged.
- [ ] Derivation output lists token ids only — zero hex in the answer.

---

### P12 — Migration/refactor: bring legacy UI into compliance

**Purpose.** Convert legacy UI code (pre-kit, other design system, raw CSS) to Flexa compliance. Two-phase by design: inventory mapping first (human-approved), then per-component rewrites.

**Required context slots**

| Slot | Paste |
|---|---|
| `{{tokens_01_s4}}` | 01 §4 hard rules. |
| `{{global_contracts_04_s1}}` | 04 §1 global contracts. |
| `{{inventory_readme}}` | README canonical component inventory. |
| `{{legacy_code}}` | The legacy code (per screen or module — keep runs small). |
| `{{contracts_04}}` | Phase 2 only: contracts of the mapped target components. |

**Template — Phase 1 (inventory & mapping)**

```text
--- BEGIN 01 §4 HARD RULES ---
{{tokens_01_s4}}
--- END 01 §4 ---
--- BEGIN 04 §1 GLOBAL CONTRACTS ---
{{global_contracts_04_s1}}
--- END 04 §1 ---
--- BEGIN README CANONICAL COMPONENT INVENTORY ---
{{inventory_readme}}
--- END INVENTORY ---
--- BEGIN LEGACY CODE ---
{{legacy_code}}
--- END LEGACY ---

TASK — PHASE 1 (mapping only, NO rewritten code): inventory the legacy UI and map it
onto the Flexa kit.

OUTPUT:
a. Mapping table: legacy element/widget | occurrences | target canonical component
   (verbatim inventory name) | mapping confidence (exact | approximate | NO MATCH)
   | notes (props to carry over, behavior gaps).
   NO MATCH rows name the nearest component and what's missing — never invent a
   target. NO MATCH is a valid, expected answer.
b. Token-debt table: literal values found (hex/px/z-index/font-size) | count |
   candidate token id | UNMAPPABLE where no token fits (01 §4.5 documented-literal
   candidates).
c. Vocabulary-debt list: legacy size/variant/status words → sm|md|lg /
   primary|secondary|ghost|danger / the 5 tones / 04 §5 enums.
d. Risk list: behavior the rewrite will CHANGE (legacy a11y bugs that compliance
   fixes, hover-only affordances that must gain focus equivalents…).
e. Suggested rewrite order (leaf components before composites).
f. The self-check list.
STOP after Phase 1. Await human approval of the mapping before any rewrite.
```

**Template — Phase 2 (per-component rewrite; one component per run)**

```text
--- BEGIN APPROVED PHASE-1 MAPPING ROW(S) ---
{{approved_mapping}}
--- END MAPPING ---
--- BEGIN 04 CONTRACT (target component) ---
{{contracts_04}}
--- END 04 ---
--- BEGIN 01 §4 HARD RULES ---
{{tokens_01_s4}}
--- END 01 §4 ---
--- BEGIN LEGACY SOURCE (this component only) ---
{{legacy_code}}
--- END LEGACY ---

TASK — PHASE 2: rewrite the legacy component as its mapped Fx target per the pasted
contract (P1 rules of engagement apply in full). Additionally:
1. Preserve observable behavior EXCEPT where the contract mandates otherwise; list
   every intentional behavior change with its rule citation.
2. Produce a call-site migration note: old props/classes → new props/data-attributes.
3. Where legacy behavior has no contract equivalent, TODO(ssot) + keep the legacy
   behavior quarantined behind a clearly named wrapper, don't graft it onto the Fx
   component.
OUTPUT: rewritten files → behavior-change table → call-site migration note → the
self-check list.
```

**Expected output shape.** Phase 1: tables only. Phase 2: P1-shaped output + behavior-change table + migration note.

**Acceptance checklist**

- [ ] Phase 1 emitted zero rewritten code; NO MATCH used instead of invented components.
- [ ] Every literal in the token-debt table resolved to a token id or explicitly UNMAPPABLE.
- [ ] Phase 2 behavior changes each cite a rule; no silent regressions or "improvements".
- [ ] Call-site note covers every legacy prop/class.

---

## 4. Few-shot example — P1 filled in for Button

Abbreviated run: system message = §2 preamble; user message = P1 template with `{{component_name}}` = Button, `{{framework}}` = React + TS, and the Button contract from 04 §2, 01 §4, and the 11 button rows pasted into the slots. Below, the *shape* of an ideal answer and three labeled failures.

### 4.1 Ideal output excerpt (~30 lines, abridged)

```tsx
// FxButton.tsx — implements 04 §2 Button contract
import './fx-button.css';

export interface FxButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; // 04 §1.9 Variant
  size?: 'sm' | 'md' | 'lg';                              // 04 §1.3
  disabled?: boolean;
  loading?: boolean;                                      // aria-busy + .is-loading, 04 §1.7.4
  iconOnly?: boolean;                                     // requires aria-label, 04 §1.7.5
  onClick?: (e: React.MouseEvent) => void;
  // …contract props only; aria-*/data-* pass through (04 §1.3)
}

export const FxButton = React.forwardRef<HTMLButtonElement, FxButtonProps>(
  ({ variant = 'secondary', size = 'md', disabled, loading, iconOnly, children, ...rest }, ref) => {
    if (process.env.NODE_ENV !== 'production' && iconOnly && !rest['aria-label']) {
      throw new Error('FxButton: icon-only buttons require aria-label (04 §1.7.5)');
    }
    return (
      <button
        ref={ref}                                    // ref → root interactive element, 04 §1.3
        type="button"
        className={cx('fx-button', loading && 'is-loading', rest.className)}
        data-variant={variant}                       // modifier = data attribute, 04 §1.2.2
        data-size={size}
        disabled={disabled || loading}               // standalone control: native disabled, 04 §1.7.3
        aria-busy={loading || undefined}             // state class + ARIA together, 04 §1.2.1
        onClick={disabled || loading ? undefined : rest.onClick}
      >
        {loading && <span className="fx-button-spinner" aria-hidden="true" />}
        <span className="fx-button-label">{children}</span>{/* label stays visible while loading, 03 §3 */}
      </button>
    );
  }
);
```

```css
/* fx-button.css — tokens only (01 §4) */
.fx-button {
  height: 40px;                                   /* md control metric, 04 §1.4 canonical table */
  padding-inline: var(--fx-space-4);
  gap: var(--fx-space-2);
  border-radius: var(--fx-c-button-radius);       /* shipped c.* token, 04 §1.4 */
  font: var(--fx-text-body);
  transition: background-color var(--fx-motion-duration-fast) var(--fx-motion-easing-standard);
}
.fx-button[data-variant='primary']       { background: var(--fx-color-primary); color: var(--fx-color-on-primary); }
.fx-button[data-variant='primary']:hover { background: var(--fx-color-primary-hover); }
.fx-button:focus-visible { outline: 2px solid var(--fx-color-focus-ring); outline-offset: 2px; } /* 04 §1.7.2 */
.fx-button:disabled      { opacity: var(--fx-opacity-disabled); }
@media (prefers-reduced-motion: reduce) { .fx-button { transition: none; } } /* 01 § Motion */
```

…followed by the traceability table, usage example, and the rendered self-check (all six items with one-line evidence).

### 4.2 What a WRONG output looks like (three labeled violations)

```tsx
// ❌ VIOLATION 1 — hex literal (01 §4.1): a token exists for this exact purpose.
//    Must be: background: var(--fx-color-primary); hover via --fx-color-primary-hover.
const style = { background: '#4f46e5' };

// ❌ VIOLATION 2 — div-with-onclick (04 §1.7.1 / 11 §2, WCAG 4.1.2): not keyboard
//    reachable, no role, no name; also a modifier CLASS instead of data-variant
//    (04 §1.2.2). Must be a <button> with data-variant="primary".
<div className="fx-button fx-button--primary" onClick={submit}>Buy now</div>

// ❌ VIOLATION 3 — invented prop and vocabulary drift (04 §1.9): 'xl' is not a Size
//    (sm|md|lg) and `pill` is not in the contract. Correct behavior: emit
//    TODO(ssot: Button contract has no pill/xl) and stop — never extend the API.
<FxButton size="xl" pill tone="brand">Checkout</FxButton>
```

A model that produces any of the three has ignored the pasted contract; reject the run (see §5), do not hand-fix.

---

## 5. Anti-drift rules for AI output

Binding for every prompt run; the preamble encodes them, reviewers enforce them.

1. **Never invent.** No new tokens (`--fx-*`, `c.*`), no new components or part classes, no new props/events, no new endpoints or query params, no new enum values, no new terminology. The pasted context is a closed world. "It obviously needs X" is precisely the drift this library exists to stop.
2. **Gap ⇒ `TODO(ssot)` ⇒ stop.** When the pasted contract lacks something the task needs, the model emits `TODO(ssot): <missing thing, owning doc>` at the site, leaves the gap inert (no fallback behavior), and lists it in the summary. Guessed fills are worse than gaps: gaps are visible, guesses ship.
3. **Cite the doc section for every non-obvious decision** in code comments (`// 04 §1.7.3`, `// 09 §1.10`, `// 10 §6.2`). Uncited surprising decisions are treated as inventions during review. Citations must point into the *pasted* excerpts — a citation to a section that wasn't pasted means the model is hallucinating authority.
4. **The self-check is mandatory output.** Every response ends with the six-item list from §2, each item ✅/❌ plus one line of evidence. A response without it, or with bare ✅s and no evidence, is rejected unread. The self-check the model must repeat:
   - [ ] 1. Zero color/size/shadow/z-index literals; every style value is `var(--fx-*)`.
   - [ ] 2. All names follow `Fx` / `.fx-` / `.is-*` / `data-*`; no invented modifiers.
   - [ ] 3. Every enum/prop/token/endpoint used appears verbatim in the pasted context.
   - [ ] 4. Keyboard + ARIA per the pasted contract; focus-visible present.
   - [ ] 5. All user-facing strings follow doc 10 (sentence case, terminology dictionary).
   - [ ] 6. Unknowns emitted as `TODO(ssot)`, not guessed.
5. **Reject-and-rerun beats hand-fixing.** If review finds a category-1 violation (literal, invented API, missing a11y), fix the *prompt run* (wrong/missing slot content? task overloaded?) and re-execute, rather than patching output. Hand-patched AI output re-drifts on the next generation; corrected inputs don't.
6. **Provenance in commits.** Code produced through this library notes the prompt id and doc versions in the PR description (`generated: P1 (Button) against 04@<commit>`), so audits can replay the run.

---

## 6. Maintenance

- **Prompts version with the docs.** This library is pinned to the SSOT set as of FDS v2.9.x / the doc versions in this repo. Any normative change to docs 1–11 requires re-testing the prompts that paste from the changed doc *before* the change merges — the routing table in §1.2 is also the re-test matrix, read right-to-left:

| Doc changed | Re-test prompts |
|---|---|
| 01 tokens / FDS version bump | P1, P2, P8, P11, P12 (+ §2 preamble token lines, §4 example CSS) |
| 03 UX Bible | P2, P8 (+ preamble only if a non-negotiable changed) |
| 04 Component Bible §1 or §5 | **All** — §1/§5 feed the preamble (naming, vocabulary, enums). Individual §2/§3 contract edits: P1, P2, P5, P12 for that component. |
| 05 Pattern Library | P2, P3 |
| 06 IA / 08 Screen Specs | P2, P9 |
| 09 API Contract | P3, P4, P10 (+ preamble API block; error-code catalog changes also touch P5) |
| 10 Copywriting | P5, P6 (+ preamble copy block; dictionary edits invalidate cached `{{terminology_10_s3}}` pastes) |
| 11 Accessibility | P1, P7, P8 (+ preamble a11y block) |
| README inventories/conventions | P2, P9, P12 (+ §1.2 routing table itself) |

- **Re-test procedure:** run the affected prompt once against a known-good fixture task (Button for P1, Orders List for P2, order fixtures for P10), diff the output against the previous accepted run, and confirm the self-check still passes. Behavioral drift with unchanged inputs ⇒ tighten the template, not the reviewer.
- **Enum/preamble drift is the highest-severity failure mode:** the preamble hard-codes the doc 04 §5 closed enums for defense in depth. Whenever 04 §5 changes, updating §2 here is part of that PR — a stale preamble actively *teaches* models the wrong values.
- **New task types** get a new `P<n>` section with all five fields (purpose, slots, template, output shape, checklist) — never a "quick prompt" pasted in chat and lost. One prompt, one owner section, same discipline as the rest of the SSOT.

---

*End of 12 — Flexa Prompt Library. The library governs how AI touches the system; docs 1–11 govern what the system is. When output and doc disagree, the doc wins; when two docs disagree, the README precedence order wins; when the doc is silent, the output says `TODO(ssot)` and a human decides.*
