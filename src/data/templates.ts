import { IMAGES } from '../lib/images'
import type { PriceTier, Template } from '../types'

type TemplateSeed = [category: string, subcategory: string, style: string, price: number]

export const marketplaceCategories = [
  'Restaurant',
  'Clinic/Hospital',
  'E-commerce',
  'Hotel/Hospitality',
  'Gym/Fitness',
  'School/Education',
  'Law Firm',
  'Real Estate',
  'Salon/Beauty',
  'Logistics',
  'Portfolio',
  'Tech Startup',
  'NGO/Nonprofit',
  'Church/Religious',
  'Event/Wedding',
  'Pharmacy',
  'Bakery',
  'Automotive',
  'Travel Agency',
  'Photography',
  'Architecture',
  'Dentist',
  'Veterinary',
  'Barbershop',
  'Spa & Wellness',
  'Childcare/Daycare',
  'Accounting/Finance',
  'Insurance',
  'Recruitment/HR',
  'Marketing Agency',
  'Cleaning Service',
  'Catering',
  'Brewery/Bar',
  'Food Truck',
  'Music Studio',
  'Art Gallery',
  'Pet Shop',
  'Book Store',
  'Supermarket/Mall',
  'Fashion Brand',
  'Sports Club',
  'Gaming',
  'Interior Design',
  'Construction',
  'Funeral Home',
  'Car Rental',
  'Printing',
  'Security Firm',
  'Consulting',
]

const seeds: TemplateSeed[] = [
  ['Restaurant', 'Fine Dining', 'Luxury Dark', 49],
  ['Restaurant', 'Fast Food', 'Bold Colorful', 29],
  ['Restaurant', 'Cafe', 'Warm Minimal', 29],
  ['Restaurant', 'Food Delivery', 'Modern', 49],
  ['Clinic', 'General Practice', 'Clean Minimal', 59],
  ['Clinic', 'Dental', 'Minimal', 59],
  ['Clinic', 'Pediatric', 'Playful', 49],
  ['Hospital', 'Full Hospital', 'Corporate', 99],
  ['E-commerce', 'Fashion', 'Classic Editorial', 79],
  ['E-commerce', 'Electronics', 'Dark Modern', 79],
  ['E-commerce', 'Grocery', 'Modern Colorful', 69],
  ['E-commerce', 'Jewelry', 'Luxury', 79],
  ['Hotel', 'Boutique Hotel', 'Luxury', 89],
  ['Hotel', 'Resort', 'Bold Colorful', 89],
  ['Hotel', 'Hostel', 'Playful Modern', 49],
  ['Gym', 'CrossFit', 'Bold Dark', 49],
  ['Gym', 'Yoga Studio', 'Serene Minimal', 49],
  ['Gym', 'MMA Boxing', 'Bold Dark', 49],
  ['School', 'K-12 School', 'Playful', 69],
  ['School', 'University', 'Classic Academic', 89],
  ['School', 'Online Course', 'Modern', 69],
  ['School', 'Daycare', 'Playful', 49],
  ['Law Firm', 'General Law', 'Corporate Dark', 79],
  ['Law Firm', 'Criminal Defense', 'Bold Dark', 79],
  ['Real Estate', 'Luxury Properties', 'Luxury Dark', 89],
  ['Real Estate', 'Rental Agency', 'Clean Modern', 69],
  ['Salon', 'Beauty Salon', 'Luxury Dark', 49],
  ['Salon', 'Barbershop', 'Classic Dark', 49],
  ['Salon', 'Nail Studio', 'Playful Colorful', 49],
  ['Spa', 'Wellness Spa', 'Minimal', 59],
  ['Pharmacy', 'Retail Pharmacy', 'Corporate', 59],
  ['Bakery', 'Artisan Bakery', 'Classic', 39],
  ['Logistics', 'Freight Company', 'Corporate Industrial', 69],
  ['Portfolio', 'Creative Portfolio', 'Minimal Dark', 39],
  ['Portfolio', 'Photography', 'Bold Minimal', 39],
  ['Tech Startup', 'SaaS Product', 'Modern', 79],
  ['Tech Startup', 'App Landing', 'Bold Colorful', 69],
  ['NGO', 'Charity', 'Playful Colorful', 49],
  ['Church', 'Religious', 'Classic', 49],
  ['Event', 'Wedding', 'Luxury', 59],
  ['Event', 'Corporate Event', 'Modern Dark', 59],
  ['Automotive', 'Car Dealership', 'Bold Dark', 79],
  ['Travel', 'Travel Agency', 'Bold Colorful', 69],
  ['Photography', 'Studio Portfolio', 'Classic Dark', 49],
  ['Architecture', 'Architecture Firm', 'Minimal', 79],
  ['Dentist', 'Dental Clinic', 'Clean Minimal', 59],
  ['Pet', 'Pet Shop and Vet', 'Playful', 49],
  ['Music', 'Music Studio', 'Bold Dark', 49],
  ['Art', 'Art Gallery', 'Classic Editorial', 49],
  ['Supermarket', 'Supermarket Mart', 'Bold Retail', 69],
  ['Construction', 'Contractor', 'Corporate Industrial', 69],
  ['Finance', 'Accounting Firm', 'Corporate', 79],
  ['Marketing', 'Agency', 'Creative Dark', 79],
  ['Interior Design', 'Interior Studio', 'Luxury Minimal', 69],
  ['Gaming', 'Esports Team', 'Bold Dark', 59],
]

const genericFeatures = [
  'Responsive component library',
  'Lead capture forms',
  'SEO metadata and social cards',
  'Performance-minded images',
  'Firebase-ready data hooks',
  'Editable service sections',
]

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

function tierFor(price: number): PriceTier {
  if (price === 0) return 'free'
  if (price <= 49) return 'starter'
  if (price < 99) return 'pro'
  return 'enterprise'
}

function colorSchemeFor(style: string) {
  const lower = style.toLowerCase()
  if (lower.includes('color')) return 'Colorful'
  if (lower.includes('dark')) return 'Dark'
  if (lower.includes('minimal') || lower.includes('clean')) return 'Monochrome'
  return 'Light'
}

function imageFor(category: string, subcategory: string) {
  const key = `${category} ${subcategory}`.toLowerCase()
  if (key.includes('cafe')) return IMAGES.templates.cafe
  if (key.includes('restaurant')) return IMAGES.templates.restaurant
  if (key.includes('clinic') || key.includes('hospital') || key.includes('dent')) return IMAGES.templates.clinic
  if (key.includes('commerce') || key.includes('fashion') || key.includes('jewelry')) return IMAGES.templates.ecommerce
  if (key.includes('hotel')) return IMAGES.templates.hotel
  if (key.includes('gym')) return IMAGES.templates.gym
  if (key.includes('law')) return IMAGES.templates.law
  if (key.includes('estate')) return IMAGES.templates.realestate
  if (key.includes('salon')) return IMAGES.templates.salon
  if (key.includes('school')) return IMAGES.templates.school
  if (key.includes('spa')) return IMAGES.templates.spa
  if (key.includes('bakery')) return IMAGES.templates.bakery
  if (key.includes('logistics')) return IMAGES.templates.logistics
  if (key.includes('portfolio') || key.includes('photography')) return IMAGES.templates.portfolio
  if (key.includes('tech')) return IMAGES.templates.tech
  if (key.includes('ngo')) return IMAGES.templates.ngo
  if (key.includes('church')) return IMAGES.templates.church
  if (key.includes('event')) return IMAGES.templates.event
  if (key.includes('auto')) return IMAGES.templates.automotive
  if (key.includes('travel')) return IMAGES.templates.travel
  if (key.includes('architecture')) return IMAGES.templates.architecture
  if (key.includes('pet')) return IMAGES.templates.pet
  if (key.includes('music')) return IMAGES.templates.music
  if (key.includes('art')) return IMAGES.templates.art
  if (key.includes('supermarket')) return IMAGES.templates.retail
  if (key.includes('construction')) return IMAGES.templates.construction
  if (key.includes('finance')) return IMAGES.templates.finance
  if (key.includes('marketing')) return IMAGES.templates.marketing
  if (key.includes('interior')) return IMAGES.templates.interior
  if (key.includes('gaming')) return IMAGES.templates.gaming
  return IMAGES.templates.tech
}

function pagesFor(price: number) {
  if (price <= 39) return ['Home', 'Work', 'Contact']
  const base = ['Home', 'About', 'Services', 'Gallery', 'FAQ', 'Contact']
  if (price < 69) return [...base, 'Booking']
  if (price < 99) return [...base, 'Details', 'Blog', 'Quote']
  return [...base, 'Departments', 'Team', 'Careers', 'Portal', 'Policies']
}

export const templates: Template[] = seeds.map(([category, subcategory, style, price], index) => {
  const slug = slugify(`${subcategory}-${category}`)
  const previewImage = imageFor(category, subcategory)
  const pages = pagesFor(price)

  return {
    id: `template-${index + 1}`,
    slug,
    name: `${subcategory} Flow`,
    category,
    subcategory,
    style,
    colorScheme: colorSchemeFor(style),
    description: `${style} ${category.toLowerCase()} template for launches that need proof, clarity, and quick contact paths.`,
    longDescription: `A ${subcategory.toLowerCase()} experience shaped for ${category.toLowerCase()} teams. It includes image-led sections, flexible calls to action, responsive pages, and Firebase-ready form surfaces AuraFlow can customize for a production launch.`,
    previewImage,
    screenshots: [
      `${previewImage}&fit=crop&h=720`,
      `${previewImage}&fit=crop&h=820&sat=-8`,
      `${previewImage}&fit=crop&h=760&fm=jpg`,
      `${previewImage}&fit=crop&h=700&auto=format`,
    ],
    pages,
    features: [...genericFeatures, `${subcategory} conversion sections`, `${category} content blocks`],
    techStack: ['React', 'TypeScript', 'TailwindCSS', 'Firebase', 'Vercel'],
    price,
    tier: tierFor(price),
    rating: Number((4.7 + ((index % 3) + 1) / 10).toFixed(1)),
    reviewCount: 46 + index * 3,
    popular: index % 9 === 0 || price === 79,
    tags: [category, subcategory, style, colorSchemeFor(style), pages.length > 7 ? 'multi-page' : 'fast-launch'],
  }
})

export const featuredTemplates = templates.slice(0, 8)
