/**
 * FxMaintenanceBanner showcase spec (doc 04 §3.6). Ambient scheduled-maintenance
 * notice — variants sweep the info (upcoming) and warning (window active) tones,
 * both with a locale-formatted `scheduledFor`.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxMaintenanceBanner } from './maintenance-banner';

export const maintenanceBannerShowcase: ShowcaseSpec = {
  name: 'MaintenanceBanner',
  slug: 'maintenance-banner',
  category: 'collaboration',
  slice: 'U9',
  status: 'ready',
  tagline: 'Ambient scheduled-maintenance notice — announced politely, not as an alert.',
  component: FxMaintenanceBanner,
  variants: [
    {
      label: 'info · scheduled',
      props: { tone: 'info', scheduledFor: '2026-08-01T02:00:00Z', locale: 'en-US' },
      children: 'We will be performing routine upgrades. Some features may be briefly unavailable.',
    },
    {
      label: 'warning · window active',
      props: { tone: 'warning', scheduledFor: '2026-08-01T02:00:00Z', locale: 'en-US' },
      children: 'Maintenance is in progress — saving may be temporarily disabled.',
    },
    {
      label: 'no scheduled time',
      props: { tone: 'info' },
      children: 'A short maintenance window is planned soon.',
    },
  ],
  props: [
    { name: 'tone', type: "'info' | 'warning'", default: "'info'", description: 'info = upcoming/ambient; warning = window active.' },
    { name: 'title', type: 'ReactNode', default: "'Scheduled maintenance'", description: 'Overrides the default title.' },
    { name: 'children', type: 'ReactNode', description: 'The message body.' },
    { name: 'scheduledFor', type: 'string (ISO)', description: 'Maintenance window timestamp, rendered locale-formatted.' },
    { name: 'sticky', type: 'boolean', default: 'true', description: 'Pin below the Top Navigation at z.sticky.' },
    { name: 'locale', type: 'string', description: 'BCP-47 locale for the scheduledFor time.' },
    { name: 'labels', type: 'Partial<MaintenanceBannerLabels>', description: 'i18n overrides for title + "Scheduled for" prefix.' },
  ],
  aria: [
    { attr: 'role', value: "'status'", note: 'Ambient (not alert) — announced once, politely, on mount.' },
    { attr: 'not dismissible', value: 'while active', note: 'No dismiss control while the maintenance window holds.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxMaintenanceBanner — Maintenance Banner' },
};
