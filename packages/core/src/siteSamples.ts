/**
 * Section pattern samples (doc 14 §4c) — the hand-curated fill per catalog
 * preset that makes an inserted pattern look real instead of lorem-ipsum.
 * Split from `sitePlan.ts` (doc 17 HF2) so the composer stays a logic module
 * and this file is pure authored data; the fills are locked plan-legal by
 * `element-pack-demo/tests/section-samples.spec.ts` (compose on the real
 * registry: no errors, no slot remnants). NOT a frozen engine.
 */

import type { SectionPreset } from './siteCatalog.js';
import type { PlanItem, PlanSection } from './sitePlan.js';

/**
 * Sentinel the curated samples use for image values — `sampleSectionFill`
 * swaps it for the caller's placeholder URL (the editor passes its neutral
 * data-URI; tests pass any URL). Never reaches a composed node.
 */
export const SAMPLE_IMAGE = 'sample://image';

/**
 * Hand-curated sample fill per preset (keyed by `SectionPreset.id`) — what an
 * inserted pattern shows before the user replaces the copy. Curation rules:
 * every REQUIRED slot is filled (nothing load-bearing prunes), `whenEmpty:
 * 'default'` slots stay unfilled (manifest defaults apply), and optional slots
 * are filled only when a meaningful sample exists (`mapUrl` has none — the map
 * prunes; `rating` shows stars). Locked plan-legal by the contract tests.
 */
const SECTION_SAMPLES: Readonly<Record<string, PlanSection>> = {
  'hero-centered': {
    preset: 'hero-centered',
    copy: {
      headline: 'Everything your business needs to grow',
      subhead: 'One clear sentence about the value you deliver — replace this with your own pitch.',
      primaryCta: 'Get started',
      secondaryCta: 'Learn more',
    },
  },
  'hero-split': {
    preset: 'hero-split',
    copy: {
      headline: 'A better way to run your business',
      subhead: 'Explain in one sentence what you offer and who it is for.',
      primaryCta: 'Get started',
    },
    images: { image: SAMPLE_IMAGE },
  },
  'features-grid': {
    preset: 'features-grid',
    copy: {
      heading: 'Why choose us',
      items: [
        { icon: 'bolt', title: 'Fast to launch', text: 'Go live in days, not months.' },
        { icon: 'check', title: 'Easy to manage', text: 'Everything in one simple dashboard.' },
        { icon: 'star', title: 'Built to last', text: 'Reliable foundations that scale with you.' },
      ],
    },
  },
  'services-cards': {
    preset: 'services-cards',
    copy: {
      heading: 'What we do',
      intro: 'Three core services, delivered by people who care.',
      items: [
        { icon: 'star', title: 'Consulting', text: 'Practical advice tailored to your goals.' },
        { icon: 'check', title: 'Implementation', text: 'From plan to launch without the friction.' },
        { icon: 'bolt', title: 'Support', text: 'Fast help whenever you need it.' },
      ],
    },
  },
  'about-split': {
    preset: 'about-split',
    copy: {
      heading: 'About us',
      body: 'We started with a simple idea: great work speaks for itself. Replace this paragraph with your own story — who you are, what you believe in and why customers choose you.',
      cta: 'Meet the team',
    },
    images: { image: SAMPLE_IMAGE },
  },
  'text-prose': {
    preset: 'text-prose',
    copy: {
      heading: 'Our story',
      body: 'Use this section for long-form content: a story, a policy or a detailed explanation. Write naturally in full paragraphs — this block is meant to be read, not skimmed.',
    },
  },
  'stats-band': {
    preset: 'stats-band',
    copy: {
      items: [
        { value: '150+', label: 'Projects delivered' },
        { value: '12', label: 'Years of experience' },
        { value: '98%', label: 'Happy customers' },
      ],
    },
  },
  steps: {
    preset: 'steps',
    copy: {
      heading: 'How it works',
      items: [
        { title: 'Tell us your goals', text: 'A short call to understand what you need.' },
        { title: 'Get a plan', text: 'A clear proposal with scope and timeline.' },
        { title: 'See results', text: 'We deliver, measure and improve.' },
      ],
    },
  },
  testimonials: {
    preset: 'testimonials',
    copy: {
      heading: 'What our customers say',
      items: [
        {
          quote: 'They understood exactly what we needed and delivered ahead of schedule.',
          name: 'Alex Morgan',
          role: 'Founder, Acme Co.',
          rating: '5',
        },
        {
          quote: 'Professional from the first call to the final handover. Highly recommended.',
          name: 'Sam Carter',
          role: 'Store owner',
          rating: '5',
        },
        {
          quote: 'The team keeps improving our site every month — results speak for themselves.',
          name: 'Jamie Lee',
          role: 'Marketing lead',
          rating: '5',
        },
      ],
    },
  },
  'pricing-tiers': {
    preset: 'pricing-tiers',
    copy: {
      heading: 'Simple pricing',
      // Numeric strings — the carrier element owns currency formatting.
      // `features` is a per-tier list of strings (doc 14 §4b lift).
      items: [
        {
          title: 'Starter',
          price: '19',
          subtitle: 'For individuals getting started',
          features: ['Up to 3 projects', 'Community support', '1 GB storage'],
          cta: 'Start free',
          featured: 'false',
        },
        {
          title: 'Pro',
          price: '49',
          subtitle: 'For growing teams',
          features: ['Unlimited projects', 'Priority support', '50 GB storage', 'Advanced analytics'],
          cta: 'Get started',
          trial: '14-day free trial',
          featured: 'true',
        },
        {
          title: 'Business',
          price: '99',
          subtitle: 'For organisations at scale',
          features: ['Everything in Pro', 'SSO & audit logs', 'Dedicated manager', 'Custom contracts'],
          cta: 'Contact sales',
          featured: 'false',
        },
      ],
    },
  },
  'pricing-with-toggle': {
    preset: 'pricing-with-toggle',
    copy: {
      heading: 'Plans that scale with you',
      // priceYear ≈ 10× the monthly price (a ~20% yearly discount, matching the
      // toggle's default "Save 20%" note). Numeric strings — the card formats.
      items: [
        {
          title: 'Starter',
          price: '19',
          priceYear: '182',
          subtitle: 'For individuals getting started',
          features: ['Up to 3 projects', 'Community support', '1 GB storage'],
          cta: 'Start free',
          featured: 'false',
        },
        {
          title: 'Pro',
          price: '49',
          priceYear: '470',
          subtitle: 'For growing teams',
          features: ['Unlimited projects', 'Priority support', '50 GB storage', 'Advanced analytics'],
          cta: 'Get started',
          trial: '14-day free trial',
          featured: 'true',
        },
        {
          title: 'Business',
          price: '99',
          priceYear: '950',
          subtitle: 'For organisations at scale',
          features: ['Everything in Pro', 'SSO & audit logs', 'Dedicated manager', 'Custom contracts'],
          cta: 'Contact sales',
          featured: 'false',
        },
      ],
    },
  },
  'comparison-table': {
    preset: 'comparison-table',
    copy: {
      heading: 'Compare plans',
      // First column header is the feature-label column, then one per plan.
      columns: [{ label: 'Features' }, { label: 'Starter' }, { label: 'Pro' }, { label: 'Business' }],
      // Each row lists one cell per column IN ORDER (feature name first).
      rows: [
        { cells: ['Projects', '3', 'Unlimited', 'Unlimited'] },
        { cells: ['Team members', '1', '10', 'Unlimited'] },
        { cells: ['Storage', '1 GB', '50 GB', '1 TB'] },
        { cells: ['Priority support', '—', 'Yes', 'Yes'] },
        { cells: ['SSO & audit logs', '—', '—', 'Yes'] },
      ],
    },
  },
  'price-list': {
    preset: 'price-list',
    copy: {
      heading: 'Prices',
      items: [
        { name: 'Signature service', price: '$120', note: 'Most popular' },
        { name: 'Standard package', price: '$85' },
        { name: 'Quick consult', price: '$45' },
      ],
    },
  },
  faq: {
    preset: 'faq',
    copy: {
      heading: 'Frequently asked questions',
      items: [
        {
          question: 'How long does a typical project take?',
          answer: 'Most projects launch within two to four weeks, depending on scope.',
        },
        {
          question: 'What does it cost?',
          answer: 'We offer fixed-price packages — see the pricing section or ask for a quote.',
        },
        {
          question: 'Can I make changes myself later?',
          answer: 'Yes. Everything is built so you can edit content without touching code.',
        },
      ],
    },
  },
  'cta-banner': {
    preset: 'cta-banner',
    copy: { headline: 'Ready to get started?', cta: 'Contact us' },
  },
  'contact-form': {
    preset: 'contact-form',
    copy: {
      heading: 'Get in touch',
      intro: 'Send us a message and we will reply within one business day.',
    },
  },
  'contact-split': {
    preset: 'contact-split',
    copy: {
      heading: 'Contact us',
      info: '123 Main Street, Springfield — Mon–Fri 9:00–17:00 — (555) 123-4567 — hello@example.com',
    },
  },
  'lead-form': {
    preset: 'lead-form',
    copy: {
      heading: 'Request a quote',
      intro: 'Tell us about your project and we will get back to you with a tailored proposal.',
    },
  },
  team: {
    preset: 'team',
    copy: {
      heading: 'Meet the team',
      items: [
        { photo: SAMPLE_IMAGE, name: 'Alex Morgan', role: 'Founder' },
        { photo: SAMPLE_IMAGE, name: 'Sam Carter', role: 'Lead designer' },
        { photo: SAMPLE_IMAGE, name: 'Jamie Lee', role: 'Customer success' },
      ],
    },
  },
  gallery: {
    preset: 'gallery',
    copy: {
      heading: 'Our work',
      items: [
        { image: SAMPLE_IMAGE, alt: 'Project one' },
        { image: SAMPLE_IMAGE, alt: 'Project two' },
        { image: SAMPLE_IMAGE, alt: 'Project three' },
      ],
    },
  },
  'logo-strip': {
    preset: 'logo-strip',
    copy: {
      items: [
        { image: SAMPLE_IMAGE, alt: 'Partner one' },
        { image: SAMPLE_IMAGE, alt: 'Partner two' },
        { image: SAMPLE_IMAGE, alt: 'Partner three' },
        { image: SAMPLE_IMAGE, alt: 'Partner four' },
      ],
    },
  },
  'video-feature': {
    preset: 'video-feature',
    copy: {
      heading: 'See it in action',
      body: 'A two-minute tour of what you can build.',
      videoUrl: '#',
    },
  },
  'feature-alt-rows': {
    preset: 'feature-alt-rows',
    copy: {
      items: [
        {
          title: 'Designed around you',
          text: 'Every detail tuned to how you actually work.',
          image: SAMPLE_IMAGE,
        },
        {
          title: 'Ready when you are',
          text: 'Start small and grow without re-platforming.',
          image: SAMPLE_IMAGE,
        },
      ],
    },
  },
  timeline: {
    preset: 'timeline',
    copy: {
      heading: 'Our journey',
      items: [
        { date: '2019', title: 'Founded', text: 'We opened with a small team and a big idea.' },
        { date: '2021', title: 'Ten thousand customers', text: 'Our community grew faster than we imagined.' },
        { date: '2023', title: 'Going global', text: 'We launched in three new markets.' },
      ],
    },
  },
  'spec-list': {
    preset: 'spec-list',
    copy: {
      heading: 'Specifications',
      items: [
        { term: 'Material', description: 'Solid oak with a natural oil finish.' },
        { term: 'Dimensions', description: '120 × 60 × 75 cm (W × D × H).' },
        { term: 'Warranty', description: 'Five years, parts and labour included.' },
      ],
    },
  },
  'before-after': {
    preset: 'before-after',
    copy: {
      heading: 'See the difference',
      body: 'Drag the slider to compare the result.',
      beforeAlt: 'Before',
      afterAlt: 'After',
    },
    images: { before: SAMPLE_IMAGE, after: SAMPLE_IMAGE },
  },
  'shop-grid': {
    preset: 'shop-grid',
    copy: { heading: 'Shop our products' },
  },
  'property-cards': {
    preset: 'property-cards',
    copy: {
      heading: 'Featured listings',
      items: [
        {
          image: SAMPLE_IMAGE,
          address: '123 Oak Avenue, Springfield',
          price: '$540,000',
          beds: '3 beds',
          baths: '2 baths',
          sqft: '1,850 sqft',
          status: 'For sale',
        },
        {
          image: SAMPLE_IMAGE,
          address: '88 Riverside Drive, Springfield',
          price: '$720,000',
          beds: '4 beds',
          baths: '3 baths',
          sqft: '2,400 sqft',
          status: 'New',
        },
        {
          image: SAMPLE_IMAGE,
          address: '15 Maple Court, Springfield',
          price: '$2,300 / mo',
          beds: '2 beds',
          baths: '1 bath',
          sqft: '980 sqft',
          status: 'For rent',
        },
      ],
    },
  },
  'search-hero': {
    preset: 'search-hero',
    copy: {
      headline: 'Find your next home',
      subhead: 'Search thousands of listings across the city.',
      submitLabel: 'Search',
    },
  },
  'dish-cards': {
    preset: 'dish-cards',
    copy: {
      heading: 'Signature dishes',
      items: [
        {
          image: SAMPLE_IMAGE,
          name: 'Wood-fired Margherita',
          description: 'San Marzano tomato, fresh mozzarella, basil.',
          price: '$14',
        },
        {
          image: SAMPLE_IMAGE,
          name: 'Slow-braised Short Rib',
          description: 'Red-wine jus, creamy polenta, gremolata.',
          price: '$28',
        },
        {
          image: SAMPLE_IMAGE,
          name: 'Lemon Ricotta Cake',
          description: 'Almond crumble, mascarpone, seasonal berries.',
          price: '$11',
        },
      ],
    },
  },
  'menu-list': {
    preset: 'menu-list',
    copy: {
      heading: 'Our menu',
      items: [
        { name: 'Bruschetta', description: 'Grilled sourdough, tomato, garlic.', price: '$9' },
        { name: 'Caesar Salad', description: 'Cos lettuce, parmesan, croutons.', price: '$12' },
        { name: 'Spaghetti Carbonara', description: 'Guanciale, egg, pecorino.', price: '$18' },
        { name: 'Grilled Salmon', description: 'Lemon butter, seasonal greens.', price: '$24' },
      ],
    },
  },
  'booking-form': {
    preset: 'booking-form',
    copy: {
      heading: 'Book a table',
      intro: 'Reserve online and we will confirm by email.',
      submitLabel: 'Request a table',
    },
  },
  'appointment-booking': {
    preset: 'appointment-booking',
    copy: {
      heading: 'Book an appointment',
      intro: 'Choose a service and a time that suits you — we will confirm by email.',
      submitLabel: 'Request appointment',
    },
  },
  'event-registration': {
    preset: 'event-registration',
    copy: {
      heading: 'Reserve your spot',
      intro: 'Register for the workshop — places are limited and confirmed by email.',
      submitLabel: 'Register now',
    },
  },
  'feature-cards-image': {
    preset: 'feature-cards-image',
    copy: {
      heading: 'Everything you need to ship faster',
      intro: 'Powerful features that scale with your team.',
      items: [
        {
          image: SAMPLE_IMAGE,
          title: 'Real-time collaboration',
          text: 'See changes as they happen and work together without conflicts.',
        },
        {
          image: SAMPLE_IMAGE,
          title: 'Automated workflows',
          text: 'Trigger actions and hand off tasks without lifting a finger.',
        },
        {
          image: SAMPLE_IMAGE,
          title: 'Insightful analytics',
          text: 'Track what matters with dashboards your whole team can read.',
        },
      ],
    },
  },
  'room-cards': {
    preset: 'room-cards',
    copy: {
      heading: 'Rooms & suites',
      items: [
        {
          image: SAMPLE_IMAGE,
          name: 'Garden Double',
          description: 'A bright room opening onto the courtyard garden.',
          price: '$120 / night',
          guests: '2 guests',
          bed: '1 Queen bed',
          size: '24 m²',
          status: 'Popular',
        },
        {
          image: SAMPLE_IMAGE,
          name: 'Deluxe King',
          description: 'Spacious king room with a city-view balcony.',
          price: '$180 / night',
          guests: '2 guests',
          bed: '1 King bed',
          size: '32 m²',
        },
        {
          image: SAMPLE_IMAGE,
          name: 'Family Suite',
          description: 'Two connected rooms with a small lounge area.',
          price: '$260 / night',
          guests: '4 guests',
          bed: '1 King + 2 Singles',
          size: '48 m²',
          status: 'Last rooms',
        },
      ],
    },
  },
  'course-cards': {
    preset: 'course-cards',
    copy: {
      heading: 'Popular courses',
      intro: 'Learn at your own pace with hands-on projects.',
      items: [
        {
          image: SAMPLE_IMAGE,
          title: 'Web Design Foundations',
          description: 'Build and publish your first responsive site.',
          duration: '6 weeks',
          level: 'Beginner',
          price: '$149',
        },
        {
          image: SAMPLE_IMAGE,
          title: 'Front-end Development',
          description: 'Master HTML, CSS and modern JavaScript.',
          duration: '10 weeks',
          level: 'Intermediate',
          price: '$299',
        },
        {
          image: SAMPLE_IMAGE,
          title: 'UX Research & Strategy',
          description: 'Turn user insights into product decisions.',
          duration: '8 weeks',
          level: 'Advanced',
          price: '$249',
        },
      ],
    },
  },
  'header-basic': {
    preset: 'header-basic',
    copy: {
      brand: 'Your Brand',
      links: [
        { label: 'About', url: '#' },
        { label: 'Services', url: '#' },
        { label: 'Contact', url: '#' },
      ],
    },
  },
  'header-cta': {
    preset: 'header-cta',
    copy: {
      brand: 'Your Brand',
      links: [
        { label: 'About', url: '#' },
        { label: 'Services', url: '#' },
        { label: 'Contact', url: '#' },
      ],
      cta: 'Book now',
      ctaUrl: '#',
    },
  },
  'header-centered': {
    preset: 'header-centered',
    copy: {
      brand: 'Your Brand',
      links: [
        { label: 'About', url: '#' },
        { label: 'Services', url: '#' },
        { label: 'Contact', url: '#' },
      ],
    },
  },
  'header-topbar': {
    preset: 'header-topbar',
    copy: {
      notice: 'Open Mon–Fri 9:00–17:00 — call (555) 123-4567',
      brand: 'Your Brand',
      links: [
        { label: 'About', url: '#' },
        { label: 'Services', url: '#' },
        { label: 'Contact', url: '#' },
      ],
    },
  },
  'header-split': {
    preset: 'header-split',
    copy: {
      brand: 'Your Brand',
      linksLeft: [
        { label: 'About', url: '#' },
        { label: 'Services', url: '#' },
      ],
      linksRight: [
        { label: 'Blog', url: '#' },
        { label: 'Contact', url: '#' },
      ],
    },
  },
  'header-minimal': {
    preset: 'header-minimal',
    copy: {
      brand: 'Your Brand',
      links: [
        { label: 'About', url: '#' },
        { label: 'Work', url: '#' },
        { label: 'Contact', url: '#' },
      ],
    },
  },
  // HF7 N3 — menu presets carry a curated LITERAL menu (dropdown/mega) in the
  // tree, so only `brand` is a slot; nothing else to fill.
  'header-dropdown': {
    preset: 'header-dropdown',
    copy: { brand: 'Your Brand' },
  },
  'header-mega': {
    preset: 'header-mega',
    copy: { brand: 'Your Brand' },
  },
  'header-shop-mega': {
    preset: 'header-shop-mega',
    copy: { brand: 'Your Store' },
  },
  // Search and cart are provider-driven (no slots) — only brand + nav to fill.
  'header-commerce': {
    preset: 'header-commerce',
    copy: {
      brand: 'Your Store',
      links: [
        { label: 'Shop', url: '#' },
        { label: 'Deals', url: '#' },
        { label: 'Contact', url: '#' },
      ],
    },
  },
  // Brand is the real Site Logo (provider-driven) — only the nav links to fill.
  'header-logo': {
    preset: 'header-logo',
    copy: {
      links: [
        { label: 'Home', url: '#' },
        { label: 'About', url: '#' },
        { label: 'Services', url: '#' },
        { label: 'Contact', url: '#' },
      ],
    },
  },
  'footer-columns': {
    preset: 'footer-columns',
    copy: {
      about: 'A short paragraph about your business — what you do and where to find you.',
      links: [
        { label: 'About', url: '#' },
        { label: 'Services', url: '#' },
        { label: 'Contact', url: '#' },
      ],
      social: [
        { network: 'facebook', url: '#' },
        { network: 'instagram', url: '#' },
        { network: 'x', url: '#' },
      ],
      copyright: '© Your Company. All rights reserved.',
    },
  },
  'footer-simple': {
    preset: 'footer-simple',
    copy: {
      copyright: '© Your Company. All rights reserved.',
      social: [
        { network: 'facebook', url: '#' },
        { network: 'instagram', url: '#' },
      ],
    },
  },
  'footer-cta': {
    preset: 'footer-cta',
    copy: {
      headline: 'Ready to get started?',
      cta: 'Get in touch',
      ctaUrl: '#',
      links: [
        { label: 'About', url: '#' },
        { label: 'Services', url: '#' },
        { label: 'Contact', url: '#' },
      ],
      copyright: '© Your Company. All rights reserved.',
    },
  },
  'footer-minimal': {
    preset: 'footer-minimal',
    copy: {
      brand: 'Your Brand',
      links: [
        { label: 'About', url: '#' },
        { label: 'Contact', url: '#' },
      ],
      copyright: '© Your Company',
    },
  },
  'footer-newsletter': {
    preset: 'footer-newsletter',
    copy: {
      heading: 'Stay in the loop',
      pitch: 'Occasional news and tips — no spam, unsubscribe anytime.',
      submitLabel: 'Subscribe',
      links: [
        { label: 'About', url: '#' },
        { label: 'Services', url: '#' },
        { label: 'Contact', url: '#' },
      ],
      copyright: '© Your Company. All rights reserved.',
    },
  },
  'footer-legal': {
    preset: 'footer-legal',
    copy: {
      links: [
        { label: 'About', url: '#' },
        { label: 'Services', url: '#' },
        { label: 'Contact', url: '#' },
      ],
      legalLinks: [
        { label: 'Privacy policy', url: '#' },
        { label: 'Terms of service', url: '#' },
      ],
      social: [
        { network: 'facebook', url: '#' },
        { network: 'instagram', url: '#' },
      ],
      copyright: '© Your Company. All rights reserved.',
    },
  },
};

/**
 * The curated sample fill for a preset with every `SAMPLE_IMAGE` sentinel
 * swapped for `imageUrl`. Deterministic; a preset without a shipped sample
 * (impossible for the catalog — test-locked) falls back to an empty fill.
 */
export function sampleSectionFill(preset: SectionPreset, imageUrl: string): PlanSection {
  const sample = SECTION_SAMPLES[preset.id];
  if (!sample) return { preset: preset.id };
  const swap = (v: string): string => (v === SAMPLE_IMAGE ? imageUrl : v);
  // Item values are scalars or `kind:'list'` string[] (doc 14 §4b) — only scalar
  // strings can be the image sentinel; lists pass through untouched.
  const swapItemValue = (v: string | readonly string[]): string | readonly string[] =>
    typeof v === 'string' ? swap(v) : v;
  const result: {
    preset: string;
    copy?: Record<string, string | PlanItem[]>;
    images?: Record<string, string>;
  } = { preset: sample.preset };
  if (sample.copy) {
    const copy: Record<string, string | PlanItem[]> = {};
    for (const [key, value] of Object.entries(sample.copy)) {
      copy[key] =
        typeof value === 'string'
          ? swap(value)
          : value.map(
              (item) =>
                Object.fromEntries(
                  Object.entries(item).map(([k, v]) => [k, swapItemValue(v)]),
                ) as PlanItem,
            );
    }
    result.copy = copy;
  }
  if (sample.images) {
    result.images = Object.fromEntries(
      Object.entries(sample.images).map(([k, v]) => [k, swap(v)]),
    );
  }
  return result;
}
