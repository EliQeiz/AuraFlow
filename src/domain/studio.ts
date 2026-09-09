import { z } from 'zod'

export const draftSchema = z.object({
  schemaVersion: z.literal(1),
  suiteSlug: z.string().min(1).max(180),
  name: z.string().trim().min(2).max(120),
  headline: z.string().max(160),
  description: z.string().max(6000),
  primaryColor: z.string().regex(/^#[a-fA-F0-9]{6}$/),
  accentColor: z.string().regex(/^#[a-fA-F0-9]{6}$/),
  theme: z.enum(['light', 'dark']),
  font: z.enum(['modern', 'classic']),
  modules: z.array(z.string().max(180)).min(1).max(30),
  roles: z.array(z.string().max(120)).max(20),
  workflows: z.array(z.string().max(180)).max(20),
  pages: z.array(z.string().max(80)).min(1).max(15),
  notes: z.string().max(6000),
  logoPath: z.string().max(600).default(''),
  bannerPath: z.string().max(600).default(''),
  mediaPaths: z.array(z.string().max(600)).max(20).default([]),
})
export type StudioDraft = z.infer<typeof draftSchema>
export type SavedDraft = StudioDraft & {
  id: string
  userId: string
  revision: number
  updatedAt?: unknown
}
export const defaultDraft = (
  slug: string,
  name: string,
  modules: string[],
  roles: string[],
): StudioDraft => ({
  schemaVersion: 1,
  suiteSlug: slug,
  name,
  headline: 'Welcome to our business',
  description: '',
  primaryColor: '#766dff',
  accentColor: '#00b6c9',
  theme: 'light',
  font: 'modern',
  modules,
  roles,
  workflows: [],
  pages: ['Home', 'About', 'Services', 'Contact'],
  notes: '',
  logoPath: '',
  bannerPath: '',
  mediaPaths: [],
})
