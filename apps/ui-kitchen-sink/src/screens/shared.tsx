/**
 * Shared screen-harness types (doc 15 U13-0). Infra-owned: tracks import from
 * here, never edit. Kept in its own module (not ScreensIndex) so track route
 * modules avoid a runtime import cycle with the index.
 */
import { Link } from 'react-router-dom';
import { FxButton, FxErrorPage } from 'flexa-ui-kit';

/** One entry in the ScreensIndex persona sections. */
export interface ScreenLink {
  to: string;
  title: string;
  doc: string;
  blurb: string;
}

/**
 * Catch-all for unknown paths under `/screens/*` (and inside each track's
 * nested Routes, where the app-level catch-all can't reach). Without this, an
 * unmatched nested route renders nothing — a blank page that reads as broken.
 */
export function ScreenNotFound() {
  return (
    <div className="ks-screen">
      <FxErrorPage
        code="404"
        title="Screen not found"
        description="This path doesn't match any reference screen."
        actions={
          <Link to="/screens">
            <FxButton variant="secondary">Back to screens index</FxButton>
          </Link>
        }
      />
    </div>
  );
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
