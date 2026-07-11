/**
 * Schema-version + migration framework (khung — sống còn, đặt nền từ Phase 0).
 * Element nâng version schema phải đăng ký migration để JSON cũ không vỡ.
 */

import type { ElementManifest, FlexaDocument, FlexaNode, Settings } from './types.js';

/**
 * The document-FORMAT (envelope) schema version this build speaks. Distinct from
 * a document's publish `version` counter and from per-element `node.v`: this
 * governs the shape of the FlexaDocument envelope itself. Bump it whenever an
 * envelope migration is added below. A document with no `schemaVersion` is
 * assumed to predate stamping (treated as version 1).
 */
export const DOCUMENT_SCHEMA_VERSION = 1;

/** Upgrades one document envelope from version `from` to `from + 1`. */
export type DocumentMigration = (doc: FlexaDocument) => FlexaDocument;

/**
 * Ordered envelope migrations, keyed by the version they upgrade FROM. Empty at
 * v1 — this is the seam (like `MigrationRegistry`, laid before it is needed) so a
 * future envelope change ships as one entry here, not a scattered refactor.
 */
const DOCUMENT_MIGRATIONS: ReadonlyMap<number, DocumentMigration> = new Map();

/**
 * Bring a document envelope up to `DOCUMENT_SCHEMA_VERSION`, stamping the field.
 * A missing `schemaVersion` is treated as 1 (back-compat). A version NEWER than
 * this build is a hard error — never silently downgrade (mirrors `migrateNode`).
 */
export function migrateDocument(doc: FlexaDocument): FlexaDocument {
  let v = doc.schemaVersion ?? 1;
  if (v > DOCUMENT_SCHEMA_VERSION) {
    throw new Error(
      `Document ${doc.id} has schemaVersion ${v} newer than this build (${DOCUMENT_SCHEMA_VERSION})`,
    );
  }
  let out = doc;
  while (v < DOCUMENT_SCHEMA_VERSION) {
    const step = DOCUMENT_MIGRATIONS.get(v);
    if (!step) throw new Error(`Missing document migration v${v}→v${v + 1}`);
    out = step(out);
    v += 1;
  }
  return out.schemaVersion === DOCUMENT_SCHEMA_VERSION
    ? out
    : { ...out, schemaVersion: DOCUMENT_SCHEMA_VERSION };
}

export type Migration = (settings: Settings) => Settings;

export class MigrationRegistry {
  /** type → (fromVersion → migration lên fromVersion+1) */
  private migrations = new Map<string, Map<number, Migration>>();

  add(type: string, fromVersion: number, fn: Migration): void {
    const byVersion = this.migrations.get(type) ?? new Map<number, Migration>();
    if (byVersion.has(fromVersion)) {
      throw new Error(`Migration ${type} v${fromVersion}→v${fromVersion + 1} already exists`);
    }
    byVersion.set(fromVersion, fn);
    this.migrations.set(type, byVersion);
  }

  /**
   * Đưa settings của node lên version hiện tại của manifest. Thiếu một bước
   * migration trong chuỗi = lỗi cứng (không âm thầm render sai).
   */
  migrateNode(node: FlexaNode, manifest: ElementManifest): FlexaNode {
    let v = node.v ?? 1;
    if (v === manifest.version) return node;
    if (v > manifest.version) {
      throw new Error(`Node ${node.id} (${node.type}) has v${v} newer than manifest v${manifest.version}`);
    }
    let settings = node.settings;
    const byVersion = this.migrations.get(node.type);
    while (v < manifest.version) {
      const step = byVersion?.get(v);
      if (!step) {
        throw new Error(`Missing migration ${node.type} v${v}→v${v + 1}`);
      }
      settings = step(settings);
      v += 1;
    }
    return { ...node, settings, v };
  }
}
