/**
 * FxWizardLayout showcase — a distraction-free shell hosting a wizard. The
 * children/logo/footer are arbitrary Nodes documented in `props`; there is no
 * shared enum union, so `enums` is omitted.
 */
import { createElement } from 'react';
import type { ShowcaseSpec } from '../showcase-types';
import { FxWizardLayout } from './wizard-layout';

const logo = createElement('strong', null, 'Flexa');

const body = createElement(
  'div',
  { style: { padding: '16px' } },
  createElement('h1', { key: 'h' }, 'Create your listing'),
  createElement('p', { key: 'p' }, 'Step 1 of 3 — basics'),
);

const footer = createElement('span', null, 'Your progress saves automatically.');

export const wizardLayoutShowcase: ShowcaseSpec = {
  name: 'FxWizardLayout',
  slug: 'wizard-layout',
  category: 'layouts',
  slice: 'U7',
  status: 'ready',
  interactive: true,
  tagline: 'A distraction-free shell for multi-step flows with a Save & exit affordance.',
  component: FxWizardLayout,
  variants: [
    { label: 'default', props: { logo, children: body } },
    { label: 'custom exit label', props: { logo, children: body, exitLabel: 'Exit setup' } },
    { label: 'with footer slot', props: { logo, children: body, footerSlot: footer } },
    { label: 'no logo', props: { children: body } },
  ],
  props: [
    { name: 'children', type: 'ReactNode', required: true, description: 'The wizard rendered in the centered column.' },
    { name: 'logo', type: 'ReactNode', description: 'Brand mark at the header start.' },
    { name: 'exitLabel', type: 'string', default: "'Save & exit'", description: 'Ghost exit button label.' },
    { name: 'showSteps', type: 'boolean', default: 'true', description: 'Reserved step-progress context flag.' },
    { name: 'footerSlot', type: 'ReactNode', description: 'Optional footer below the wizard column.' },
  ],
  events: [
    {
      name: 'onExit',
      payload: '()',
      description: 'Save & exit pressed. The host confirms unsaved changes before navigating.',
    },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxWizardLayout' },
};
