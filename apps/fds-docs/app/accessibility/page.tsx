import type { Metadata } from 'next';
import { loadAccessibility } from '../../src/content';
import { A11Y_LIMITS, STANDARD_LABEL, UNIT_SUFFIX, cvdReport, diagnostics } from '../../src/a11y';

const doc = loadAccessibility();

export const metadata: Metadata = {
  title: doc.title,
  description: doc.description,
};

/** The published minimum for each standard, in its own unit. */
const STANDARD_LIMIT: Record<string, string> = {
  apca: `${A11Y_LIMITS.apcaBody} / ${A11Y_LIMITS.apcaUi} Lc`,
  cvd: `${A11Y_LIMITS.cvdDeltaE} ΔE`,
};

export default function AccessibilityPage() {
  const findings = diagnostics();
  const cvd = cvdReport();
  return (
    <article>
      <h1>{doc.title}</h1>
      <p>{doc.intro}</p>

      <h2>{doc.standards.title}</h2>
      <p>{doc.standards.blurb}</p>
      <table>
        <thead>
          <tr>
            <th>Standard</th>
            <th>Spec</th>
            <th>Minimum</th>
            <th>What it catches</th>
          </tr>
        </thead>
        <tbody>
          {doc.standards.items.map((s) => {
            const key = s.name.startsWith('APCA')
              ? 'apca'
              : s.name.startsWith('Colour')
                ? 'cvd'
                : '';
            return (
              <tr key={s.name}>
                <td>
                  <strong>{s.name}</strong>
                </td>
                <td>
                  <span className="token-id">{s.spec}</span>
                </td>
                <td>{STANDARD_LIMIT[key] ?? '—'}</td>
                <td>{s.blurb}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h2>{doc.diagnostics.title}</h2>
      {findings.length === 0 ? (
        <p>{doc.diagnostics.clearBlurb}</p>
      ) : (
        <>
          <p>{doc.diagnostics.findingsBlurb}</p>
          <table>
            <thead>
              <tr>
                <th>Standard</th>
                <th>Scheme</th>
                <th>Tokens</th>
                <th>Measured</th>
                <th>Required</th>
                <th>Remedy</th>
              </tr>
            </thead>
            <tbody>
              {findings.map((f, i) => (
                <tr key={`${f.standard}-${f.scheme}-${f.tokens.join('-')}-${i}`}>
                  <td>
                    <span className="tier-badge">{STANDARD_LABEL[f.standard]}</span>
                  </td>
                  <td>{f.scheme}</td>
                  <td>
                    {f.tokens.map((t) => (
                      <div key={t}>
                        <span className="token-id">{t}</span>
                      </div>
                    ))}
                  </td>
                  <td className="fail">
                    {f.measured}
                    {UNIT_SUFFIX[f.unit]}
                  </td>
                  <td>
                    {f.required}
                    {UNIT_SUFFIX[f.unit]}
                  </td>
                  <td>{f.remedy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2>{doc.cvd.title}</h2>
      <p>{doc.cvd.blurb}</p>
      {cvd && (
        <table>
          <thead>
            <tr>
              <th>Deficiency</th>
              <th>Primary</th>
              <th>Secondary</th>
              <th>ΔE</th>
              <th>Min {A11Y_LIMITS.cvdDeltaE}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <em>Normal vision</em>
              </td>
              <td>
                <span className="swatch" style={{ background: cvd.basePrimary }} />{' '}
                <span className="token-id">{cvd.basePrimary}</span>
              </td>
              <td>
                <span className="swatch" style={{ background: cvd.baseSecondary }} />{' '}
                <span className="token-id">{cvd.baseSecondary}</span>
              </td>
              <td>—</td>
              <td>—</td>
            </tr>
            {cvd.rows.map((r) => (
              <tr key={r.type}>
                <td>{r.type}</td>
                <td>
                  <span className="swatch" style={{ background: r.primary }} />{' '}
                  <span className="token-id">{r.primary}</span>
                </td>
                <td>
                  <span className="swatch" style={{ background: r.secondary }} />{' '}
                  <span className="token-id">{r.secondary}</span>
                </td>
                <td className={r.distinct ? 'pass' : 'fail'}>{r.deltaE}</td>
                <td className={r.distinct ? 'pass' : 'fail'}>{r.distinct ? 'distinct' : 'collapses'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>{doc.highContrast.title}</h2>
      <p>{doc.highContrast.blurb}</p>
      <p>
        <span className="tier-badge">{A11Y_LIMITS.hcOverrides} roles</span> re-pointed to WCAG AAA (
        {A11Y_LIMITS.aaa}:1) under <code>prefers-contrast: more</code>.
      </p>
    </article>
  );
}
