'use client';
/**
 * FxTree — hierarchical tree view (doc 04 §2.26, APG tree pattern).
 *
 * `role="tree"` with `treeitem`/`group` children; `aria-expanded` on parents
 * only; every item reports `aria-level`/`aria-setsize`/`aria-posinset`. A single
 * tab stop with roving `tabindex` walks the *visible* nodes: ArrowDown/Up move,
 * ArrowRight expands or steps to the first child, ArrowLeft collapses or steps to
 * the parent, Home/End jump to ends, `*` expands all siblings, and typeahead
 * matches labels. `multiSelect` switches to checkbox mode with tri-state parents
 * (`aria-checked="mixed"`), `aria-multiselectable` on the tree. Lazy nodes call
 * `loadChildren`, showing `aria-busy` while pending. Expanded/selected state is
 * controlled or uncontrolled (§1.5). SSR-safe: no effects run server-side.
 */
import { useCallback, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { FxIcon } from '../icon/FxIcon';
import type { IconName } from '../icon/map';

export type TreeKey = string | number;

/** One node in the tree. */
export interface TreeNode {
  /** Unique key within the whole tree. */
  key: TreeKey;
  /** Visible label — drives typeahead & a11y. */
  label: string;
  /** Optional leading icon. */
  icon?: IconName;
  /** Child nodes (a parent). */
  children?: TreeNode[];
  /** Non-selectable, dimmed. */
  disabled?: boolean;
  /** Children are loaded on first expand via `loadChildren`. */
  lazy?: boolean;
}

/** Tri-state a checkbox parent can report. */
type Checked = 'true' | 'false' | 'mixed';

export interface FxTreeProps {
  /** The root nodes. */
  items: TreeNode[];
  /** Controlled expanded keys (§1.5). */
  expandedKeys?: TreeKey[];
  /** Uncontrolled initial expanded keys. */
  defaultExpandedKeys?: TreeKey[];
  /** Controlled selected keys (§1.5). */
  selectedKeys?: TreeKey[];
  /** Uncontrolled initial selected keys. */
  defaultSelectedKeys?: TreeKey[];
  /** Checkbox mode with tri-state parents. Defaults to `false`. */
  multiSelect?: boolean;
  /** Loader for `lazy` nodes; pending shows a spinner + `aria-busy`. */
  loadChildren?: (key: TreeKey) => Promise<TreeNode[]>;
  /** Accessible name for the tree. */
  'aria-label'?: string;
  /** aria-labelledby id when a visible label exists. */
  'aria-labelledby'?: string;
  /** Fired when the expanded set changes. */
  onExpandedChange?: (keys: TreeKey[]) => void;
  /** Fired when the selection set changes. */
  onSelectionChange?: (keys: TreeKey[]) => void;
  /** Fired on activation (Enter / click) of an enabled node. */
  onSelect?: (item: TreeNode) => void;
  className?: string;
}

/** A node paired with its resolved (possibly lazily loaded) children. */
interface Resolved {
  node: TreeNode;
  level: number;
  children: TreeNode[];
  hasChildren: boolean;
}

function hasKids(node: TreeNode, loaded: Map<TreeKey, TreeNode[]>): boolean {
  if (node.lazy) return true;
  const kids = loaded.get(node.key) ?? node.children;
  return !!kids && kids.length > 0;
}

/** Pre-order walk of the visible (expanded-reachable) nodes. */
function flatten(
  nodes: TreeNode[],
  expanded: TreeKey[],
  loaded: Map<TreeKey, TreeNode[]>,
  level: number,
  out: Resolved[],
): void {
  for (const node of nodes) {
    const children = loaded.get(node.key) ?? node.children ?? [];
    out.push({ node, level, children, hasChildren: hasKids(node, loaded) });
    if (expanded.includes(node.key) && children.length > 0) {
      flatten(children, expanded, loaded, level + 1, out);
    }
  }
}

/** Collect a node's key + all descendant keys (for cascade selection). */
function subtreeKeys(node: TreeNode, loaded: Map<TreeKey, TreeNode[]>, acc: TreeKey[]): void {
  if (node.disabled) return;
  acc.push(node.key);
  const kids = loaded.get(node.key) ?? node.children ?? [];
  for (const k of kids) subtreeKeys(k, loaded, acc);
}

export function FxTree({
  items,
  expandedKeys,
  defaultExpandedKeys = [],
  selectedKeys,
  defaultSelectedKeys = [],
  multiSelect = false,
  loadChildren,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  onExpandedChange,
  onSelectionChange,
  onSelect,
  className,
}: FxTreeProps) {
  const baseId = useId();

  const expControlled = expandedKeys !== undefined;
  const [internalExp, setInternalExp] = useState<TreeKey[]>(defaultExpandedKeys);
  const expanded = expControlled ? expandedKeys : internalExp;

  const selControlled = selectedKeys !== undefined;
  const [internalSel, setInternalSel] = useState<TreeKey[]>(defaultSelectedKeys);
  const selected = selControlled ? selectedKeys : internalSel;

  const [loaded] = useState(() => new Map<TreeKey, TreeNode[]>());
  const [pending, setPending] = useState<TreeKey[]>([]);
  const [, forceRender] = useState(0);

  const [activeKey, setActiveKey] = useState<TreeKey | null>(null);
  const rowRefs = useRef<Map<TreeKey, HTMLDivElement>>(new Map());
  const typeahead = useRef({ buffer: '', timer: null as ReturnType<typeof setTimeout> | null });

  const visible: Resolved[] = [];
  flatten(items, expanded, loaded, 1, visible);

  const activeIndex = (() => {
    if (activeKey == null) return visible.findIndex((r) => !r.node.disabled);
    const i = visible.findIndex((r) => r.node.key === activeKey);
    return i >= 0 ? i : visible.findIndex((r) => !r.node.disabled);
  })();

  const commitExpanded = useCallback(
    (next: TreeKey[]) => {
      if (!expControlled) setInternalExp(next);
      onExpandedChange?.(next);
    },
    [expControlled, onExpandedChange],
  );

  const commitSelected = useCallback(
    (next: TreeKey[]) => {
      if (!selControlled) setInternalSel(next);
      onSelectionChange?.(next);
    },
    [selControlled, onSelectionChange],
  );

  const focusKey = (key: TreeKey) => {
    setActiveKey(key);
    rowRefs.current.get(key)?.focus();
  };

  const expand = (node: TreeNode) => {
    if (expanded.includes(node.key)) return;
    if (node.lazy && !loaded.has(node.key) && loadChildren) {
      setPending((p) => [...p, node.key]);
      loadChildren(node.key)
        .then((kids) => {
          loaded.set(node.key, kids);
          setPending((p) => p.filter((k) => k !== node.key));
          commitExpanded([...expanded, node.key]);
          forceRender((n) => n + 1);
        })
        .catch(() => {
          loaded.set(node.key, []);
          setPending((p) => p.filter((k) => k !== node.key));
          forceRender((n) => n + 1);
        });
      return;
    }
    commitExpanded([...expanded, node.key]);
  };

  const collapse = (node: TreeNode) => {
    commitExpanded(expanded.filter((k) => k !== node.key));
  };

  const activate = (node: TreeNode) => {
    if (node.disabled) return;
    onSelect?.(node);
    if (multiSelect) return; // Enter activates; Space toggles the checkbox.
    commitSelected([node.key]);
  };

  const toggleCheck = (node: TreeNode) => {
    if (node.disabled) return;
    const keys: TreeKey[] = [];
    subtreeKeys(node, loaded, keys);
    const allOn = keys.every((k) => selected.includes(k));
    const set = new Set(selected);
    if (allOn) keys.forEach((k) => set.delete(k));
    else keys.forEach((k) => set.add(k));
    commitSelected([...set]);
    onSelect?.(node);
  };

  /** Tri-state for a checkbox parent, derived from its subtree selection. */
  const checkStateOf = (r: Resolved): Checked => {
    const keys: TreeKey[] = [];
    subtreeKeys(r.node, loaded, keys);
    if (keys.length === 0) return selected.includes(r.node.key) ? 'true' : 'false';
    const on = keys.filter((k) => selected.includes(k)).length;
    if (on === 0) return 'false';
    if (on === keys.length) return 'true';
    return 'mixed';
  };

  const expandSiblings = (index: number) => {
    const level = visible[index]?.level;
    if (level == null) return;
    const next = new Set(expanded);
    for (const r of visible) {
      if (r.level === level && r.hasChildren && !r.node.lazy) next.add(r.node.key);
    }
    commitExpanded([...next]);
  };

  const stepVisible = (from: number, dir: 1 | -1) => {
    let i = from;
    for (let n = 0; n < visible.length; n += 1) {
      i += dir;
      if (i < 0 || i >= visible.length) return from;
      if (!visible[i]?.node.disabled) return i;
    }
    return from;
  };

  const edge = (dir: 1 | -1) => {
    if (dir === 1) {
      for (let i = 0; i < visible.length; i += 1) if (!visible[i]?.node.disabled) return i;
    } else {
      for (let i = visible.length - 1; i >= 0; i -= 1) if (!visible[i]?.node.disabled) return i;
    }
    return activeIndex;
  };

  const runTypeahead = (char: string) => {
    const ta = typeahead.current;
    if (ta.timer) clearTimeout(ta.timer);
    ta.buffer += char.toLowerCase();
    ta.timer = setTimeout(() => {
      ta.buffer = '';
    }, 500);
    const match = visible.findIndex(
      (r) => !r.node.disabled && r.node.label.toLowerCase().startsWith(ta.buffer),
    );
    if (match >= 0) focusKey(visible[match]!.node.key);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>, index: number) => {
    const r = visible[index];
    if (!r) return;
    const isOpen = expanded.includes(r.node.key);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusKey(visible[stepVisible(index, 1)]!.node.key);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusKey(visible[stepVisible(index, -1)]!.node.key);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (r.hasChildren && !isOpen) expand(r.node);
      else if (r.hasChildren && isOpen) {
        const child = visible[index + 1];
        if (child && child.level > r.level) focusKey(child.node.key);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (r.hasChildren && isOpen) collapse(r.node);
      else {
        for (let i = index - 1; i >= 0; i -= 1) {
          if (visible[i]!.level < r.level) {
            focusKey(visible[i]!.node.key);
            break;
          }
        }
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusKey(visible[edge(1)]!.node.key);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusKey(visible[edge(-1)]!.node.key);
    } else if (e.key === '*') {
      e.preventDefault();
      expandSiblings(index);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      activate(r.node);
    } else if (e.key === ' ') {
      e.preventDefault();
      if (multiSelect) toggleCheck(r.node);
      else activate(r.node);
    } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      runTypeahead(e.key);
    }
  };

  const rootClass = ['fx-tree', className].filter(Boolean).join(' ');
  const tabKey = visible[activeIndex]?.node.key;

  const renderItems = (nodes: TreeNode[], level: number) => (
    <ul
      className={level === 1 ? 'fx-tree-list' : 'fx-tree-children'}
      role={level === 1 ? 'none' : 'group'}
    >
      {nodes.map((node, i) => {
        const has = hasKids(node, loaded);
        const isOpen = expanded.includes(node.key);
        const children = loaded.get(node.key) ?? node.children ?? [];
        const isBusy = pending.includes(node.key);
        const flatIndex = visible.findIndex((r) => r.node.key === node.key);
        const resolved = visible[flatIndex];
        const isSelected = selected.includes(node.key);
        const check: Checked | undefined =
          multiSelect && resolved ? checkStateOf(resolved) : undefined;
        const isActive = node.key === activeKey || (activeKey == null && node.key === tabKey);

        const rowClass = [
          'fx-tree-item-row',
          isSelected ? 'is-selected' : '',
          node.disabled ? 'is-disabled' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <li
            key={node.key}
            className="fx-tree-item"
            role="treeitem"
            aria-level={level}
            aria-setsize={nodes.length}
            aria-posinset={i + 1}
            aria-expanded={has ? isOpen : undefined}
            aria-selected={!multiSelect ? isSelected : undefined}
            aria-checked={multiSelect ? check : undefined}
            aria-disabled={node.disabled || undefined}
            aria-busy={isBusy || undefined}
          >
            <div
              ref={(el) => {
                if (el) rowRefs.current.set(node.key, el);
                else rowRefs.current.delete(node.key);
              }}
              className={rowClass}
              style={{ paddingInlineStart: `calc(${level} * var(--fx-space-4))` }}
              tabIndex={node.disabled ? undefined : node.key === tabKey ? 0 : -1}
              data-active={isActive || undefined}
              onFocus={() => setActiveKey(node.key)}
              onClick={() => {
                if (multiSelect) toggleCheck(node);
                else activate(node);
              }}
              onKeyDown={(e) => onKeyDown(e, flatIndex)}
            >
              {has ? (
                <span
                  className="fx-tree-item-toggle"
                  aria-hidden="true"
                  data-open={isOpen || undefined}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isOpen) collapse(node);
                    else expand(node);
                  }}
                >
                  {isBusy ? (
                    <span className="fx-tree-spinner">
                      <FxIcon name="refresh" size={16} />
                    </span>
                  ) : (
                    <FxIcon name="chevron" size={16} />
                  )}
                </span>
              ) : (
                <span className="fx-tree-item-spacer" aria-hidden="true" />
              )}
              {multiSelect && (
                <span className="fx-tree-item-checkbox" aria-hidden="true" data-state={check}>
                  {check === 'true' ? (
                    <FxIcon name="check" size={16} />
                  ) : check === 'mixed' ? (
                    <FxIcon name="minus" size={16} />
                  ) : null}
                </span>
              )}
              {node.icon && (
                <span className="fx-tree-item-icon" aria-hidden="true">
                  <FxIcon name={node.icon} size={16} />
                </span>
              )}
              <span className="fx-tree-item-label">{node.label}</span>
            </div>
            {has && isOpen && children.length > 0 && renderItems(children, level + 1)}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div
      className={rootClass}
      id={baseId}
      role="tree"
      aria-multiselectable={multiSelect || undefined}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
    >
      {renderItems(items, 1)}
    </div>
  );
}
