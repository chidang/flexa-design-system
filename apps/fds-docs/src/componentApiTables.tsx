/**
 * Render blocks for the GENERATED component API (src/componentApi.ts) — the
 * JSDoc overview, the extracted props table, and the showcase example source.
 * Server components; everything is static HTML at export time.
 */
import type { ReactNode } from 'react';
import type { GeneratedComponentApi } from './componentApi';
import { Inline } from './blocks';
import { CopyButton } from './CopyButton';

/** The component file's JSDoc header, as prose. */
export function ApiOverview({ api }: { api: GeneratedComponentApi }): ReactNode {
  if (api.description.length === 0) return null;
  return (
    <section>
      <h2>Overview</h2>
      {api.description.map((paragraph, i) => (
        <p key={i}>
          <Inline text={paragraph} />
        </p>
      ))}
      <p className="cx-api-note">
        From <code>{api.sourceFile}</code> — documentation extracted from the source at build time.
      </p>
    </section>
  );
}

/** Props extracted from the component's own props type. */
export function GeneratedPropsTable({ api }: { api: GeneratedComponentApi }): ReactNode {
  if (api.props.length === 0) return null;
  return (
    <section>
      <h2>Props</h2>
      {api.propsType ? (
        <p className="cx-api-note">
          <code>{api.propsType}</code> — {api.props.length} props, extracted from the TypeScript
          types.
        </p>
      ) : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Prop</th>
              <th>Type</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {api.props.map((p) => (
              <tr key={p.name}>
                <td>
                  <code>{p.name}</code>
                  {p.required ? <span className="cx-required">required</span> : null}
                </td>
                <td>
                  <code>{p.type}</code>
                </td>
                <td>{p.default ? <code>{p.default}</code> : '—'}</td>
                <td>{p.description ? <Inline text={p.description} /> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {api.inherits.length > 0 ? (
        <p className="cx-api-note">
          Also accepts{' '}
          {api.inherits.map((h, i) => (
            <span key={h}>
              {i > 0 ? ' and ' : ''}
              <code>{h}</code>
            </span>
          ))}
          .
        </p>
      ) : null}
    </section>
  );
}

/** The component's showcase source — the example every demo derives from. */
export function ExampleSource({ api }: { api: GeneratedComponentApi }): ReactNode {
  return (
    <section>
      <h2>Example</h2>
      <p className="cx-api-note">
        The showcase spec below is the exact source both this page&apos;s demo and the kitchen-sink
        workbench render from — variants, props and enums included.
      </p>
      <div className="cx-code">
        <div className="cx-code-head">
          <span>{api.example.file}</span>
          <CopyButton text={api.example.source} />
        </div>
        <pre data-lang="ts">
          <code>{api.example.source}</code>
        </pre>
      </div>
    </section>
  );
}
