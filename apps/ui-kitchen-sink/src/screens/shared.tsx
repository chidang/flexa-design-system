/**
 * Shared screen-harness types (doc 15 U13-0). Infra-owned: tracks import from
 * here, never edit. Kept in its own module (not ScreensIndex) so track route
 * modules avoid a runtime import cycle with the index.
 */

/** One entry in the ScreensIndex persona sections. */
export interface ScreenLink {
  to: string;
  title: string;
  doc: string;
  blurb: string;
}

/** Default route body until a track lands its screens — replace, don't keep. */
export function TrackPlaceholder({ track }: { track: string }) {
  return (
    <div className="ks-screen">
      <h1 className="ks-page-title">{track}</h1>
      <p className="ks-muted">
        Screens for this track are in flight — see ui-kit/15-u13-marketplace-screens.md.
      </p>
    </div>
  );
}
