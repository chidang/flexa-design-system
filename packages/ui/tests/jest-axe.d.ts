// Minimal ambient types for jest-axe (ships no types). We use only `axe()` and
// its `violations` array; the full matcher API is not needed for our gate.
declare module 'jest-axe' {
  export interface AxeViolation {
    id: string;
    impact?: string;
    description: string;
    nodes: unknown[];
  }
  export interface AxeResults {
    violations: AxeViolation[];
  }
  export function axe(
    html: Element | Document | string,
    options?: Record<string, unknown>,
  ): Promise<AxeResults>;
}
