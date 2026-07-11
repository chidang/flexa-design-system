import type { Metadata } from 'next';
import { emitBaseTypography } from 'flexa-design-system';
import { loadRecipes } from '../../src/content';
import { RECIPE_DEMOS, buildRecipe } from '../../src/recipes';
import { CopyButton } from '../../src/CopyButton';

export function generateMetadata(): Metadata {
  const doc = loadRecipes();
  return { title: doc.title, description: doc.description };
}

/* Explorer chrome — the frame/grid around each recipe. Site chrome, so it uses
   tokens like the rest of the shell (not part of a recipe's proven output). */
const EXPLORER_CSS = `
.rx-demo { display: flex; flex-direction: column; gap: var(--fx-space-4); }
.rx-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--fx-space-3);
  padding: var(--fx-space-6);
  background: var(--fx-color-bg);
  border: 1px solid var(--fx-color-border);
  border-radius: var(--fx-radius-lg);
}
.rx-css-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--fx-space-3);
  margin-bottom: var(--fx-space-2);
}
.rx-css-head > span { color: var(--fx-color-text-muted); }
.rx-copy {
  cursor: pointer;
  color: var(--fx-color-on-primary);
  background: var(--fx-color-primary);
  border: none;
  border-radius: var(--fx-radius-md);
  padding: var(--fx-space-1) var(--fx-space-4);
  font-family: var(--fx-font-family-base);
}
.rx-copy:hover { background: var(--fx-color-primary-hover); }
.rx-proof { color: var(--fx-color-text-muted); }
`;

export default function RecipesPage() {
  const doc = loadRecipes();
  const builds = RECIPE_DEMOS.map((demo) => ({ demo, build: buildRecipe(demo) }));

  return (
    <>
      <section>
        <h1>{doc.title}</h1>
        <p>{doc.intro}</p>
      </section>

      {/* Type from FDS base typography; the recipe CSS and explorer chrome next. */}
      <style dangerouslySetInnerHTML={{ __html: emitBaseTypography() }} />
      <style dangerouslySetInnerHTML={{ __html: EXPLORER_CSS }} />
      {builds.map(({ demo, build }) => (
        <style key={demo.name} dangerouslySetInnerHTML={{ __html: build.css }} />
      ))}

      {builds.map(({ demo, build }) => {
        const Tag = demo.tag;
        const clean = build.usage.unknown.length === 0;
        return (
          <section className="rx-demo" data-fx-type="flexa/root" key={demo.name}>
            <div>
              <h2>{demo.title}</h2>
              <p>{demo.blurb}</p>
            </div>

            <div className="rx-row">
              {demo.instances.map((inst, i) => (
                <Tag className={`rx-${demo.name}-${i}`} key={inst.label}>
                  <strong>{inst.label}</strong>
                  {inst.note ? <span>{inst.note}</span> : null}
                </Tag>
              ))}
            </div>

            <details>
              <summary>{doc.dataSummary}</summary>
              <pre>
                <code>{build.recipeJson}</code>
              </pre>
            </details>

            <div>
              <div className="rx-css-head">
                <span>{doc.cssTitle}</span>
                <CopyButton text={build.css} />
              </div>
              <pre>
                <code>{build.css}</code>
              </pre>
            </div>

            <p
              className="rx-proof"
              style={clean ? undefined : { color: 'var(--fx-color-danger)' }}
            >
              {clean
                ? `${build.usage.used.length} distinct tokens, 0 off-system.`
                : `Off-system: ${build.usage.unknown.join(', ')}`}
            </p>
          </section>
        );
      })}

      <section>
        <h2>{doc.proofTitle}</h2>
        <p>{doc.proofBlurb}</p>
      </section>
    </>
  );
}
