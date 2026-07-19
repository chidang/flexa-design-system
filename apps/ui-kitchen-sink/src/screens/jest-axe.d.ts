// Minimal ambient types for jest-axe (ships no types) — mirrors
// packages/ui/tests/jest-axe.d.ts. We use only `axe()` and its `violations`
// array; the full matcher API is not needed for the screens audit.
declare module 'jest-axe' {
  export interface AxeViolationNode {
    html: string;
    target: unknown[];
  }
  export interface AxeViolation {
    id: string;
    impact?: string;
    description: string;
    help: string;
    nodes: AxeViolationNode[];
  }
  export interface AxeResults {
    violations: AxeViolation[];
  }
  export function axe(
    html: Element | Document | string,
    options?: Record<string, unknown>,
  ): Promise<AxeResults>;
}
