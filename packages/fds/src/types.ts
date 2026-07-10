/**
 * Shared value shapes the token pipeline operates on. These definitions moved
 * here from `@flexa/core` (FDS standalone, doc 19) so `flexa-design-system` stays
 * dependency-free; core re-exports them, so the public surface is unchanged.
 */

/** JSON-serializable values — mọi thứ trong data model phải nằm trong tập này. */
export type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json };

/** Declaration block của style-spec: CSS prop → literal hoặc '@ref'. */
export type StyleDecls = Record<string, Json>;

export type StyleSpec = Record<string, StyleDecls>;
