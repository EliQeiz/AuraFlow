export type PriceTier = 'free' | 'starter' | 'pro' | 'enterprise'

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
  rating: number
  reviewCount: number
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

export interface Testimonial {
  id: string
  avatar: string
  name: string
  role: string
  company: string
  rating: number
  quote: string
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
  liveUrl: string
  testimonial: string
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
}

export interface ProjectRecord {
  id: string
  userId: string
  title: string
  status: 'In Progress' | 'Review' | 'Completed' | 'On Hold'
  deadline?: string
  updatedAt?: string
}

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
