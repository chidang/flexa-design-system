/**
 * FxAuthenticationLayout showcase — a centered auth card shell. The form/footer/
 * aside/error are arbitrary Nodes documented in `props`; no shared enum union
 * applies, so `enums` is omitted.
 */
import { createElement } from 'react';
import type { ShowcaseSpec } from '../showcase-types';
import { FxAuthenticationLayout } from './authentication-layout';

const logo = createElement('strong', null, 'Flexa');

const form = createElement(
  'form',
  null,
  createElement('label', { key: 'e' }, 'Email'),
  createElement('input', { key: 'ei', type: 'email', 'aria-label': 'Email' }),
  createElement('label', { key: 'p' }, 'Password'),
  createElement('input', { key: 'pi', type: 'password', 'aria-label': 'Password' }),
);

const footer = createElement('a', { href: '#signup' }, "Create an account");

const aside = createElement('p', null, 'Welcome back to your marketplace.');

export const authenticationLayoutShowcase: ShowcaseSpec = {
  name: 'FxAuthenticationLayout',
  slug: 'authentication-layout',
  category: 'layouts',
  slice: 'U7',
  status: 'ready',
  interactive: false,
  tagline: 'A centered auth card with logo, title, form, and an optional brand aside.',
  component: FxAuthenticationLayout,
  variants: [
    { label: 'sign in', props: { title: 'Sign in', logo, children: form, footer } },
    {
      label: 'with error',
      props: {
        title: 'Sign in',
        logo,
        children: form,
        footer,
        error: 'Incorrect email or password.',
      },
    },
    { label: 'with brand aside (≥1024px)', props: { title: 'Sign in', logo, children: form, footer, aside } },
    { label: 'no logo', props: { title: 'Reset password', children: form } },
  ],
  props: [
    { name: 'title', type: 'string', required: true, description: 'Card heading (the single h1).' },
    { name: 'logo', type: 'ReactNode', description: 'Brand mark above the title.' },
    { name: 'children', type: 'ReactNode', required: true, description: 'The auth form.' },
    { name: 'footer', type: 'ReactNode', description: 'Switch-mode links.' },
    { name: 'aside', type: 'ReactNode', description: 'Brand panel shown ≥1024px.' },
    {
      name: 'error',
      type: 'ReactNode',
      description: 'Auth error — rendered in a live FxAlert (tone danger). Focus is the host\'s job.',
    },
  ],
  aria: [
    { attr: 'element', value: 'main', note: 'Single main landmark centers the card.' },
    { attr: 'element', value: 'h1', note: 'The title renders as the page heading.' },
    { attr: 'role', value: 'alert', note: 'The error Alert is live (tone danger).' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxAuthenticationLayout' },
};
