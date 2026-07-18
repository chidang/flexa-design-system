import { describe, expect, it } from 'vitest';
import { groupsToDecls, nodeStyleToSpec, pruneNodeStyle } from '../src/nodeStyle.js';
import type { NodeStyle } from '../src/types.js';

describe('groupsToDecls (closed mapping table, 07 §2.3)', () => {
  it('maps every group in deterministic declaration order', () => {
    const decls = groupsToDecls({
      spacing: { margin: '0 auto', padding: '24px' },
      background: { color: '#fff' },
      border: { width: '1px', style: 'solid', color: '#ddd', radius: '8px' },
      shadow: { x: 0, y: 4, blur: 12, spread: 2, color: '#0003' },
      typography: {
        family: 'Inter',
        size: 16,
        weight: 500,
        lineHeight: 1.6,
        letterSpacing: 0.5,
        transform: 'uppercase',
        color: '#123',
        align: 'center',
      },
      size: { width: '100%', maxWidth: '960px', minHeight: '200px' },
      opacity: 0.9,
    });
    expect(Object.keys(decls)).toEqual([
      'margin', 'padding', 'background-color',
      'border-width', 'border-style', 'border-color', 'border-radius',
      'box-shadow',
      'font-family', 'font-size', 'font-weight', 'line-height',
      'letter-spacing', 'text-transform', 'color', 'text-align',
      'width', 'max-width', 'min-height', 'opacity',
    ]);
    expect(decls['box-shadow']).toBe('0px 4px 12px 2px #0003');
  });

  it('shadow: missing numbers default to 0, inset prefixes, no color → skipped', () => {
    expect(groupsToDecls({ shadow: { color: '#000' } })['box-shadow']).toBe('0px 0px 0px 0px #000');
    expect(groupsToDecls({ shadow: { y: 6, color: '#000', inset: true } })['box-shadow']).toBe(
      'inset 0px 6px 0px 0px #000',
    );
    expect(groupsToDecls({ shadow: { x: 2, y: 2, blur: 8 } })).toEqual({});
  });

  it('numeric zero is a real value (opacity 0, letterSpacing 0)', () => {
    const decls = groupsToDecls({ typography: { letterSpacing: 0 }, opacity: 0 });
    expect(decls['letter-spacing']).toBe(0);
    expect(decls['opacity']).toBe(0);
  });

  it('size extras + layout map in order after min-height (Slice C)', () => {
    const decls = groupsToDecls({
      size: {
        width: '100%', maxWidth: '960px', minHeight: '200px',
        height: '50vh', minWidth: '120px', maxHeight: '80vh', aspectRatio: '16 / 9',
      },
      layout: { zIndex: 10, order: -1, overflow: 'hidden' },
    });
    expect(Object.keys(decls)).toEqual([
      'width', 'max-width', 'min-height',
      'height', 'min-width', 'max-height', 'aspect-ratio',
      'z-index', 'order', 'overflow',
    ]);
    expect(decls['aspect-ratio']).toBe('16 / 9');
    // Bare numbers — z-index/order are in the compiler's UNITLESS set.
    expect(decls['z-index']).toBe(10);
    expect(decls['order']).toBe(-1);
  });

  it('effects: filter composes in fixed order, only present keys; zero kept', () => {
    const decls = groupsToDecls({
      effects: { hueRotate: 90, blur: 4, grayscale: 0, brightness: 1.2 },
    });
    expect(decls['filter']).toBe('blur(4px) brightness(1.2) grayscale(0) hue-rotate(90deg)');
    expect(groupsToDecls({ effects: {} })).toEqual({});
  });

  it('transform: translate → scale → rotate → skew; missing fields per §2.3', () => {
    const full = groupsToDecls({
      transform: {
        translateX: '10px', translateY: '-50%', scaleX: 1.1, scaleY: 0.9,
        rotate: 45, skewX: 5, skewY: -5,
      },
    });
    expect(full['transform']).toBe(
      'translate(10px, -50%) scale(1.1, 0.9) rotate(45deg) skew(5deg, -5deg)',
    );

    // Functions are emitted only when at least one of their fields is present.
    expect(groupsToDecls({ transform: { translateX: '10px' } })['transform']).toBe(
      'translate(10px, 0)',
    );
    expect(groupsToDecls({ transform: { scaleY: 2 } })['transform']).toBe('scale(1, 2)');
    expect(groupsToDecls({ transform: { skewY: 3 } })['transform']).toBe('skew(0deg, 3deg)');
    expect(groupsToDecls({ transform: {} })).toEqual({});
  });

  it('display + position + flexItem + gridItem map per §2.3 (Slice D)', () => {
    const decls = groupsToDecls({
      layout: { display: 'flex' },
      position: { mode: 'absolute', top: '0', right: '8px', bottom: 'auto', left: '50%' },
      flexItem: { alignSelf: 'center', grow: 1, shrink: 0, basis: '200px' },
      gridItem: { column: '1 / 3', row: '2', justifySelf: 'end' },
    });
    expect(Object.keys(decls)).toEqual([
      'display', 'position', 'top', 'right', 'bottom', 'left',
      'align-self', 'flex-grow', 'flex-shrink', 'flex-basis',
      'grid-column', 'grid-row', 'justify-self',
    ]);
    // grow/shrink are bare numbers — both in the compiler's UNITLESS set.
    expect(decls['flex-grow']).toBe(1);
    expect(decls['flex-shrink']).toBe(0);
  });

  it('position offsets emit independently of mode (07 §2.2)', () => {
    const decls = groupsToDecls({ position: { top: '16px' } });
    expect(decls).toEqual({ top: '16px' });
    expect(groupsToDecls({ position: { mode: 'sticky' } })).toEqual({ position: 'sticky' });
  });

  it('gridItem.alignSelf wins over flexItem.alignSelf when both set (later key)', () => {
    const decls = groupsToDecls({
      flexItem: { alignSelf: 'center' },
      gridItem: { alignSelf: 'stretch' },
    });
    expect(decls['align-self']).toBe('stretch');
  });

  it('transform-origin: separate decl, missing axis defaults to center', () => {
    const decls = groupsToDecls({ transform: { rotate: 90, originX: 'left' } });
    expect(decls['transform']).toBe('rotate(90deg)');
    expect(decls['transform-origin']).toBe('left center');
    // Origin alone still emits transform-origin (no transform decl).
    const originOnly = groupsToDecls({ transform: { originY: 'top' } });
    expect(originOnly['transform']).toBeUndefined();
    expect(originOnly['transform-origin']).toBe('center top');
  });
});

describe('nodeStyleToSpec (07 §2.2)', () => {
  it('empty style → null (no rule emitted)', () => {
    expect(nodeStyleToSpec({})).toBeNull();
    expect(nodeStyleToSpec({ spacing: {}, hover: {}, tablet: {} })).toBeNull();
    expect(nodeStyleToSpec({ shadow: { x: 4 } })).toBeNull(); // no color → skipped
  });

  it('single "&" rule with @hover and @responsive pages', () => {
    const spec = nodeStyleToSpec({
      background: { color: '#fff' },
      hover: { background: { color: '#eef' } },
      laptop: { spacing: { padding: '24px' } },
      tablet: { spacing: { padding: '16px' } },
      mobile: { spacing: { padding: '8px' } },
    });
    expect(spec).toEqual({
      '&': {
        'background-color': '#fff',
        '@hover': { 'background-color': '#eef' },
        '@responsive': {
          laptop: { padding: '24px' },
          tablet: { padding: '16px' },
          mobile: { padding: '8px' },
        },
      },
    });
  });

  it('empty breakpoint/hover pages are omitted', () => {
    const spec = nodeStyleToSpec({
      background: { color: '#fff' },
      tablet: { shadow: { x: 1 } }, // shadow without color → empty page
      hover: {},
    });
    expect(spec).toEqual({ '&': { 'background-color': '#fff' } });
  });

  it('active/focus pages compile to @active/@focus (Slice D — engine untouched)', () => {
    const spec = nodeStyleToSpec({
      background: { color: '#fff' },
      hover: { background: { color: '#eef' } },
      active: { background: { color: '#dde' } },
      focus: { border: { color: '#4f7cff' }, opacity: 1 },
    });
    expect(spec).toEqual({
      '&': {
        'background-color': '#fff',
        '@hover': { 'background-color': '#eef' },
        '@active': { 'background-color': '#dde' },
        '@focus': { 'border-color': '#4f7cff', opacity: 1 },
      },
    });
  });

  it('hover.transform compiles into the @hover page (Slice C — hover lift)', () => {
    const spec = nodeStyleToSpec({
      background: { color: '#fff' },
      hover: { transform: { translateY: '-4px' } },
    });
    expect(spec).toEqual({
      '&': {
        'background-color': '#fff',
        '@hover': { transform: 'translate(0, -4px)' },
      },
    });
  });

  it('transition needs duration; easing defaults to ease', () => {
    expect(nodeStyleToSpec({ transition: { duration: 300 } })).toEqual({
      '&': { transition: 'all 300ms ease' },
    });
    expect(nodeStyleToSpec({ transition: { duration: 150, easing: 'linear' } })).toEqual({
      '&': { transition: 'all 150ms linear' },
    });
    expect(nodeStyleToSpec({ transition: { easing: 'linear' } })).toBeNull();
  });
});

describe('pruneNodeStyle (prune contract, 07 §2.1)', () => {
  it('drops undefined/null/empty-string values and empty objects at every level', () => {
    const pruned = pruneNodeStyle({
      spacing: { margin: '', padding: '8px' },
      background: { color: '' },
      tablet: { typography: { color: '' } },
      hover: {},
    } as NodeStyle);
    expect(pruned).toEqual({ spacing: { padding: '8px' } });
  });

  it('keeps 0 and false (real values), never stores undefined', () => {
    const pruned = pruneNodeStyle({
      opacity: 0,
      shadow: { y: 0, color: '#000', inset: false },
    });
    expect(pruned).toEqual({ opacity: 0, shadow: { y: 0, color: '#000', inset: false } });
    expect(JSON.parse(JSON.stringify(pruned))).toEqual(pruned); // snapshot-safe
  });

  it('everything empty → undefined (caller removes the style field)', () => {
    expect(pruneNodeStyle({})).toBeUndefined();
    expect(pruneNodeStyle({ spacing: { margin: '' }, mobile: {} } as NodeStyle)).toBeUndefined();
    expect(
      pruneNodeStyle({ layout: {}, effects: {}, transform: { translateX: '' } } as NodeStyle),
    ).toBeUndefined();
  });

  it('non-mutating: input object is left untouched', () => {
    const input: NodeStyle = { spacing: { margin: '', padding: '8px' } };
    const copy = JSON.parse(JSON.stringify(input));
    pruneNodeStyle(input);
    expect(input).toEqual(copy);
  });
});
