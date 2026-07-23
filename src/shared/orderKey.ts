export function midOrderKey(left: string | null, right: string | null): string {
  if (left === null && right === null) return '1000'
  if (left === null) {
    return String((Number(right) || 0) / 2)
  }
  if (right === null) {
    return String((Number(left) || 0) + 1000)
  }
  const l = Number(left) || 0
  const r = Number(right) || 0
  return String((l + r) / 2)
}

export interface FlatNode<T> {
  node: T
  depth: number
  parentId: string | null
}

export function flattenTree<T extends { id: string; parent_unit_id?: string | null }>(
  items: T[],
  sortBy: (a: T, b: T) => number
): FlatNode<T>[] {
  const childrenOf: Record<string, T[]> = {}
  const roots: T[] = []

  for (const item of items) {
    const pid = item.parent_unit_id || null
    if (pid) {
      if (!childrenOf[pid]) childrenOf[pid] = []
      childrenOf[pid].push(item)
    } else {
      roots.push(item)
    }
  }

  for (const k of Object.keys(childrenOf)) {
    childrenOf[k].sort(sortBy)
  }
  roots.sort(sortBy)

  const result: FlatNode<T>[] = []
  function walk(nodes: T[], depth: number) {
    for (const n of nodes) {
      result.push({ node: n, depth, parentId: n.parent_unit_id || null })
      const kids = childrenOf[n.id]
      if (kids && kids.length) walk(kids, depth + 1)
    }
  }
  walk(roots, 0)
  return result
}

export const sortByOrderKey = (a: any, b: any) => (Number(a.order_key) || 0) - (Number(b.order_key) || 0)
