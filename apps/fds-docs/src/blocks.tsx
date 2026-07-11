/**
 * Block renderer — turns the JSON content blocks (src/content.ts) into HTML.
 * Server components only; everything is static HTML at build time (SEO).
 * Inline formatting is deliberately minimal: `backticks` become <code>.
 */
import type { ReactNode } from 'react';
import type { Block } from './content';

/** Render `**bold**` spans within a run of plain (non-code) text. */
function Emphasized({ text }: { text: string }): ReactNode {
  const parts = text.split('**');
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>,
      )}
    </>
  );
}

/**
 * Split on `code spans` and `**bold**`; keeps content JSON portable (no HTML
 * inside). Backticks win over asterisks — code spans are rendered verbatim.
 */
export function Inline({ text }: { text: string }): ReactNode {
  const parts = text.split('`');
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <code key={i}>{part}</code> : <Emphasized key={i} text={part} />,
      )}
    </>
  );
}

export function Blocks({ blocks }: { blocks: Block[] }): ReactNode {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'h2':
            return <h2 key={i}>{block.text}</h2>;
          case 'h3':
            return <h3 key={i}>{block.text}</h3>;
          case 'p':
            return (
              <p key={i}>
                <Inline text={block.text} />
              </p>
            );
          case 'code':
            return (
              <pre key={i} data-lang={block.lang}>
                <code>{block.code}</code>
              </pre>
            );
          case 'list':
            return (
              <ul key={i}>
                {block.items.map((item, j) => (
                  <li key={j}>
                    <Inline text={item} />
                  </li>
                ))}
              </ul>
            );
          case 'table':
            return (
              <div key={i} className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      {block.header.map((h, j) => (
                        <th key={j}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, j) => (
                      <tr key={j}>
                        {row.map((cell, k) => (
                          <td key={k}>
                            <Inline text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case 'note':
            return (
              <aside key={i} className="note">
                <Inline text={block.text} />
              </aside>
            );
        }
      })}
    </>
  );
}
