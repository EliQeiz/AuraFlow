import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react'
import { usePrivateMedia } from '../../hooks/usePrivateMedia'
import {
  clampLayer,
  defaultVisual,
  fontFamilies,
  type DesignLayer,
} from '../../domain/composition'
import type { StudioDraft } from '../../domain/studio'
import { getSuiteBlueprint } from '../../data/suiteBlueprints'
import { IMAGES } from '../../lib/images'

export function DesignArtboard({
  draft,
  page,
  selected,
  onSelect,
  onChange,
  zoom = 1,
  grid = true,
  preview = false,
}: {
  draft: StudioDraft
  page: string
  selected: string
  onSelect: (id: string) => void
  onChange: (layers: DesignLayer[]) => void
  zoom?: number
  grid?: boolean
  preview?: boolean
}) {
  const host = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(0.5)
  const [moving, setMoving] = useState<DesignLayer | null>(null)
  const drag = useRef<{
    layer: DesignLayer
    x: number
    y: number
    resize: boolean
  } | null>(null)
  useEffect(() => {
    const observer = new ResizeObserver((entries) =>
      setFit(Math.min(1, entries[0].contentRect.width / 1200)),
    )
    if (host.current) observer.observe(host.current)
    return () => observer.disconnect()
  }, [])
  const scale = fit * zoom
  const layers = draft.layers || []
  function start(event: PointerEvent<HTMLDivElement>, layer: DesignLayer) {
    if (preview) {
      if (layer.kind === 'button' && draft.pages.includes(layer.targetPage))
        onSelect(`page:${layer.targetPage}`)
      return
    }
    onSelect(layer.id)
    if (layer.locked) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {
      layer,
      x: event.clientX,
      y: event.clientY,
      resize: (event.target as HTMLElement).dataset.resize === 'true',
    }
  }
  function position(event: PointerEvent<HTMLDivElement>) {
    const active = drag.current
    if (!active) return null
    const snap = (v: number) => Math.round(v / (grid ? 8 : 1)) * (grid ? 8 : 1)
    const dx = (event.clientX - active.x) / scale,
      dy = (event.clientY - active.y) / scale
    return clampLayer(
      active.resize
        ? {
            ...active.layer,
            width: Math.max(
              20,
              Math.min(1200 - active.layer.x, snap(active.layer.width + dx)),
            ),
            height: Math.max(
              20,
              Math.min(900 - active.layer.y, snap(active.layer.height + dy)),
            ),
          }
        : {
            ...active.layer,
            x: snap(active.layer.x + dx),
            y: snap(active.layer.y + dy),
          },
    )
  }
  return (
    <div className="design-artboard-scroll" ref={host}>
      <div
        style={{
          width: 1200 * scale,
          height: 900 * scale,
          position: 'relative',
        }}
      >
        <div
          id="design-artboard"
          className="design-artboard"
          data-grid={grid && !preview}
          style={{
            width: 1200,
            height: 900,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            backgroundColor:
              draft.visual?.background || defaultVisual.background,
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) onSelect('')
          }}
        >
          {layers
            .filter((layer) => layer.page === page && !layer.hidden)
            .map((original) => {
              const layer = moving?.id === original.id ? moving : original
              const style: CSSProperties = {
                position: 'absolute',
                left: layer.x,
                top: layer.y,
                width: layer.width,
                height: layer.height,
                transform: `rotate(${layer.rotation}deg)`,
                opacity: layer.opacity,
                color: layer.color,
                background:
                  layer.kind === 'text' || layer.kind === 'image'
                    ? 'transparent'
                    : layer.fill,
                borderRadius: layer.kind === 'ellipse' ? '50%' : layer.radius,
                fontFamily: fontFamilies[layer.font],
                fontSize: layer.fontSize,
                fontWeight: Number(layer.weight),
                textAlign: layer.align,
                border: ['rectangle', 'ellipse'].includes(layer.kind)
                  ? `2px solid ${layer.stroke}`
                  : undefined,
              }
              return (
                <div
                  key={layer.id}
                  className="design-layer"
                  style={style}
                  data-selected={!preview && selected === layer.id}
                  data-locked={layer.locked}
                  role={
                    !preview || layer.kind === 'button' ? 'button' : undefined
                  }
                  tabIndex={!preview || layer.kind === 'button' ? 0 : undefined}
                  aria-label={
                    preview
                      ? layer.kind === 'button'
                        ? layer.text
                        : undefined
                      : `Select ${layer.kind}: ${layer.text || layer.id.slice(0, 4)}`
                  }
                  onPointerDown={(e) => start(e, layer)}
                  onPointerMove={(e) => {
                    const next = position(e)
                    if (next) setMoving(next)
                  }}
                  onPointerUp={(e) => {
                    const next = position(e)
                    drag.current = null
                    setMoving(null)
                    if (next)
                      onChange(
                        layers.map((item) =>
                          item.id === next.id ? next : item,
                        ),
                      )
                  }}
                  onPointerCancel={() => {
                    drag.current = null
                    setMoving(null)
                  }}
                  onKeyDown={(event) => {
                    if (preview) {
                      if (
                        layer.kind === 'button' &&
                        ['Enter', ' '].includes(event.key) &&
                        draft.pages.includes(layer.targetPage)
                      ) {
                        event.preventDefault()
                        onSelect(`page:${layer.targetPage}`)
                      }
                      return
                    }
                    if (event.key === 'Enter') onSelect(layer.id)
                    const delta = event.shiftKey ? 10 : 1
                    const directions: Record<string, [number, number]> = {
                      ArrowLeft: [-delta, 0],
                      ArrowRight: [delta, 0],
                      ArrowUp: [0, -delta],
                      ArrowDown: [0, delta],
                    }
                    if (!layer.locked && directions[event.key]) {
                      event.preventDefault()
                      const [dx, dy] = directions[event.key]
                      onChange(
                        layers.map((item) =>
                          item.id === layer.id
                            ? clampLayer({
                                ...item,
                                x: item.x + dx,
                                y: item.y + dy,
                              })
                            : item,
                        ),
                      )
                    }
                  }}
                >
                  <LayerContent layer={layer} draft={draft} />
                  {!preview && selected === layer.id && !layer.locked && (
                    <span
                      className="design-resize"
                      data-resize="true"
                      data-export-ignore="true"
                    />
                  )}
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
function LayerContent({
  layer,
  draft,
}: {
  layer: DesignLayer
  draft: StudioDraft
}) {
  const path =
    layer.imageIndex === -2
      ? draft.logoPath
      : layer.imageIndex === -1
        ? draft.bannerPath
        : draft.mediaPaths[layer.imageIndex]
  const privateUrl = usePrivateMedia(layer.kind === 'image' ? path : undefined)
  if (layer.kind === 'image')
    return (
      <img
        draggable={false}
        src={
          privateUrl ||
          getSuiteBlueprint(draft.suiteSlug)?.image ||
          IMAGES.services.webApps
        }
        alt="Design media"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: layer.radius,
          filter: `brightness(${layer.brightness}%) saturate(${layer.saturation}%)`,
        }}
      />
    )
  if (layer.kind === 'chart')
    return (
      <div className="design-chart">
        <span>{layer.text}</span>
        <div>
          {[24, 42, 38, 64, 56, 70, 62, 86, 74, 92, 82, 96].map((height, i) => (
            <i
              key={i}
              style={{ height: `${height}%`, background: layer.color }}
            />
          ))}
        </div>
        <small>Simulated data</small>
      </div>
    )
  if (layer.kind === 'silo')
    return (
      <div className="design-silo">
        <span>{layer.text.split('|')[0]}</span>
        <div>
          <i
            style={{
              height: `${Math.min(100, Math.max(0, parseFloat(layer.text.split('|')[1]) || 0))}%`,
              background: layer.color,
            }}
          />
        </div>
        <strong>{layer.text.split('|')[1]}</strong>
        <small>Simulated level</small>
      </div>
    )
  if (layer.kind === 'metric')
    return (
      <div className="design-metric">
        <span>{layer.text.split('|')[0]}</span>
        <strong>{layer.text.split('|')[1] || '24'}</strong>
        <small>Sample value</small>
      </div>
    )
  return (
    <div
      className={
        layer.kind === 'button'
          ? 'design-button-content'
          : 'design-text-content'
      }
    >
      {layer.text}
    </div>
  )
}
