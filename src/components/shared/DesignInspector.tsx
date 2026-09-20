import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
} from 'lucide-react'
import {
  defaultVisual,
  fontFamilies,
  type DesignLayer,
  type VisualStyle,
} from '../../domain/composition'
import type { StudioDraft } from '../../domain/studio'
import { Field } from '../ui/Field'
import { Input, Select, Textarea } from '../ui/Input'

const palettes = [
  ['#766dff', '#00b6c9'],
  ['#14532d', '#ec704a'],
  ['#172554', '#06b6d4'],
  ['#7f1d1d', '#eab308'],
  ['#0f766e', '#fb7185'],
  ['#18181b', '#a3e635'],
  ['#312e81', '#f472b6'],
  ['#155e75', '#f97316'],
]
export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="design-color-field">
      <span>{label}</span>
      <input
        aria-label={label}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <code>{value.toUpperCase()}</code>
    </label>
  )
}
export function RangeField({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
}: {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (n: number) => void
}) {
  return (
    <label className="design-range">
      <span>
        {label}
        <output>{value}</output>
      </span>
      <input
        type="range"
        aria-label={label}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}
export function VisualInspector({
  draft,
  update,
}: {
  draft: StudioDraft
  update: (change: Partial<StudioDraft>) => void
}) {
  const visual = draft.visual || defaultVisual
  const change = (part: Partial<VisualStyle>) =>
    update({ visual: { ...visual, ...part } })
  return (
    <div className="design-property-stack">
      <p className="studio-panel-heading">Color collections</p>
      <div className="design-palettes">
        {palettes.map(([primaryColor, accentColor]) => (
          <button
            key={primaryColor}
            title={`Palette ${primaryColor}, ${accentColor}`}
            aria-label={`Apply palette ${primaryColor}`}
            onClick={() => update({ primaryColor, accentColor })}
          >
            <i style={{ background: primaryColor }} />
            <i style={{ background: accentColor }} />
          </button>
        ))}
      </div>
      <ColorField
        label="Canvas background"
        value={visual.background}
        onChange={(background) => change({ background })}
      />
      <ColorField
        label="Surface color"
        value={visual.surface}
        onChange={(surface) => change({ surface })}
      />
      <ColorField
        label="Text color"
        value={visual.ink}
        onChange={(ink) => change({ ink })}
      />
      <RangeField
        label="Corner radius"
        value={visual.radius}
        max={32}
        onChange={(radius) => change({ radius })}
      />
      <RangeField
        label="Content spacing"
        value={visual.spacing}
        min={8}
        max={40}
        onChange={(spacing) => change({ spacing })}
      />
      <RangeField
        label="Body size"
        value={visual.fontSize}
        min={12}
        max={24}
        onChange={(fontSize) => change({ fontSize })}
      />
      <RangeField
        label="Image brightness"
        value={visual.brightness}
        min={25}
        max={200}
        onChange={(brightness) => change({ brightness })}
      />
      <RangeField
        label="Image saturation"
        value={visual.saturation}
        max={200}
        onChange={(saturation) => change({ saturation })}
      />
      <RangeField
        label="Image opacity"
        value={visual.imageOpacity}
        max={1}
        step={0.05}
        onChange={(imageOpacity) => change({ imageOpacity })}
      />
    </div>
  )
}
export function LayerInspector({
  layer,
  draft,
  onChange,
}: {
  layer: DesignLayer
  draft: StudioDraft
  onChange: (layer: DesignLayer) => void
}) {
  const update = (part: Partial<DesignLayer>) => onChange({ ...layer, ...part })
  return (
    <div className="design-property-stack">
      <p className="studio-panel-heading">{layer.kind} properties</p>
      <Field label="Layer text">
        <Textarea
          value={layer.text}
          maxLength={500}
          onChange={(e) => update({ text: e.target.value })}
        />
      </Field>
      <div className="design-number-grid">
        {(['x', 'y', 'width', 'height'] as const).map((key) => (
          <Field key={key} label={key.toUpperCase()}>
            <Input
              type="number"
              value={layer[key]}
              min={key === 'width' || key === 'height' ? 20 : 0}
              max={
                key === 'x'
                  ? 1200 - layer.width
                  : key === 'y'
                    ? 900 - layer.height
                    : key === 'width'
                      ? 1200 - layer.x
                      : 900 - layer.y
              }
              onChange={(e) => {
                const value = Number(e.target.value)
                const max = Number(e.target.max)
                update({
                  [key]: Math.max(
                    Number(e.target.min),
                    Math.min(max, Math.round(value)),
                  ),
                })
              }}
            />
          </Field>
        ))}
      </div>
      <ColorField
        label="Layer fill"
        value={layer.fill}
        onChange={(fill) => update({ fill })}
      />
      <ColorField
        label="Layer text color"
        value={layer.color}
        onChange={(color) => update({ color })}
      />
      <ColorField
        label="Shape border"
        value={layer.stroke}
        onChange={(stroke) => update({ stroke })}
      />
      <Field label="Layer font">
        <Select
          value={layer.font}
          onChange={(e) =>
            update({ font: e.target.value as DesignLayer['font'] })
          }
        >
          {Object.keys(fontFamilies).map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </Select>
      </Field>
      <RangeField
        label="Text size"
        value={layer.fontSize}
        min={8}
        max={96}
        onChange={(fontSize) => update({ fontSize })}
      />
      <Field label="Text weight">
        <Select
          value={layer.weight}
          onChange={(e) =>
            update({ weight: e.target.value as DesignLayer['weight'] })
          }
        >
          <option value="400">Regular</option>
          <option value="600">Semibold</option>
          <option value="700">Bold</option>
        </Select>
      </Field>
      <div className="device-controls">
        {(
          [
            ['left', AlignLeft],
            ['center', AlignCenter],
            ['right', AlignRight],
          ] as const
        ).map(([align, Icon]) => (
          <button
            key={align}
            className="icon-button"
            title={`Align ${align}`}
            aria-label={`Align text ${align}`}
            aria-pressed={layer.align === align}
            onClick={() => update({ align })}
          >
            <Icon />
          </button>
        ))}
      </div>
      <RangeField
        label="Layer opacity"
        value={layer.opacity}
        max={1}
        step={0.05}
        onChange={(opacity) => update({ opacity })}
      />
      <RangeField
        label="Layer radius"
        value={layer.radius}
        max={100}
        onChange={(radius) => update({ radius })}
      />
      <RangeField
        label="Rotation"
        value={layer.rotation}
        min={-180}
        max={180}
        onChange={(rotation) => update({ rotation })}
      />
      {layer.kind === 'image' && (
        <>
          <Field label="Image source">
            <Select
              value={layer.imageIndex}
              onChange={(e) => update({ imageIndex: Number(e.target.value) })}
            >
              <option value={-1}>Website banner / suite image</option>
              <option value={-2}>Business logo</option>
              {draft.mediaPaths.map((path, i) => (
                <option value={i} key={path}>
                  {path.split('/').at(-1)}
                </option>
              ))}
            </Select>
          </Field>
          <RangeField
            label="Layer brightness"
            value={layer.brightness}
            min={25}
            max={200}
            onChange={(brightness) => update({ brightness })}
          />
          <RangeField
            label="Layer saturation"
            value={layer.saturation}
            max={200}
            onChange={(saturation) => update({ saturation })}
          />
        </>
      )}
      {layer.kind === 'button' && (
        <Field label="Button destination">
          <Select
            value={layer.targetPage}
            onChange={(e) => update({ targetPage: e.target.value })}
          >
            <option value="">No destination</option>
            {draft.pages.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
        </Field>
      )}
    </div>
  )
}
export function LayerList({
  layers,
  selected,
  selectedIds = [selected],
  onSelect,
  onChange,
}: {
  layers: DesignLayer[]
  selected: string
  selectedIds?: string[]
  onSelect: (id: string, additive?: boolean) => void
  onChange: (layers: DesignLayer[]) => void
}) {
  const patch = (id: string, part: Partial<DesignLayer>) =>
    onChange(layers.map((l) => (l.id === id ? { ...l, ...part } : l)))
  return (
    <div className="design-layers">
      {layers.map((layer, i) => (
        <div key={layer.id} data-selected={selectedIds.includes(layer.id)}>
          <button
            className="design-layer-select"
            onClick={(e) => onSelect(layer.id, e.shiftKey)}
            title={`${layer.page}: ${layer.text}`}
          >
            {layer.kind}{' '}
            <small>
              {layer.page} / {layer.text.slice(0, 24) || 'Untitled'}
            </small>
          </button>
          <div className="page-actions">
            {[
              {
                label: layer.hidden ? 'Show layer' : 'Hide layer',
                Icon: layer.hidden ? EyeOff : Eye,
                action: () => patch(layer.id, { hidden: !layer.hidden }),
              },
              {
                label: layer.locked ? 'Unlock layer' : 'Lock layer',
                Icon: layer.locked ? Lock : Unlock,
                action: () => patch(layer.id, { locked: !layer.locked }),
              },
              {
                label: 'Duplicate layer',
                Icon: Copy,
                action: () => {
                  if (layers.length < 12)
                    onChange([...layers, { ...layer, id: crypto.randomUUID() }])
                },
                disabled: layers.length >= 12,
              },
              {
                label: 'Move layer back',
                Icon: ArrowUp,
                action: () => {
                  const next = [...layers]
                  ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
                  onChange(next)
                },
                disabled: i === 0,
              },
              {
                label: 'Move layer forward',
                Icon: ArrowDown,
                action: () => {
                  const next = [...layers]
                  ;[next[i + 1], next[i]] = [next[i], next[i + 1]]
                  onChange(next)
                },
                disabled: i === layers.length - 1,
              },
              {
                label: 'Delete layer',
                Icon: Trash2,
                action: () => onChange(layers.filter((l) => l.id !== layer.id)),
              },
            ].map(({ label, Icon, action, disabled }) => (
              <button
                className="icon-button"
                key={label}
                title={label}
                aria-label={label}
                disabled={disabled}
                onClick={action}
              >
                <Icon />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
