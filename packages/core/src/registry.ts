import type { ElementManifest } from './types.js';
import { defineElement, ManifestError } from './manifest.js';
import { ROOT_MANIFEST } from './root.js';
import { BLOCK_REF_MANIFEST } from './blocks.js';

export class ElementRegistry {
  private elements = new Map<string, ElementManifest>();

  constructor() {
    // Type dựng sẵn — mọi host render được document mà không phải nhớ đăng ký
    // ('flexa/root', 'flexa/block-ref' là type dành riêng, pack đăng ký lại sẽ throw).
    this.register(ROOT_MANIFEST);
    this.register(BLOCK_REF_MANIFEST);
  }

  register(manifest: unknown): ElementManifest {
    const m = defineElement(manifest);
    if (this.elements.has(m.type)) {
      throw new ManifestError(m.type, 'already registered (type must be unique)');
    }
    this.elements.set(m.type, m);
    return m;
  }

  /**
   * Non-throwing register — for runtime loading of AI-generated or third-party packs.
   * Invalid manifests are skipped; missing elements render as fx--missing placeholder.
   */
  registerSafe(
    manifest: unknown,
  ): { ok: true; element: ElementManifest } | { ok: false; errors: string[] } {
    try {
      const element = this.register(manifest);
      return { ok: true, element };
    } catch (err) {
      if (err instanceof ManifestError) return { ok: false, errors: [err.message] };
      return { ok: false, errors: [String(err)] };
    }
  }

  get(type: string): ElementManifest | undefined {
    return this.elements.get(type);
  }

  list(): ElementManifest[] {
    return [...this.elements.values()];
  }
}
