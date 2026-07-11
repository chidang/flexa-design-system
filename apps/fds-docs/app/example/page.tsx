import type { Metadata } from 'next';
import { emitBaseTypography } from 'flexa-design-system';
import { loadExample } from '../../src/content';
import { EXAMPLE_CSS, usedTokens } from '../../src/example';

export function generateMetadata(): Metadata {
  const doc = loadExample();
  return { title: doc.title, description: doc.description };
}

export default function ExamplePage() {
  const doc = loadExample();
  const { used, unknown } = usedTokens();
  const clean = unknown.length === 0;
  return (
    <>
      <section>
        <h1>{doc.title}</h1>
        <p>{doc.intro}</p>
        <p className={clean ? 'pass' : undefined} style={clean ? undefined : { color: 'var(--fx-color-danger)' }}>
          {clean
            ? `Every colour, space, radius and shadow below is an FDS token — ${used.length} distinct, 0 off-system.`
            : `Off-system tokens found: ${unknown.join(', ')}`}
        </p>
      </section>

      {/* Type comes from FDS base typography, scoped to the flexa/root wrapper —
          so the dashboard has no hand-picked font sizes either. */}
      <style dangerouslySetInnerHTML={{ __html: emitBaseTypography() }} />
      <style dangerouslySetInnerHTML={{ __html: EXAMPLE_CSS }} />

      <div id="fds-example" data-fx-type="flexa/root">
        <header className="ex-top">
          <div>
            <strong className="ex-brand">{doc.appName}</strong>
            <span className="ex-sub">{doc.appTagline}</span>
          </div>
          <button type="button" className="ex-btn">
            {doc.exportLabel}
          </button>
        </header>

        <div className="ex-stats">
          {doc.stats.map((s) => (
            <div className="ex-stat" key={s.label}>
              <span className="ex-stat-label">{s.label}</span>
              <h3 className="ex-stat-value">{s.value}</h3>
              <span className={`ex-delta ex-delta-${s.trend}`}>{s.delta}</span>
            </div>
          ))}
        </div>

        <div className="ex-panel">
          <div className="ex-panel-head">
            <h3>{doc.panelTitle}</h3>
            <span className="ex-count">{doc.rows.length}</span>
          </div>
          <table className="ex-table">
            <thead>
              <tr>
                {doc.columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {doc.rows.map((r) => (
                <tr key={r.name}>
                  <td>{r.name}</td>
                  <td>
                    <span className={`ex-badge ex-badge-${r.status}`}>
                      {doc.statusLabels[r.status] ?? r.status}
                    </span>
                  </td>
                  <td>{r.amount}</td>
                  <td className="ex-muted">{r.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <section>
        <h2>{doc.proofTitle}</h2>
        <p>{doc.proofBlurb}</p>
        <h3>{doc.tokenListTitle}</h3>
        <p>
          {used.map((v) => (
            <code className="token-id" key={v}>
              {v}
            </code>
          ))}
        </p>
      </section>
    </>
  );
}
