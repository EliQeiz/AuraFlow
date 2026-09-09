import { z } from 'zod'

export const fontFamilies = {
  modern: 'Arial, sans-serif',
  classic: 'Georgia, serif',
  geometric: 'Trebuchet MS, sans-serif',
  humanist: 'Verdana, sans-serif',
  mono: 'Courier New, monospace',
  display: 'Impact, sans-serif',
}
export const hexColor = z.string().regex(/^#[a-fA-F0-9]{6}$/)
export const layerSchema = z
  .object({
    id: z.string().regex(/^[a-zA-Z0-9-]{1,80}$/),
    page: z.string().min(1).max(80),
    kind: z.enum([
      'text',
      'rectangle',
      'ellipse',
      'button',
      'image',
      'metric',
      'chart',
      'silo',
    ]),
    text: z.string().max(500),
    x: z.number().int().min(0).max(1180),
    y: z.number().int().min(0).max(880),
    width: z.number().int().min(20).max(1200),
    height: z.number().int().min(20).max(900),
    fill: hexColor,
    color: hexColor,
    stroke: hexColor,
    opacity: z.number().min(0).max(1),
    radius: z.number().int().min(0).max(100),
    fontSize: z.number().int().min(8).max(96),
    font: z.enum([
      'modern',
      'classic',
      'geometric',
      'humanist',
      'mono',
      'display',
    ]),
    weight: z.enum(['400', '600', '700']),
    align: z.enum(['left', 'center', 'right']),
    brightness: z.number().int().min(25).max(200),
    saturation: z.number().int().min(0).max(200),
    rotation: z.number().int().min(-180).max(180),
    locked: z.boolean(),
    hidden: z.boolean(),
    imageIndex: z.number().int().min(-2).max(19),
    targetPage: z.string().max(80),
  })
  .strict()
  .refine(
    (layer) => layer.x + layer.width <= 1200 && layer.y + layer.height <= 900,
    'Keep the layer inside the artboard.',
  )
export type DesignLayer = z.infer<typeof layerSchema>
export const visualSchema = z
  .object({
    background: hexColor,
    surface: hexColor,
    ink: hexColor,
    radius: z.number().int().min(0).max(32),
    spacing: z.number().int().min(8).max(40),
    fontSize: z.number().int().min(12).max(24),
    brightness: z.number().int().min(25).max(200),
    saturation: z.number().int().min(0).max(200),
    imageOpacity: z.number().min(0).max(1),
  })
  .strict()
export type VisualStyle = z.infer<typeof visualSchema>
export const defaultVisual: VisualStyle = {
  background: '#f3f5f7',
  surface: '#ffffff',
  ink: '#18202b',
  radius: 8,
  spacing: 20,
  fontSize: 16,
  brightness: 100,
  saturation: 100,
  imageOpacity: 1,
}
export function newLayer(
  kind: DesignLayer['kind'],
  page: string,
  fill = '#766dff',
): DesignLayer {
  return {
    id: crypto.randomUUID(),
    page,
    kind,
    text:
      kind === 'text'
        ? 'Your next chapter starts here.'
        : kind === 'metric'
          ? 'Active projects | 24'
          : kind === 'silo'
            ? 'Silo 01 | 68%'
            : kind === 'chart'
              ? 'Production trend'
              : kind === 'button'
                ? 'Explore more'
                : '',
    x: 64,
    y: 100,
    width: kind === 'text' ? 560 : 260,
    height: kind === 'text' ? 150 : kind === 'button' ? 56 : 200,
    fill,
    color: '#ffffff',
    stroke: fill,
    opacity: 1,
    radius: 8,
    fontSize: kind === 'text' ? 48 : 20,
    font: 'modern',
    weight: '600',
    align: 'left',
    brightness: 100,
    saturation: 100,
    rotation: 0,
    locked: false,
    hidden: false,
    imageIndex: -1,
    targetPage: '',
  }
}
export function starterLayers(
  page: string,
  kind: 'landing' | 'dashboard' | 'industrial',
  primary = '#766dff',
): DesignLayer[] {
  const layer = (type: DesignLayer['kind'], change: Partial<DesignLayer>) => ({
    ...newLayer(type, page, primary),
    ...change,
  })
  if (kind === 'landing')
    return [
      layer('image', { x: 0, y: 0, width: 1200, height: 560, locked: true }),
      layer('rectangle', {
        x: 0,
        y: 0,
        width: 1200,
        height: 560,
        fill: '#101820',
        opacity: 0.35,
        locked: true,
        radius: 0,
      }),
      layer('text', { x: 64, y: 100, width: 720, height: 220 }),
      layer('button', { x: 64, y: 370, targetPage: 'Contact' }),
      layer('text', {
        x: 64,
        y: 620,
        height: 80,
        text: 'Made around your business.',
        color: '#18202b',
        fontSize: 36,
      }),
      layer('text', {
        x: 64,
        y: 720,
        width: 960,
        height: 100,
        text: 'Tell your story. Share the services, places and experiences that make you different.',
        color: '#475569',
        fontSize: 24,
        weight: '400',
      }),
    ]
  return [
    layer('text', {
      text: kind === 'industrial' ? 'Plant operations' : 'Operations workspace',
      color: '#18202b',
      x: 40,
      y: 30,
      height: 65,
      fontSize: 36,
    }),
    ...[0, 1, 2].map((i) =>
      layer(kind === 'industrial' ? 'silo' : 'metric', {
        fill: '#ffffff',
        color: ['#0f766e', '#2563eb', '#b45309'][i],
        x: 40 + i * 375,
        y: 140,
        width: 345,
        height: 235,
        text:
          kind === 'industrial'
            ? `Silo 0${i + 1} | ${68 - i * 12}%`
            : `${['Open requests', 'In progress', 'Completed'][i]} | ${[24, 12, 42][i]}`,
      }),
    ),
    layer('chart', {
      fill: '#ffffff',
      color: kind === 'industrial' ? '#0f766e' : primary,
      x: 40,
      y: 420,
      width: 1120,
      height: 340,
      text:
        kind === 'industrial'
          ? 'Sensor trend / simulated readings'
          : 'Activity this month',
    }),
  ]
}
export function clampLayer(layer: DesignLayer): DesignLayer {
  return {
    ...layer,
    x: Math.round(Math.max(0, Math.min(1200 - layer.width, layer.x))),
    y: Math.round(Math.max(0, Math.min(900 - layer.height, layer.y))),
  }
}
