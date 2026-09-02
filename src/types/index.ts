export type PriceTier = 'free' | 'starter' | 'pro' | 'enterprise'
export type PlatformMode = 'managed-hosted' | 'custom-build' | 'prototype-only'

export type SuiteTier = 'starter' | 'business' | 'operations' | 'enterprise'

export interface SuiteModule {
  id: string
  title: string
  category: string
  summary: string
  records: string[]
  actions: string[]
  includedIn: SuiteTier[]
}

export interface SuiteRole {
  id: string
  title: string
  portal: string
  summary: string
  permissions: string[]
}

export interface SuiteWorkflow {
  id: string
  title: string
  trigger: string
  steps: string[]
  output: string
}

export interface SuiteScreen {
  title: string
  route: string
  audience: string
  description: string
}

export interface SuiteMetric {
  label: string
  value: string
  trend: string
}

export interface SuiteBuilderFeature {
  id: string
  title: string
  summary: string
  output: string
}

export interface SuiteBlueprint {
  id: string
  slug: string
  title: string
  category: string
  summary: string
  longDescription: string
  image: string
  audience: string
  startingPrice: string
  platformLabel: string
  modules: SuiteModule[]
  roles: SuiteRole[]
  workflows: SuiteWorkflow[]
  adminControls: string[]
  dataEntities: string[]
  integrations: string[]
  securityControls: string[]
  prototypeScreens: SuiteScreen[]
  metrics: SuiteMetric[]
  themes: Array<{ name: string; swatches: string[] }>
  builderFeatures: SuiteBuilderFeature[]
  sourceNote?: string
}

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
  suiteSlug?: string
  businessName: string
  platformMode: PlatformMode
  subdomainPreference?: string
  selectedModules: string[]
  selectedWorkflows?: string[]
  selectedRoles?: string[]
  brandTone: string
  colorPreference: string
  adminRoles: string[]
  coreWorkflows: string
  contentNotes: string
  dataSources?: string
  complianceNotes?: string
  launchModel?: string
  selectedBuilderFeatures?: string[]
  themePreset?: string
  primaryColor?: string
  accentColor?: string
  logoDirection?: string
  bannerDirection?: string
  mediaPlan?: string
  automationNeeds?: string[]
  paymentPlan?: string
  tenantAdminNotes?: string
  contentOwnershipConfirmed?: boolean
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
  tenantSlug?: string
  stagingUrl?: string
  productionUrl?: string
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
