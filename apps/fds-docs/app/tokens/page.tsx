import type { Metadata } from 'next';
import type { TokenEntry } from 'flexa-design-system';
import {
  COMPONENT_GROUPS,
  PRIMITIVE_GROUPS,
  SEMANTIC_GROUPS,
  contrastMatrix,
  displayValue,
  resolveColor,
  resolveTokenValue,
} from '../../src/tokens';

export const metadata: Metadata = {
  title: 'Token reference',
  description:
    'Every FDS design token — generated from the DTCG source at build time: color swatches (light/dark), spacing and typography scales, and the WCAG contrast matrix.',
};

function Swatches({ id }: { id: string }) {
  const light = resolveColor(id, 'light');
  const dark = resolveColor(id, 'dark');
  if (!light) return null;
  return (
    <>
      <span className="swatch" style={{ background: light }} title={`light: ${light}`} />{' '}
      <span className="swatch" style={{ background: dark ?? light }} title={`dark: ${dark ?? light}`} />
    </>
  );
}

function TokenRows({ tokens }: { tokens: TokenEntry[] }) {
  return (
    <tbody>
      {tokens.map((t) => {
        const resolved = resolveTokenValue(t.id, 'light');
        return (
          <tr key={t.id}>
            <td>
              <span className="token-id">{t.id}</span>
            </td>
            <td>
              <span className="token-id">{t.cssVar}</span>
            </td>
            <td>
              {t.type === 'color' ? <Swatches id={t.id} /> : null}{' '}
              <span className="token-id">
                {typeof t.value === 'string' && t.value.startsWith('{')
                  ? `${displayValue(t.value)} → ${resolved !== undefined ? displayValue(resolved) : ''}`
                  : displayValue(t.value)}
              </span>
            </td>
          </tr>
        );
      })}
    </tbody>
  );
}

function GroupSection({ title, groups }: { title: string; groups: typeof SEMANTIC_GROUPS }) {
  return (
    <>
      <h2>{title}</h2>
      {groups.map((group) => (
        <details key={group.key} open={title === 'Semantic tokens'}>
          <summary>
            <strong className="token-id">{group.key}.*</strong>{' '}
            <span className="tier-badge">{group.tokens.length} tokens</span>
          </summary>
          <table>
            <thead>
              <tr>
                <th>Token</th>
                <th>CSS variable</th>
                <th>Value</th>
              </tr>
            </thead>
            <TokenRows tokens={group.tokens} />
          </table>
        </details>
      ))}
    </>
  );
}

export default function TokensPage() {
  const matrix = contrastMatrix();
  return (
    <article>
      <h1>Token reference</h1>
      <p>
        Generated at build time from <code>fds.tokens.json</code> — the same registry the package
        exports. This page cannot drift from the source.
      </p>

      <h2>Contrast matrix (WCAG 2.2 AA)</h2>
      <p>
        The pairs the design system guarantees, with actual ratios in both schemes. CI fails if any
        cell drops below its minimum.
      </p>
      <table>
        <thead>
          <tr>
            <th>Foreground</th>
            <th>Background</th>
            <th>Min</th>
            <th>Light</th>
            <th>Dark</th>
          </tr>
        </thead>
        <tbody>
          {matrix.map((row) => (
            <tr key={`${row.fg}/${row.bg}`}>
              <td>
                <span className="token-id">{row.fg}</span>
              </td>
              <td>
                <span className="token-id">{row.bg}</span>
              </td>
              <td>{row.min}:1</td>
              <td className={row.light >= row.min ? 'pass' : 'fail'}>{row.light}:1</td>
              <td className={row.dark >= row.min ? 'pass' : 'fail'}>{row.dark}:1</td>
            </tr>
          ))}
        </tbody>
      </table>

      <GroupSection title="Semantic tokens" groups={SEMANTIC_GROUPS} />
      <GroupSection title="Component tokens" groups={COMPONENT_GROUPS} />
      <GroupSection title="Primitive tokens (ref)" groups={PRIMITIVE_GROUPS} />
    </article>
  );
}
