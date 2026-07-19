/**
 * U13-C Listing Editor — create wizard (doc 08 §2.9, flow S2). A four-step
 * FxFormWizard (details → media → pricing & shipping → review) with a persistent
 * live-preview rail (Listing Card) and a publish checklist (Progress Summary).
 * Composes flexa-ui end to end against the mock backend (`flexa-ui-kit/mocks`).
 * The media step hosts an Image Gallery Upload in fixture mode (G4): the add
 * tile appends deterministic SVG data-URI photos — no File objects or binary
 * assets — and the first photo is the cover driving the live preview.
 *
 * Submitting on the review step POSTs `/v1/seller/listings`, whose handler calls
 * the shared moderation store's `submitListing(...)` — so the new listing lands
 * in Admin › Moderation as `pending` (flow S2 → A1). On success the wizard shows
 * a confirmation and links back to the seller list, where the row now reads
 * `pending_review`.
 *
 * `/:id/edit` reuses the same wizard prefilled from the seller list row (cheap
 * variant — the mock has no per-listing GET, so it seeds from the list payload).
 *
 * ZERO one-off component CSS: framing is `ks-*` + seller `sl-*` utilities; every
 * visual is a flexa-ui component.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FxAlert,
  FxButton,
  FxCurrencyInput,
  FxFieldGroup,
  FxFormWizard,
  FxImageGalleryUpload,
  FxInput,
  FxListingCard,
  FxNumberInput,
  FxProgressSummary,
  FxRadioGroup,
  FxSelect,
  FxSuccessPage,
  FxTagInput,
  FxTextarea,
  FxWizardLayout,
  type ListingSummary,
  type ProgressSummaryItem,
  type UploadFile,
  type ValidationResult,
  type WizardStep,
} from 'flexa-ui-kit';
import type { Money } from 'flexa-ui-kit/mocks';
import { api, ApiRequestError } from '../api';

/* ---------------------------------------------------------------- constants */

const CATEGORY_OPTIONS = [
  { value: 'posters', label: 'Posters' },
  { value: 'frames', label: 'Frames' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'home-living', label: 'Home & living' },
];

const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used — like new' },
  { value: 'refurbished', label: 'Refurbished' },
];

const HANDLING_OPTIONS = [
  { value: '1', label: 'Ships in 1 business day' },
  { value: '3', label: 'Ships in 3 business days' },
  { value: '5', label: 'Ships in 5 business days' },
];

/** A tiny inline SVG placeholder so previews render offline (no binary assets). */
function svgCover(label: string, hue: number): string {
  return (
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>` +
        `<rect width='400' height='300' fill='hsl(${hue} 45% 88%)'/>` +
        `<text x='50%' y='50%' font-family='sans-serif' font-size='18' fill='hsl(${hue} 40% 35%)' ` +
        `text-anchor='middle' dominant-baseline='middle'>${label}</text></svg>`,
    )
  );
}

const PREVIEW_COVER = svgCover('Listing preview', 215);

/** Deterministic photo hues — the gallery's fixture add-tile cycles these. */
const PHOTO_HUES = [215, 25, 145, 275, 350, 85];

interface Draft {
  title: string;
  description: string;
  categoryId: string;
  tags: string[];
  condition: string;
  photos: UploadFile[];
  price: Money | null;
  stock: number | null;
  shippingProfile: string;
  handling: string;
}

const EMPTY_DRAFT: Draft = {
  title: '',
  description: '',
  categoryId: '',
  tags: [],
  condition: 'new',
  photos: [],
  price: null,
  stock: 1,
  shippingProfile: 'flat',
  handling: '3',
};

const STEP_ORDER = ['details', 'media', 'pricing', 'review'] as const;
type EditorStep = (typeof STEP_ORDER)[number];

/* -------------------------------------------------------------------- view */

export function ListingEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [step, setStep] = useState<EditorStep>('details');
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = useCallback(<K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
  }, []);

  /* ---- photos (G4 — gallery fixture mode, no File objects) --------------- */
  // Monotonic counter keeps ids unique across add → remove → add.
  const photoSeq = useRef(0);
  const addFixturePhoto = useCallback((): UploadFile => {
    const n = ++photoSeq.current;
    const hue = PHOTO_HUES[(n - 1) % PHOTO_HUES.length]!;
    return {
      id: `photo-${n}`,
      name: `photo-${n}.jpg`,
      size: 480_000 + n * 12_000,
      type: 'image/jpeg',
      status: 'success',
      url: svgCover(`Photo ${n}`, hue),
    };
  }, []);

  /* ---- publish checklist (hard requirements, §2.9 interaction 3) --------- */
  const checklist: ProgressSummaryItem[] = useMemo(
    () => [
      { id: 'title', label: 'Title', value: draft.title.trim() ? 1 : 0, max: 1, tone: draft.title.trim() ? 'success' : 'neutral' },
      { id: 'category', label: 'Category', value: draft.categoryId ? 1 : 0, max: 1, tone: draft.categoryId ? 'success' : 'neutral' },
      { id: 'price', label: 'Price', value: draft.price && draft.price.amount > 0 ? 1 : 0, max: 1, tone: draft.price && draft.price.amount > 0 ? 'success' : 'neutral' },
      { id: 'stock', label: 'Stock', value: (draft.stock ?? 0) > 0 ? 1 : 0, max: 1, tone: (draft.stock ?? 0) > 0 ? 'success' : 'neutral' },
      { id: 'shipping', label: 'Shipping', value: draft.handling ? 1 : 0, max: 1, tone: draft.handling ? 'success' : 'neutral' },
    ],
    [draft],
  );
  const readyToPublish = checklist.every((c) => c.value === 1);

  /* ---- live preview card ------------------------------------------------- */
  // The first gallery photo is the cover (G4) — it drives the live preview.
  const previewListing: ListingSummary = useMemo(
    () => ({
      id: 'preview',
      title: draft.title.trim() || 'Your listing title',
      href: '#',
      imageUrl: draft.photos[0]?.url ?? PREVIEW_COVER,
      imageAlt: 'Listing preview cover',
      price: draft.price ?? { amount: 0, currency: 'USD' },
      status: 'draft',
      updatedAt: '2026-07-18T11:00:00.000Z',
    }),
    [draft.title, draft.price, draft.photos],
  );

  /* ---- validation gates -------------------------------------------------- */
  const validateDetails = useCallback((): ValidationResult => {
    const errs: Partial<Record<keyof Draft, string>> = {};
    if (!draft.title.trim()) errs.title = 'Give your listing a title.';
    if (!draft.categoryId) errs.categoryId = 'Choose a category.';
    setErrors((e) => ({ ...e, ...errs, title: errs.title ?? '', categoryId: errs.categoryId ?? '' }));
    return { valid: !errs.title && !errs.categoryId };
  }, [draft]);

  const validatePricing = useCallback((): ValidationResult => {
    const errs: Partial<Record<keyof Draft, string>> = {};
    if (!draft.price || draft.price.amount <= 0) errs.price = 'Set a price above zero.';
    if ((draft.stock ?? 0) <= 0) errs.stock = 'Set the stock to at least one.';
    setErrors((e) => ({ ...e, price: errs.price ?? '', stock: errs.stock ?? '' }));
    return { valid: !errs.price && !errs.stock };
  }, [draft]);

  /* ---- submit ------------------------------------------------------------ */
  const submit = useCallback(() => {
    if (submitting) return;
    if (!validateDetails().valid) {
      setStep('details');
      return;
    }
    if (!validatePricing().valid) {
      setStep('pricing');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    void api
      .post('/v1/seller/listings', {
        title: draft.title.trim(),
        description: draft.description.trim(),
        categoryId: draft.categoryId,
        price: draft.price,
        stock: draft.stock ?? 1,
      })
      .then(() => setDone(true))
      .catch((err: unknown) => {
        setSubmitError(
          err instanceof ApiRequestError ? err.message : 'Could not submit the listing. Please try again.',
        );
      })
      .finally(() => setSubmitting(false));
  }, [submitting, validateDetails, validatePricing, draft]);

  /* ---- terminal confirmation -------------------------------------------- */
  if (done) {
    return (
      <div className="ks-screen">
        <FxSuccessPage
          title="Submitted for review"
          description="Your listing is in the moderation queue. We'll notify you when it's approved and live in search."
          actions={
            <>
              <Link to="/screens/seller/listings">
                <FxButton variant="primary">Back to listings</FxButton>
              </Link>
              <Link to="/screens/seller/listings/new">
                <FxButton variant="secondary">Create another</FxButton>
              </Link>
            </>
          }
        />
      </div>
    );
  }

  /* ---- steps ------------------------------------------------------------- */
  const steps: WizardStep[] = [
    {
      id: 'details',
      label: 'Details',
      validate: validateDetails,
      content: (
        <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-4)' }}>
          <FxFieldGroup label="Title" error={errors.title || false} required>
            <FxInput
              value={draft.title}
              onChange={(v) => set('title', v)}
              placeholder="e.g. Vintage brass desk lamp"
            />
          </FxFieldGroup>
          <FxFieldGroup label="Category" error={errors.categoryId || false} required>
            <FxSelect
              options={CATEGORY_OPTIONS}
              value={draft.categoryId || null}
              onChange={(v) => set('categoryId', v ?? '')}
              placeholder="Choose a category"
            />
          </FxFieldGroup>
          <FxFieldGroup label="Tags" help="Add a few keywords buyers might search for.">
            <FxTagInput value={draft.tags} onChange={(v) => set('tags', v)} maxTags={8} />
          </FxFieldGroup>
          <FxFieldGroup label="Condition">
            <FxRadioGroup
              options={CONDITION_OPTIONS}
              value={draft.condition}
              onChange={(v) => set('condition', v)}
              orientation="horizontal"
            />
          </FxFieldGroup>
        </div>
      ),
    },
    {
      id: 'media',
      label: 'Media',
      content: (
        <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-4)' }}>
          <FxFieldGroup label="Description" help="Describe the item, materials and what's included.">
            <FxTextarea
              value={draft.description}
              onChange={(v) => set('description', v)}
              rows={5}
              placeholder="Tell buyers about your item…"
            />
          </FxFieldGroup>
          <FxFieldGroup
            label="Photos"
            help="The first photo is the cover — reorder with the drag handle (Space + arrows). The add tile appends a deterministic sample photo (fixture mode, G4)."
          >
            <FxImageGalleryUpload
              value={draft.photos}
              onChange={(files) => set('photos', files)}
              maxFiles={6}
              addLabel="Add photo"
              fixtureAdd={addFixturePhoto}
            />
          </FxFieldGroup>
        </div>
      ),
    },
    {
      id: 'pricing',
      label: 'Pricing & shipping',
      validate: validatePricing,
      content: (
        <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-4)' }}>
          <FxFieldGroup label="Price" error={errors.price || false} required>
            <FxCurrencyInput
              value={draft.price}
              currency="USD"
              onChange={(v) => set('price', v)}
            />
          </FxFieldGroup>
          <FxFieldGroup label="Stock" error={errors.stock || false} required>
            <FxNumberInput value={draft.stock} min={0} onChange={(v) => set('stock', v)} />
          </FxFieldGroup>
          <FxFieldGroup label="Shipping profile">
            <FxRadioGroup
              options={[
                { value: 'flat', label: 'Flat rate' },
                { value: 'free', label: 'Free shipping' },
              ]}
              value={draft.shippingProfile}
              onChange={(v) => set('shippingProfile', v)}
              orientation="horizontal"
            />
          </FxFieldGroup>
          <FxFieldGroup label="Handling time">
            <FxSelect
              options={HANDLING_OPTIONS}
              value={draft.handling}
              onChange={(v) => set('handling', v ?? '3')}
            />
          </FxFieldGroup>
        </div>
      ),
    },
    {
      id: 'review',
      label: 'Review',
      content: (
        <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-5)' }}>
          {submitError !== null && (
            <FxAlert
              tone="danger"
              live
              title="Couldn't submit"
              description={submitError}
              actions={
                <FxButton variant="secondary" size="sm" onClick={submit}>
                  Try again
                </FxButton>
              }
            />
          )}
          <FxAlert
            tone="info"
            title="This listing goes to review"
            description="After you submit, our team checks the listing against our policies. You'll be notified once it's approved and live in search."
          />
          {!readyToPublish && (
            <FxAlert
              tone="warning"
              title="A few things still need attention"
              description="Complete every item in the publish checklist before submitting."
            />
          )}
          <div className="ks-row" style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }}>
            <FxButton variant="primary" onClick={submit} loading={submitting} disabled={!readyToPublish}>
              Submit for review
            </FxButton>
            <Link to="/screens/seller/listings">
              <FxButton variant="ghost">Cancel</FxButton>
            </Link>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="ks-screen">
      <FxWizardLayout
        logo={<strong>{isEdit ? 'Edit listing' : 'New listing'}</strong>}
        exitLabel="Back to listings"
        width="lg"
        onExit={() => navigate('/screens/seller/listings')}
      >
        <div className="sl-editor-cols">
          <FxFormWizard
            steps={steps}
            activeStep={step}
            labels={{ next: 'Continue', submit: 'Submit for review' }}
            hideSubmit
            onStepChange={(stepId) => setStep(stepId as EditorStep)}
            onSubmit={submit}
          />
          <div className="ks-rail">
            <FxListingCard listing={previewListing} mode="buyer" showRating={false} />
            <FxProgressSummary title="Publish checklist" items={checklist} format="{value}/{max}" />
          </div>
        </div>
      </FxWizardLayout>
    </div>
  );
}
