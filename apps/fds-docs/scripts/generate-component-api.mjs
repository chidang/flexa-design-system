/**
 * Component API generator (doc 16 P-A) — the prebuild step of the docs build.
 *
 * Reads `packages/ui/src/**` with the TypeScript compiler API (no extra deps —
 * `typescript` is already a devDependency of this app) and emits ONE JSON
 * artifact, `content/generated/components-api.json`, holding for every
 * registered component:
 *
 *   - name / slug / category / component identifier (from its showcase spec)
 *   - the component file's JSDoc header, as paragraphs (the "rich description")
 *   - a props table extracted from the component's own props type:
 *     name / type / default / required / JSDoc description — own + kit-inherited
 *     members only (DOM attribute inheritance is summarized in `inherits`)
 *   - the full `*.showcase.ts` source (the runnable example the kitchen-sink
 *     and docs demos are generated from)
 *   - the category list (same `UI_CATEGORIES` order the kitchen-sink uses)
 *
 * The artifact is gitignored and rebuilt on every `pnpm --filter @flexa/fds-docs
 * build`; pages consume it only through the CMS-swappable seam in
 * `src/componentApi.ts` (never at module scope), so `next dev` without a prior
 * generation still works.
 *
 * This script READS packages/ui and never writes outside apps/fds-docs.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const APP_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const UI_DIR = join(APP_DIR, '..', '..', 'packages', 'ui');
const UI_SRC = join(UI_DIR, 'src');
const OUT_FILE = join(APP_DIR, 'content', 'generated', 'components-api.json');

// ── Program setup ───────────────────────────────────────────────────────────

/** Every .ts/.tsx under packages/ui/src (showcases included — they are parsed). */
function collectSourceFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectSourceFiles(full));
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

function createProgram() {
  const configFile = ts.readConfigFile(join(UI_DIR, 'tsconfig.json'), ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(configFile.config ?? {}, ts.sys, UI_DIR);
  return ts.createProgram(collectSourceFiles(UI_SRC), {
    ...parsed.options,
    noEmit: true,
    skipLibCheck: true,
  });
}

// ── Small AST helpers ───────────────────────────────────────────────────────

function isExported(node) {
  return (
    ts.canHaveModifiers(node) &&
    (ts.getModifiers(node) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
  );
}

/** The first JSDoc block in a file, cleaned into paragraphs. */
function fileHeaderParagraphs(sourceText) {
  const match = sourceText.match(/\/\*\*[\s\S]*?\*\//);
  if (!match) return [];
  const body = match[0]
    .replace(/^\/\*\*/, '')
    .replace(/\*\/$/, '')
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, '').trimEnd())
    .join('\n')
    .trim();
  return body
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);
}

/** String (or raw-text) value of an object-literal property, or undefined. */
function literalProp(objectLiteral, name) {
  for (const prop of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    if (prop.name.getText() !== name) continue;
    if (ts.isStringLiteralLike(prop.initializer)) return prop.initializer.text;
    return prop.initializer.getText();
  }
  return undefined;
}

// ── Showcase spec meta (name/slug/category/component) via AST ───────────────

function readShowcaseMeta(sourceFile) {
  for (const stmt of sourceFile.statements) {
    if (!ts.isVariableStatement(stmt) || !isExported(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      let init = decl.initializer;
      if (!init) continue;
      if (ts.isSatisfiesExpression(init) || ts.isAsExpression(init)) init = init.expression;
      if (!ts.isObjectLiteralExpression(init)) continue;
      const slug = literalProp(init, 'slug');
      const component = literalProp(init, 'component');
      if (!slug || !component) continue;
      return {
        slug,
        name: literalProp(init, 'name') ?? slug,
        category: literalProp(init, 'category') ?? 'other',
        component,
      };
    }
  }
  return undefined;
}

// ── UI_CATEGORIES via AST (same list the kitchen-sink groups by) ────────────

function readCategories(registrySource) {
  const categories = [];
  for (const stmt of registrySource.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (decl.name.getText() !== 'UI_CATEGORIES') continue;
      if (!decl.initializer || !ts.isArrayLiteralExpression(decl.initializer)) continue;
      for (const el of decl.initializer.elements) {
        if (!ts.isObjectLiteralExpression(el)) continue;
        categories.push({
          id: literalProp(el, 'id') ?? '',
          title: literalProp(el, 'title') ?? '',
          blurb: literalProp(el, 'blurb') ?? '',
        });
      }
    }
  }
  return categories;
}

// ── Props extraction ────────────────────────────────────────────────────────

function insideUiSrc(fileName) {
  const rel = relative(UI_SRC, fileName);
  return !rel.startsWith('..') && !rel.includes(`${sep}node_modules${sep}`);
}

/** Defaults from the component's destructured parameter (or body destructuring). */
function collectDefaults(fn) {
  const defaults = new Map();
  const param = fn.parameters[0];
  const fromPattern = (pattern) => {
    for (const el of pattern.elements) {
      if (!ts.isBindingElement(el) || !el.initializer) continue;
      const key = (el.propertyName ?? el.name).getText();
      defaults.set(key, el.initializer.getText());
    }
  };
  if (param && ts.isObjectBindingPattern(param.name)) fromPattern(param.name);
  // `export function FxX(props: FxXProps) { const { a = 1 } = props; … }`
  if (param && ts.isIdentifier(param.name) && fn.body) {
    const paramName = param.name.text;
    for (const stmt of fn.body.statements) {
      if (!ts.isVariableStatement(stmt)) continue;
      for (const decl of stmt.declarationList.declarations) {
        if (
          ts.isObjectBindingPattern(decl.name) &&
          decl.initializer &&
          decl.initializer.getText() === paramName
        ) {
          fromPattern(decl.name);
        }
      }
    }
  }
  return defaults;
}

/**
 * External base types of the props interface (e.g. DOM attribute bags) — their
 * members are NOT listed row-by-row; the docs page summarizes them instead.
 * A heritage entry is "external" when none of its members are declared in the
 * kit's own source.
 */
function externalHeritage(checker, propsTypeNode) {
  const out = [];
  const type = checker.getTypeAtLocation(propsTypeNode);
  const decls = type.getSymbol()?.getDeclarations() ?? [];
  for (const decl of decls) {
    if (!ts.isInterfaceDeclaration(decl) || !insideUiSrc(decl.getSourceFile().fileName)) continue;
    for (const clause of decl.heritageClauses ?? []) {
      for (const expr of clause.types) {
        const t = checker.getTypeAtLocation(expr);
        const members = t.getProperties();
        const hasKitMember = members.some((m) =>
          (m.getDeclarations() ?? []).some((d) => insideUiSrc(d.getSourceFile().fileName)),
        );
        if (!hasKitMember) out.push(expr.getText());
      }
    }
  }
  return out;
}

function extractProps(checker, fn, componentFileName) {
  const param = fn.parameters[0];
  if (!param) return { props: [], propsType: undefined, inherits: [] };
  const typeNode = param.type;
  const target = typeNode ?? param;
  const type = checker.getTypeAtLocation(target);
  const defaults = collectDefaults(fn);
  const rows = [];
  for (const sym of type.getProperties()) {
    const decl = (sym.getDeclarations() ?? []).find(
      (d) => ts.isPropertySignature(d) || ts.isPropertyDeclaration(d),
    );
    if (!decl || !insideUiSrc(decl.getSourceFile().fileName)) continue;
    const name = sym.getName();
    const typeText = decl.type
      ? decl.type.getText()
      : checker.typeToString(
          checker.getTypeOfSymbolAtLocation(sym, target),
          undefined,
          ts.TypeFormatFlags.NoTruncation,
        );
    const jsDocDefault = ts.getJSDocTags(decl).find((t) => t.tagName.text === 'default');
    const row = {
      name,
      type: typeText.replace(/\s+/g, ' '),
      required: !(sym.flags & ts.SymbolFlags.Optional) && !decl.questionToken,
      description: ts.displayPartsToString(sym.getDocumentationComment(checker)).trim(),
      declFile: decl.getSourceFile().fileName,
      pos: decl.pos,
    };
    const def =
      defaults.get(name) ??
      (typeof jsDocDefault?.comment === 'string' ? jsDocDefault.comment : undefined);
    if (def) row.default = def.replace(/\s+/g, ' ');
    rows.push(row);
  }
  // Own props first (declaration order), then kit-inherited ones.
  rows.sort((a, b) => {
    const aOwn = a.declFile === componentFileName ? 0 : 1;
    const bOwn = b.declFile === componentFileName ? 0 : 1;
    if (aOwn !== bOwn) return aOwn - bOwn;
    if (a.declFile !== b.declFile) return a.declFile < b.declFile ? -1 : 1;
    return a.pos - b.pos;
  });
  for (const row of rows) {
    delete row.declFile;
    delete row.pos;
  }
  const propsType =
    typeNode && ts.isTypeReferenceNode(typeNode) ? typeNode.typeName.getText() : undefined;
  return {
    props: rows,
    propsType,
    inherits: typeNode ? externalHeritage(checker, typeNode) : [],
  };
}

/** Find `export function <name>` across the .tsx files of one component dir. */
function findComponentFunction(program, dir, name) {
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.tsx')) continue;
    const sf = program.getSourceFile(join(dir, file));
    if (!sf) continue;
    for (const stmt of sf.statements) {
      if (ts.isFunctionDeclaration(stmt) && stmt.name?.text === name && isExported(stmt)) {
        return { fn: stmt, sourceFile: sf };
      }
    }
  }
  return undefined;
}

// ── Main ────────────────────────────────────────────────────────────────────

function main() {
  const program = createProgram();
  const checker = program.getTypeChecker();

  const registrySf = program.getSourceFile(join(UI_SRC, 'registry.ts'));
  const categories = registrySf ? readCategories(registrySf) : [];

  const components = {};
  const skipped = [];

  const dirs = readdirSync(UI_SRC, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  for (const dir of dirs) {
    const dirPath = join(UI_SRC, dir);
    const showcaseFile = readdirSync(dirPath).find((f) => f.endsWith('.showcase.ts'));
    if (!showcaseFile) continue; // helper dirs (e.g. icon/) carry no showcase
    const showcasePath = join(dirPath, showcaseFile);
    const showcaseSf = program.getSourceFile(showcasePath);
    const meta = showcaseSf && readShowcaseMeta(showcaseSf);
    if (!meta) {
      skipped.push(`${dir}: could not read showcase spec meta`);
      continue;
    }
    const found = findComponentFunction(program, dirPath, meta.component);
    if (!found) {
      skipped.push(`${dir}: exported function ${meta.component} not found`);
      continue;
    }
    const { fn, sourceFile } = found;
    const { props, propsType, inherits } = extractProps(checker, fn, sourceFile.fileName);
    components[meta.slug] = {
      slug: meta.slug,
      name: meta.name,
      category: meta.category,
      component: meta.component,
      sourceFile: relative(UI_SRC, sourceFile.fileName).split(sep).join('/'),
      description: fileHeaderParagraphs(sourceFile.getFullText()),
      propsType,
      inherits,
      props,
      example: {
        file: relative(UI_SRC, showcasePath).split(sep).join('/'),
        source: readFileSync(showcasePath, 'utf8'),
      },
    };
  }

  const grouped = categories
    .map((category) => ({
      ...category,
      components: Object.values(components)
        .filter((c) => c.category === category.id)
        .map((c) => c.slug),
    }))
    .filter((c) => c.components.length > 0);

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, `${JSON.stringify({ categories: grouped, components }, null, 2)}\n`);

  const count = Object.keys(components).length;
  const emptyProps = Object.values(components)
    .filter((c) => c.props.length === 0)
    .map((c) => c.slug);
  console.log(`components-api: ${count} components → ${relative(APP_DIR, OUT_FILE)}`);
  if (emptyProps.length) console.log(`  no extractable props: ${emptyProps.join(', ')}`);
  for (const s of skipped) console.warn(`  SKIPPED ${s}`);
  if (count === 0) {
    console.error('components-api: extracted zero components — failing the build');
    process.exit(1);
  }
}

main();
