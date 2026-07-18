/**
 * Tree showcase spec. Component types (TreeNode, TreeKey) live in the component
 * file and are documented in `props` as type strings — no shared enum applies,
 * so `enums` is omitted.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxTree } from './tree';

const TREE = [
  {
    key: 'src',
    label: 'src',
    icon: 'file' as const,
    children: [
      { key: 'components', label: 'components', children: [
        { key: 'button', label: 'button.tsx' },
        { key: 'list', label: 'list.tsx' },
      ] },
      { key: 'index', label: 'index.ts' },
    ],
  },
  {
    key: 'assets',
    label: 'assets',
    children: [
      { key: 'logo', label: 'logo.svg' },
      { key: 'icons', label: 'icons', disabled: true, children: [{ key: 'star', label: 'star.svg' }] },
    ],
  },
  { key: 'readme', label: 'README.md' },
];

const LAZY = [
  { key: 'root', label: 'Remote folder', lazy: true },
  { key: 'local', label: 'Local file' },
];

export const treeShowcase: ShowcaseSpec = {
  name: 'Tree',
  slug: 'tree',
  category: 'data',
  slice: 'U6',
  status: 'ready',
  interactive: true,
  tagline: 'Hierarchical tree view — expand, select, multi-select with tri-state.',
  component: FxTree,
  variants: [
    { label: 'nested (collapsed)', props: { items: TREE, 'aria-label': 'Files' } },
    { label: 'expanded', props: { items: TREE, defaultExpandedKeys: ['src', 'components'], 'aria-label': 'Files' } },
    { label: 'selected', props: { items: TREE, defaultExpandedKeys: ['src'], defaultSelectedKeys: ['index'], 'aria-label': 'Files' } },
    {
      label: 'multi-select (tri-state)',
      props: {
        items: TREE,
        multiSelect: true,
        defaultExpandedKeys: ['src', 'components'],
        defaultSelectedKeys: ['button'],
        'aria-label': 'Files',
      },
    },
    { label: 'disabled node', props: { items: TREE, defaultExpandedKeys: ['assets'], 'aria-label': 'Files' } },
    { label: 'lazy (pending on expand)', props: { items: LAZY, 'aria-label': 'Remote' } },
  ],
  props: [
    { name: 'items', type: 'TreeNode[]', required: true, description: 'TreeNode = { key; label; icon?; children?; disabled?; lazy? }.' },
    { name: 'expandedKeys / defaultExpandedKeys', type: 'Key[]', default: '— / []', description: 'Expanded set (§1.5).' },
    { name: 'selectedKeys / defaultSelectedKeys', type: 'Key[]', default: '— / []', description: 'Selected set (§1.5).' },
    { name: 'multiSelect', type: 'boolean', default: 'false', description: 'Checkbox mode with tri-state parents.' },
    { name: 'loadChildren', type: '(key: Key) => Promise<TreeNode[]>', description: 'Loader for lazy nodes; pending shows spinner + aria-busy.' },
  ],
  events: [
    { name: 'onExpandedChange', payload: '(keys: Key[])', description: 'Expanded set changed.' },
    { name: 'onSelectionChange', payload: '(keys: Key[])', description: 'Selected set changed.' },
    { name: 'onSelect', payload: '(item: TreeNode)', description: 'Node activation (Enter / click).' },
  ],
  keyboard: [
    { keys: '↓ / ↑', action: 'Next / previous visible node' },
    { keys: '→', action: 'Expand / move to first child' },
    { keys: '←', action: 'Collapse / move to parent' },
    { keys: 'Enter', action: 'Activate / select' },
    { keys: 'Space', action: 'Toggle checkbox (multi-select)' },
    { keys: 'Home / End', action: 'First / last visible node' },
    { keys: '*', action: 'Expand all sibling nodes' },
    { keys: 'A–Z', action: 'Typeahead on label (500ms buffer)' },
  ],
  aria: [
    { attr: 'role', value: 'tree / treeitem / group' },
    { attr: 'aria-expanded', value: 'true | false', note: 'On parent items only.' },
    { attr: 'aria-level / setsize / posinset', value: 'ints', note: 'On every item.' },
    { attr: 'aria-multiselectable', value: 'true', note: 'multi-select mode.' },
    { attr: 'aria-checked', value: 'true | false | mixed', note: 'Tri-state parents (multi).' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxTree' },
};
