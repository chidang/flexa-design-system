/**
 * Server-rendered reference tables for a component page — props, events, keyboard
 * map, ARIA contract, and canonical enum chips. All derived from the showcase
 * spec; static HTML at export time.
 */
import type { ReactNode } from 'react';
import type { ShowcaseSpec } from 'flexa-ui-kit';

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }): ReactNode {
  if (rows.length === 0) return null;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PropsTable({ spec }: { spec: ShowcaseSpec }): ReactNode {
  if (!spec.props?.length) return null;
  return (
    <>
      <h2>Props</h2>
      <Table
        head={['Prop', 'Type', 'Default', 'Description']}
        rows={spec.props.map((p) => [
          <code key="n">{p.name}</code>,
          <code key="t">{p.type}</code>,
          p.default ? <code key="d">{p.default}</code> : '—',
          <>
            {p.description}
            {p.required ? ' (required)' : ''}
          </>,
        ])}
      />
    </>
  );
}

export function EventsTable({ spec }: { spec: ShowcaseSpec }): ReactNode {
  if (!spec.events?.length) return null;
  return (
    <>
      <h2>Events</h2>
      <Table
        head={['Event', 'Payload', 'Description']}
        rows={spec.events.map((e) => [
          <code key="n">{e.name}</code>,
          <code key="p">{e.payload}</code>,
          e.description,
        ])}
      />
    </>
  );
}

export function KeyboardTable({ spec }: { spec: ShowcaseSpec }): ReactNode {
  if (!spec.keyboard?.length) return null;
  return (
    <>
      <h2>Keyboard</h2>
      <Table
        head={['Keys', 'Action']}
        rows={spec.keyboard.map((k) => [<kbd key="k">{k.keys}</kbd>, k.action])}
      />
    </>
  );
}

export function AriaTable({ spec }: { spec: ShowcaseSpec }): ReactNode {
  if (!spec.aria?.length) return null;
  return (
    <>
      <h2>ARIA</h2>
      <Table
        head={['Attribute', 'Value', 'Note']}
        rows={spec.aria.map((a) => [
          <code key="a">{a.attr}</code>,
          <code key="v">{a.value}</code>,
          a.note ?? '—',
        ])}
      />
    </>
  );
}

export function EnumChips({ spec }: { spec: ShowcaseSpec }): ReactNode {
  const entries = Object.entries(spec.enums ?? {});
  if (entries.length === 0) return null;
  return (
    <>
      <h2>Enums</h2>
      {entries.map(([name, values]) => (
        <p key={name} className="cx-enum">
          <code>{name}</code>
          {': '}
          {values.map((v) => (
            <span key={v} className="cx-chip">
              {v}
            </span>
          ))}
        </p>
      ))}
    </>
  );
}
