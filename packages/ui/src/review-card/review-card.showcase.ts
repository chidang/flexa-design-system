/**
 * ReviewCard showcase spec. The `Review`/`PartyRef` data shapes are documented in
 * `props` as type strings (component-local, not shared unions). No `enums` map
 * entry — the axes are structural (verified? / images? / response?).
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxReviewCard, type Review } from './review-card';

const author = { id: 'u1', name: 'Jamie Rivera' };

const short: Review = {
  id: 'r1',
  author,
  rating: 4,
  title: 'Great value',
  body: 'Solid quality and quick shipping. Would buy again.',
  createdAt: 'Mar 12, 2026',
};

const long: Review = {
  id: 'r2',
  author: { id: 'u2', name: 'Priya Nair', href: '#author' },
  rating: 5,
  title: 'Exceeded expectations',
  body: 'I was hesitant at first, but this turned out to be one of the best purchases I have made this year. The build feels premium, the finish is flawless, and it does exactly what the listing promised. Setup took under five minutes and support answered my question within the hour. Highly recommended for anyone on the fence.',
  createdAt: 'Feb 28, 2026',
  verified: true,
  helpfulCount: 42,
};

const withImages: Review = {
  id: 'r3',
  author,
  rating: 5,
  body: 'Photos attached — looks exactly like the listing.',
  createdAt: 'Mar 01, 2026',
  images: [
    { id: 'i1', src: 'https://placehold.co/320x240?text=1', alt: 'Product front view' },
    { id: 'i2', src: 'https://placehold.co/320x240?text=2', alt: 'Product side view' },
  ],
  helpfulCount: 7,
};

const withResponse: Review = {
  id: 'r4',
  author,
  rating: 3,
  body: 'Good product but the packaging arrived a little dented.',
  createdAt: 'Jan 18, 2026',
  response: {
    body: 'Thanks for the feedback — we have upgraded our packaging and would love to make this right.',
    respondedAt: 'Jan 19, 2026',
  },
};

const verified: Review = {
  id: 'r5',
  author: { id: 'u3', name: 'Sam Okafor' },
  rating: 5,
  title: 'Verified and happy',
  body: 'Everything works perfectly.',
  createdAt: 'Mar 15, 2026',
  verified: true,
  helpfulCount: 15,
};

export const reviewCardShowcase: ShowcaseSpec = {
  name: 'ReviewCard',
  slug: 'review-card',
  category: 'commerce',
  slice: 'U8',
  status: 'ready',
  interactive: true,
  tagline: 'A single marketplace review — author, rating, clamped body, images, and a seller response.',
  component: FxReviewCard,
  variants: [
    { label: 'short', props: { review: short } },
    { label: 'long (clamped)', props: { review: long } },
    { label: 'with images', props: { review: withImages } },
    { label: 'with seller response', props: { review: withResponse, onRespond: () => {} } },
    { label: 'verified', props: { review: verified } },
  ],
  props: [
    { name: 'review', type: 'Review', required: true, description: 'The review record (author, rating, body, createdAt, verified?, images?, helpfulCount?, response?).' },
    { name: 'onHelpful', type: '(id: string) => void', description: 'Fires when the helpful button is clicked.' },
    { name: 'onReport', type: '(id: string) => void', description: 'Fires when the report menu item is selected.' },
    { name: 'onRespond', type: '(id: string) => void', description: 'Fires when a seller chooses to respond (seller perspective).' },
    { name: 'clampLines', type: 'number', default: '4', description: 'Body line clamp before "Read more" (CSS -webkit-line-clamp).' },
    { name: 'labels', type: 'Partial<ReviewCardLabels>', description: 'i18n label overrides (verified, readMore, helpful, report, reportItem, responseTitle).' },
  ],
  events: [
    { name: 'onHelpful', payload: 'id: string', description: 'Marks the review helpful.' },
    { name: 'onReport', payload: 'id: string', description: 'Reports the review.' },
    { name: 'onRespond', payload: 'id: string', description: 'Opens the seller response composer.' },
  ],
  aria: [
    { attr: 'role="img"', value: 'Rated {value} out of {max}', note: 'From the read-only FxRating in the header.' },
    { attr: 'alt', value: 'required', note: 'Every review image passes required alt text to FxGallery.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxReviewCard — Review Card' },
};
