import { clampLayer, type DesignLayer } from './composition'
import type { StudioDraft } from './studio'

export type Alignment =
  | 'left'
  | 'center'
  | 'right'
  | 'top'
  | 'middle'
  | 'bottom'
  | 'horizontal'
  | 'vertical'
export function alignLayers(
  layers: DesignLayer[],
  ids: string[],
  alignment: Alignment,
) {
  const selection = layers.filter(
    (l) => ids.includes(l.id) && !l.locked && !l.hidden,
  )
  if (selection.length < 2 || new Set(selection.map((l) => l.page)).size !== 1)
    return layers
  const left = Math.min(...selection.map((l) => l.x)),
    right = Math.max(...selection.map((l) => l.x + l.width))
  const top = Math.min(...selection.map((l) => l.y)),
    bottom = Math.max(...selection.map((l) => l.y + l.height))
  if (alignment === 'horizontal' || alignment === 'vertical') {
    if (selection.length < 3) return layers
    const axis = alignment === 'horizontal' ? 'x' : 'y',
      size = axis === 'x' ? 'width' : 'height'
    const sorted = [...selection].sort((a, b) => a[axis] - b[axis])
    const start = sorted[0][axis],
      end = Math.max(...sorted.map((l) => l[axis] + l[size]))
    const gap =
      (end - start - sorted.reduce((sum, l) => sum + l[size], 0)) /
      (sorted.length - 1)
    let cursor = start
    const positions = new Map(
      sorted.map((l) => {
        const entry = [l.id, Math.round(cursor)] as const
        cursor += l[size] + gap
        return entry
      }),
    )
    return layers.map((l) =>
      positions.has(l.id)
        ? clampLayer({ ...l, [axis]: positions.get(l.id)! })
        : l,
    )
  }
  return layers.map((l) =>
    !selection.includes(l)
      ? l
      : clampLayer({
          ...l,
          x:
            alignment === 'left'
              ? left
              : alignment === 'right'
                ? right - l.width
                : alignment === 'center'
                  ? Math.round((left + right - l.width) / 2)
                  : l.x,
          y:
            alignment === 'top'
              ? top
              : alignment === 'bottom'
                ? bottom - l.height
                : alignment === 'middle'
                  ? Math.round((top + bottom - l.height) / 2)
                  : l.y,
        }),
  )
}
export function moveLayers(
  layers: DesignLayer[],
  ids: string[],
  dx: number,
  dy: number,
) {
  const selection = layers.filter(
    (l) => ids.includes(l.id) && !l.locked && !l.hidden,
  )
  if (!selection.length) return layers
  dx = Math.round(
    Math.max(
      -Math.min(...selection.map((l) => l.x)),
      Math.min(dx, 1200 - Math.max(...selection.map((l) => l.x + l.width))),
    ),
  )
  dy = Math.round(
    Math.max(
      -Math.min(...selection.map((l) => l.y)),
      Math.min(dy, 900 - Math.max(...selection.map((l) => l.y + l.height))),
    ),
  )
  return layers.map((l) =>
    selection.includes(l) ? { ...l, x: l.x + dx, y: l.y + dy } : l,
  )
}
export function duplicatePage(draft: StudioDraft, page: string) {
  if (draft.pages.length >= 15)
    throw new Error('A design supports up to 15 pages.')
  const source = (draft.layers || []).filter((l) => l.page === page)
  if ((draft.layers?.length || 0) + source.length > 12)
    throw new Error('This copy exceeds the current 12-layer design limit.')
  let name = `${page.slice(0, 65)} copy`,
    suffix = 2
  while (draft.pages.includes(name))
    name = `${page.slice(0, 65)} copy ${suffix++}`
  return {
    name,
    draft: {
      ...draft,
      pages: [...draft.pages, name],
      layers: [
        ...(draft.layers || []),
        ...source.map((l) => ({
          ...l,
          id: crypto.randomUUID(),
          page: name,
          targetPage: l.targetPage === page ? name : l.targetPage,
        })),
      ],
    },
  }
}
