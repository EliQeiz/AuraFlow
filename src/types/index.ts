export type PriceTier = 'free' | 'starter' | 'pro' | 'enterprise'
export type PlatformMode = 'managed-hosted' | 'custom-build' | 'prototype-only'

export interface IndustrySolution {
  id: string
  slug: string
  title: string
  category: string
  summary: string
  image: string
  audience: string
  startingPrice: string
  platformLabel: string
  modules: string[]
  adminTools: string[]
  workflows: string[]
  roles: string[]
  recommendedTier: 'Starter' | 'Growth' | 'Enterprise'
}

export interface PrototypeSpec {
  solutionSlug?: string
  businessName: string
  platformMode: PlatformMode
  subdomainPreference?: string
  selectedModules: string[]
  brandTone: string
  colorPreference: string
  adminRoles: string[]
  coreWorkflows: string
  contentNotes: string
}

export interface Template {
  id: string
  slug: string
  name: string
  category: string
  subcategory: string
  style: string
  colorScheme: string
  description: string
  longDescription: string
  previewImage: string
  screenshots: string[]
  pages: string[]
  features: string[]
  techStack: string[]
  price: number
  tier: PriceTier
  popular: boolean
  tags: string[]
}

export interface Service {
  id: string
  icon: string
  title: string
  shortTitle: string
  description: string
  features: string[]
  techStack: string[]
  timeline: string
  priceRange: string
  image: string
}

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  coverImage: string
  author: {
    name: string
    role: string
    avatar: string
  }
  publishedAt: string
  readTime: string
}

export interface PortfolioProject {
  id: string
  title: string
  category: 'Websites' | 'Mobile Apps' | 'Dashboards' | 'Templates'
  summary: string
  image: string
  screenshots: string[]
  techStack: string[]
  liveUrl?: string
  testimonial?: string
}

export interface UserProfile {
  uid: string
  name: string
  email: string
  phone?: string
  avatarUrl?: string
  plan: string
  savedTemplates: string[]
  projectCount: number
  notifications?: boolean
  theme?: ThemePreference
}

export type ThemePreference = 'dark' | 'light' | 'system'
export type RequestStatus = 'Submitted' | 'Discovery' | 'Designing' | 'Building' | 'Review' | 'Completed' | 'On Hold'
export type RequestAssetKind = 'reference' | 'content' | 'preview'

export interface RequestAsset {
  id: string
  name: string
  url: string
  path?: string
  contentType?: string
  kind: RequestAssetKind
  uploadedBy: string
  createdAt?: unknown
}

export interface RequestMessage {
  id: string
  authorId: string
  authorName: string
  role: 'client' | 'admin'
  text: string
  createdAt?: unknown
}

export interface ProjectRequestRecord {
  id: string
  userId: string
  clientName: string
  clientEmail: string
  title: string
  projectType: string
  description: string
  audience: string
  budget: number
  timeline: string
  referenceLinks: string[]
  templateSlug?: string
  solutionSlug?: string
  platformMode?: PlatformMode
  subdomainPreference?: string
  prototypeSpec?: PrototypeSpec
  status: RequestStatus
  adminSummary?: string
  assets: RequestAsset[]
  previews: RequestAsset[]
  lastClientNote?: string
  deadline?: string
  createdAt?: unknown
  updatedAt?: unknown
}

export type ProjectRecord = ProjectRequestRecord

export interface ContactPayload {
  name: string
  email: string
  phone?: string
  service: string
  budget: string
  message: string
}

export interface QuotePayload {
  projectType: string
  details: string
  audience: string
  features: string[]
  budget: number
  urgency: string
  name: string
  email: string
  phone: string
  contactMethod: string
  templateSlug?: string
}
