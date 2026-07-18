/**
 * SitePlan zod SSOT — bound tight against the section catalog so a failing AI
 * plan gets SPECIFIC, repair-loop-friendly errors (which slot, which section,
 * what was expected). Everything statically checkable is checked HERE so
 * composeSite errors stay rare and specific.
 */

import { z } from 'zod';
import { brandSchema, packRefSchema } from '../design.js';
import { SITE_PLAN_VERSION, PRESET_BY_ID, blank, PATH_RE, type PresetRole } from './shared.js';

// An item value is a scalar string OR a list of strings (kind: 'list' slots, the
// doc 14 §4b lift). superRefine below matches the shape against the slot's kind.
const planItemSchema = z.record(z.union([z.string(), z.array(z.string())]));

/**
 * Section schema bound to a preset role — ordinary sections for `pages[].sections`,
 * chrome-role presets for `chrome`/page overrides (W8). Same slot semantics.
 * Exported (doc 20 AE1) so the editor's AI edit gate runs the IDENTICAL slot gate
 * on an `insert-section` op that `sitePlanSchema` runs on a plan — zero drift.
 */
export const planSectionSchemaFor = (role: PresetRole) =>
  z
    .object({
      preset: z.string().min(1),
      copy: z.record(z.union([z.string(), z.array(planItemSchema)])).optional(),
      images: z.record(z.string()).optional(),
    })
    .superRefine((sec, ctx) => {
    const issue = (path: (string | number)[], message: string): void => {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    };
    const preset = PRESET_BY_ID.get(sec.preset);
    if (!preset) {
      issue(['preset'], `unknown section preset "${sec.preset}" — pick an id from the catalog`);
      return;
    }
    const presetRole: PresetRole = preset.role ?? 'section';
    if (presetRole !== role) {
      issue(
        ['preset'],
        role === 'section'
          ? `"${preset.id}" is a ${presetRole} preset — pick it in "chrome" or as a page-level ${presetRole}, never inside "sections"`
          : `"${preset.id}" is not a ${role} preset`,
      );
      return;
    }
    const slots = new Map(preset.slots.map((s) => [s.name, s]));
    const copy = sec.copy ?? {};
    const images = sec.images ?? {};

    for (const [key, value] of Object.entries(copy)) {
      const slot = slots.get(key);
      if (!slot) {
        issue(['copy', key], `"${preset.id}" has no slot "${key}"`);
        continue;
      }
      if (slot.kind === 'image') {
        issue(['copy', key], `slot "${key}" is an image slot — put it under "images"`);
        continue;
      }
      if (slot.kind === 'items') {
        if (!Array.isArray(value)) {
          issue(['copy', key], `slot "${key}" expects an array of items`);
          continue;
        }
        const min = slot.min ?? 1;
        const max = slot.max ?? Number.POSITIVE_INFINITY;
        if (value.length < min || value.length > max) {
          issue(
            ['copy', key],
            `slot "${key}" needs between ${min} and ${slot.max} items (got ${value.length})`,
          );
        }
        const itemSlots = new Map((slot.item ?? []).map((s) => [s.name, s]));
        value.forEach((item, i) => {
          for (const itemKey of Object.keys(item)) {
            if (!itemSlots.has(itemKey)) {
              issue(['copy', key, i, itemKey], `"${preset.id}" items have no slot "${itemKey}"`);
            }
          }
          for (const itemSlot of itemSlots.values()) {
            const v = item[itemSlot.name];
            if (itemSlot.kind === 'list') {
              // A `list` item slot carries a string[]; a scalar there is a shape error.
              if (v === undefined) {
                if (itemSlot.required) {
                  issue(['copy', key, i], `missing required item slot "${itemSlot.name}"`);
                }
                continue;
              }
              if (!Array.isArray(v)) {
                issue(['copy', key, i, itemSlot.name], `item slot "${itemSlot.name}" expects a list of strings`);
                continue;
              }
              if (itemSlot.required && v.length === 0) {
                issue(['copy', key, i], `missing required item slot "${itemSlot.name}"`);
              }
              continue;
            }
            // Scalar item slot — a list there is a shape error.
            if (Array.isArray(v)) {
              issue(['copy', key, i, itemSlot.name], `item slot "${itemSlot.name}" expects a string`);
              continue;
            }
            const empty = v === undefined || blank(v);
            if (itemSlot.required && empty) {
              issue(['copy', key, i], `missing required item slot "${itemSlot.name}"`);
            }
            if (!empty && itemSlot.options && !itemSlot.options.includes(v)) {
              issue(
                ['copy', key, i, itemSlot.name],
                `must be one of: ${itemSlot.options.join(', ')}`,
              );
            }
          }
        });
        continue;
      }
      // Scalar text/longtext/url slot.
      if (typeof value !== 'string') {
        issue(['copy', key], `slot "${key}" expects a string`);
        continue;
      }
      if (!blank(value) && slot.options && !slot.options.includes(value)) {
        issue(['copy', key], `must be one of: ${slot.options.join(', ')}`);
      }
    }

    for (const key of Object.keys(images)) {
      const slot = slots.get(key);
      if (!slot) issue(['images', key], `"${preset.id}" has no slot "${key}"`);
      else if (slot.kind !== 'image') {
        issue(['images', key], `slot "${key}" is not an image slot — put it under "copy"`);
      }
    }

    for (const slot of preset.slots) {
      if (slot.kind === 'items') {
        // Optional items slots (required: false, W8 chrome) may be absent.
        if (slot.required !== false && !(slot.name in copy)) {
          issue(['copy'], `missing required items slot "${slot.name}"`);
        }
        continue;
      }
      if (!slot.required) continue;
      const bag: Readonly<Record<string, unknown>> = slot.kind === 'image' ? images : copy;
      const v = bag[slot.name];
      if (v === undefined || (typeof v === 'string' && blank(v))) {
        issue(
          [slot.kind === 'image' ? 'images' : 'copy'],
          `missing required slot "${slot.name}"`,
        );
      }
    }
  });

const planSectionSchema = planSectionSchemaFor('section');
const headerSectionSchema = planSectionSchemaFor('header');
const footerSectionSchema = planSectionSchemaFor('footer');

const planPageSchema = z.object({
  title: z.string().min(1),
  path: z
    .string()
    .regex(PATH_RE, 'path must start with "/" and use lowercase kebab-case segments'),
  sections: z.array(planSectionSchema).min(1).max(12),
  // Per-page chrome override (W8): another chrome preset, or null = none here.
  header: z.union([headerSectionSchema, z.null()]).optional(),
  footer: z.union([footerSectionSchema, z.null()]).optional(),
});

/**
 * The zod SSOT for a `SitePlan` — exported so `flexa schema plan` publishes it and
 * the W3 prompt template embeds it. Everything statically checkable against the
 * catalog (preset ids, slot membership, required slots, item bounds, closed
 * vocabularies) is checked HERE so `composeSite` errors stay rare and specific.
 */
export const sitePlanSchema = z.object({
  schemaVersion: z.literal(SITE_PLAN_VERSION).optional(),
  name: z.string().min(1).max(200),
  brand: brandSchema.optional(),
  packRef: packRefSchema.optional(),
  chrome: z
    .object({
      header: headerSectionSchema.optional(),
      footer: footerSectionSchema.optional(),
    })
    .optional(),
  pages: z.array(planPageSchema).min(1).max(10),
});
