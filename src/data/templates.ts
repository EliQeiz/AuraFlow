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

const pexelsPhoto = (id: number) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600`
const unsplashPhoto = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=85`

const templateGalleries: Record<string, string[]> = {
  'fine-dining-restaurant': [
    pexelsPhoto(12387900),
    pexelsPhoto(12919159),
    pexelsPhoto(13869887),
    IMAGES.templates.restaurant,
  ],
  'fast-food-restaurant': [
    pexelsPhoto(5333327),
    pexelsPhoto(18805640),
    pexelsPhoto(17952748),
    pexelsPhoto(30246915),
  ],
  'cafe-restaurant': [
    IMAGES.templates.cafe,
    pexelsPhoto(36580003),
    unsplashPhoto('photo-1498804103079-a6351b050096'),
    unsplashPhoto('photo-1501339847302-ac426a4a7cbb'),
  ],
  'food-delivery-restaurant': [
    pexelsPhoto(32612769),
    pexelsPhoto(30246915),
    pexelsPhoto(633627),
    pexelsPhoto(17952748),
  ],
  'general-practice-clinic': [
    IMAGES.templates.clinic,
    pexelsPhoto(6303659),
    unsplashPhoto('photo-1576091160399-112ba8d25d1d'),
    unsplashPhoto('photo-1538108149393-fbbd81895907'),
  ],
  'dental-clinic': [
    unsplashPhoto('photo-1606811971618-4486d14f3f99'),
    unsplashPhoto('photo-1588776814546-1ffcf47267a5'),
    unsplashPhoto('photo-1445527815219-ecbfec67492e'),
    IMAGES.templates.clinic,
  ],
  'pediatric-clinic': [
    pexelsPhoto(6303650),
    pexelsPhoto(6303659),
    unsplashPhoto('photo-1576091160550-2173dba999ef'),
    IMAGES.templates.clinic,
  ],
  'full-hospital-hospital': [
    unsplashPhoto('photo-1586773860418-d37222d8fce3'),
    unsplashPhoto('photo-1538108149393-fbbd81895907'),
    IMAGES.templates.clinic,
    pexelsPhoto(6303650),
  ],
  'fashion-e-commerce': [
    unsplashPhoto('photo-1445205170230-053b83016050'),
    unsplashPhoto('photo-1483985988355-763728e1935b'),
    IMAGES.templates.ecommerce,
    unsplashPhoto('photo-1525507119028-ed4c629a60a3'),
  ],
  'electronics-e-commerce': [
    unsplashPhoto('photo-1550745165-9bc0b252726f'),
    unsplashPhoto('photo-1517336714731-489689fd1ca8'),
    IMAGES.templates.ecommerce,
    unsplashPhoto('photo-1526738549149-8e07eca6c147'),
  ],
  'grocery-e-commerce': [
    IMAGES.templates.retail,
    unsplashPhoto('photo-1542838132-92c53300491e'),
    unsplashPhoto('photo-1601599963565-b7ba29c8e3ff'),
    unsplashPhoto('photo-1583258292688-d0213dc5a3a8'),
  ],
  'jewelry-e-commerce': [
    unsplashPhoto('photo-1515562141207-7a88fb7ce338'),
    unsplashPhoto('photo-1523170335258-f5ed11844a49'),
    IMAGES.templates.ecommerce,
    unsplashPhoto('photo-1605100804763-247f67b3557e'),
  ],
  'boutique-hotel-hotel': [
    IMAGES.templates.hotel,
    unsplashPhoto('photo-1566665797739-1674de7a421a'),
    unsplashPhoto('photo-1445019980597-93fa8acb246c'),
    unsplashPhoto('photo-1505693416388-ac5ce068fe85'),
  ],
  'resort-hotel': [
    unsplashPhoto('photo-1505693416388-ac5ce068fe85'),
    unsplashPhoto('photo-1542314831-068cd1dbfeeb'),
    IMAGES.templates.hotel,
    unsplashPhoto('photo-1564501049412-61c2a3083791'),
  ],
  'hostel-hotel': [
    unsplashPhoto('photo-1590490360182-c33d57733427'),
    unsplashPhoto('photo-1555854877-bab0e564b8d5'),
    IMAGES.templates.hotel,
    unsplashPhoto('photo-1566665797739-1674de7a421a'),
  ],
  'crossfit-gym': [
    IMAGES.templates.gym,
    unsplashPhoto('photo-1517836357463-d25dfeac3438'),
    unsplashPhoto('photo-1583454110551-21f2fa2afe61'),
    unsplashPhoto('photo-1538805060514-97d9cc17730c'),
  ],
  'yoga-studio-gym': [
    unsplashPhoto('photo-1544367567-0f2fcb009e0b'),
    unsplashPhoto('photo-1506126613408-eca07ce68773'),
    unsplashPhoto('photo-1599901860904-17e6ed7083a0'),
    IMAGES.templates.spa,
  ],
  'mma-boxing-gym': [
    unsplashPhoto('photo-1517438322307-e67111335449'),
    unsplashPhoto('photo-1549719386-74dfcbf7dbed'),
    unsplashPhoto('photo-1519505907962-0a6cb0167c73'),
    IMAGES.templates.gym,
  ],
  'k-12-school-school': [
    IMAGES.templates.school,
    unsplashPhoto('photo-1503676260728-1c00da094a0b'),
    unsplashPhoto('photo-1497633762265-9d179a990aa6'),
    unsplashPhoto('photo-1588072432836-e10032774350'),
  ],
  'university-school': [
    unsplashPhoto('photo-1523240795612-9a054b0db644'),
    unsplashPhoto('photo-1524995997946-a1c2e315a42f'),
    IMAGES.templates.school,
    unsplashPhoto('photo-1541339907198-e08756dedf3f'),
  ],
  'online-course-school': [
    unsplashPhoto('photo-1516321318423-f06f85e504b3'),
    unsplashPhoto('photo-1522202176988-66273c2fd55f'),
    unsplashPhoto('photo-1509062522246-3755977927d7'),
    IMAGES.services.webApps,
  ],
  'daycare-school': [
    unsplashPhoto('photo-1503454537195-1dcabb73ffb9'),
    unsplashPhoto('photo-1542810634-71277d95dcbb'),
    IMAGES.templates.school,
    unsplashPhoto('photo-1587654780291-39c9404d746b'),
  ],
  'general-law-law-firm': [
    IMAGES.templates.law,
    unsplashPhoto('photo-1450101499163-c8848c66ca85'),
    unsplashPhoto('photo-1589994965851-a8f479c573a9'),
    unsplashPhoto('photo-1521791136064-7986c2920216'),
  ],
  'criminal-defense-law-firm': [
    unsplashPhoto('photo-1589994965851-a8f479c573a9'),
    IMAGES.templates.law,
    unsplashPhoto('photo-1453945619913-79ec89a82c51'),
    unsplashPhoto('photo-1505664194779-8beaceb93744'),
  ],
  'luxury-properties-real-estate': [
    IMAGES.templates.realestate,
    unsplashPhoto('photo-1600585154340-be6161a56a0c'),
    unsplashPhoto('photo-1605146769289-440113cc3d00'),
    unsplashPhoto('photo-1570129477492-45c003edd2be'),
  ],
  'rental-agency-real-estate': [
    unsplashPhoto('photo-1564013799919-ab600027ffc6'),
    unsplashPhoto('photo-1600607687939-ce8a6c25118c'),
    IMAGES.templates.realestate,
    unsplashPhoto('photo-1560185007-c5ca9d2c014d'),
  ],
  'beauty-salon-salon': [
    IMAGES.templates.salon,
    unsplashPhoto('photo-1560066984-138dadb4c035'),
    unsplashPhoto('photo-1521590832167-7bcbfaa6381f'),
    unsplashPhoto('photo-1595476108010-b4d1f102b1b1'),
  ],
  'barbershop-salon': [
    unsplashPhoto('photo-1503951914875-452162b0f3f1'),
    unsplashPhoto('photo-1512690459411-b9245aed614b'),
    IMAGES.templates.salon,
    unsplashPhoto('photo-1621605815971-fbc98d665033'),
  ],
  'nail-studio-salon': [
    unsplashPhoto('photo-1604654894610-df63bc536371'),
    unsplashPhoto('photo-1607779097040-26e80aa78e66'),
    IMAGES.templates.salon,
    unsplashPhoto('photo-1519014816548-bf5fe059798b'),
  ],
  'wellness-spa-spa': [
    IMAGES.templates.spa,
    unsplashPhoto('photo-1544161515-4ab6ce6db874'),
    unsplashPhoto('photo-1515377905703-c4788e51af15'),
    unsplashPhoto('photo-1552693673-1bf958298935'),
  ],
  'retail-pharmacy-pharmacy': [
    unsplashPhoto('photo-1587854692152-cbe660dbde88'),
    unsplashPhoto('photo-1580281657527-47f249e8f320'),
    IMAGES.templates.clinic,
    unsplashPhoto('photo-1471864190281-a93a3070b6de'),
  ],
  'artisan-bakery-bakery': [
    IMAGES.templates.bakery,
    unsplashPhoto('photo-1517433367423-c7e5b0f35086'),
    unsplashPhoto('photo-1483695028939-5bb13f8648b0'),
    unsplashPhoto('photo-1555507036-ab1f4038808a'),
  ],
  'freight-company-logistics': [
    IMAGES.templates.logistics,
    unsplashPhoto('photo-1586528116311-ad8dd3c8310d'),
    unsplashPhoto('photo-1578575437130-527eed3abbec'),
    unsplashPhoto('photo-1494412519320-aa613dfb7738'),
  ],
  'saas-product-tech-startup': [
    IMAGES.services.webApps,
    IMAGES.services.dataAnalytics,
    unsplashPhoto('photo-1460925895917-afdab827c52f'),
    IMAGES.services.backend,
  ],
  'app-landing-tech-startup': [
    IMAGES.services.mobileApps,
    unsplashPhoto('photo-1512941937669-90a1b58e7e9c'),
    IMAGES.services.webApps,
    unsplashPhoto('photo-1551650975-87deedd944c3'),
  ],
  'wedding-event': [
    IMAGES.templates.event,
    unsplashPhoto('photo-1464366400600-7168b8af9bc3'),
    unsplashPhoto('photo-1519167758481-83f550bb49b3'),
    unsplashPhoto('photo-1519741497674-611481863552'),
  ],
  'corporate-event-event': [
    unsplashPhoto('photo-1505373877841-8d25f7d46678'),
    unsplashPhoto('photo-1475721027785-f74eccf877e2'),
    unsplashPhoto('photo-1511578314322-379afb476865'),
    IMAGES.templates.event,
  ],
  'charity-ngo': [
    IMAGES.templates.ngo,
    unsplashPhoto('photo-1593113598332-cd288d649433'),
    unsplashPhoto('photo-1488521787991-ed7bbaae773c'),
    unsplashPhoto('photo-1469571486292-0ba58a3f068b'),
  ],
  'religious-church': [
    IMAGES.templates.church,
    unsplashPhoto('photo-1507692049790-de58290a4334'),
    unsplashPhoto('photo-1438032005730-c779502df39b'),
    unsplashPhoto('photo-1489515217757-5fd1be406fef'),
  ],
  'car-dealership-automotive': [
    IMAGES.templates.automotive,
    unsplashPhoto('photo-1503376780353-7e6692767b70'),
    unsplashPhoto('photo-1489824904134-891ab64532f1'),
    unsplashPhoto('photo-1542362567-b07e54358753'),
  ],
  'travel-agency-travel': [
    unsplashPhoto('photo-1507525428034-b723cf961d3e'),
    unsplashPhoto('photo-1500530855697-b586d89ba3ee'),
    unsplashPhoto('photo-1488646953014-85cb44e25828'),
    IMAGES.templates.travel,
  ],
  'dental-clinic-dentist': [
    unsplashPhoto('photo-1588776814546-1ffcf47267a5'),
    unsplashPhoto('photo-1606811971618-4486d14f3f99'),
    unsplashPhoto('photo-1445527815219-ecbfec67492e'),
    IMAGES.templates.clinic,
  ],
  'creative-portfolio-portfolio': [
    IMAGES.templates.portfolio,
    unsplashPhoto('photo-1550745165-9bc0b252726f'),
    unsplashPhoto('photo-1517694712202-14dd9538aa97'),
    IMAGES.templates.architecture,
  ],
  'photography-portfolio': [
    unsplashPhoto('photo-1452587925148-ce544e77e70d'),
    unsplashPhoto('photo-1500530855697-b586d89ba3ee'),
    unsplashPhoto('photo-1542038784456-1ea8e935640e'),
    IMAGES.templates.portfolio,
  ],
  'studio-portfolio-photography': [
    unsplashPhoto('photo-1542038784456-1ea8e935640e'),
    unsplashPhoto('photo-1452587925148-ce544e77e70d'),
    unsplashPhoto('photo-1493863641943-9b68992a8d07'),
    IMAGES.templates.portfolio,
  ],
  'architecture-firm-architecture': [
    IMAGES.templates.architecture,
    unsplashPhoto('photo-1487958449943-2429e8be8625'),
    unsplashPhoto('photo-1497366754035-f200968a6e72'),
    unsplashPhoto('photo-1503387762-592deb58ef4e'),
  ],
  'pet-shop-and-vet-pet': [
    IMAGES.templates.pet,
    unsplashPhoto('photo-1548199973-03cce0bbc87b'),
    unsplashPhoto('photo-1601758124510-52d02ddb7cbd'),
    unsplashPhoto('photo-1583337130417-3346a1be7dee'),
  ],
  'music-studio-music': [
    IMAGES.templates.music,
    unsplashPhoto('photo-1511379938547-c1f69419868d'),
    unsplashPhoto('photo-1507838153414-b4b713384a76'),
    unsplashPhoto('photo-1525201548942-d8732f6617a0'),
  ],
  'art-gallery-art': [
    IMAGES.templates.art,
    unsplashPhoto('photo-1547826039-bfc35e0f1ea8'),
    unsplashPhoto('photo-1531058020387-3be344556be6'),
    unsplashPhoto('photo-1526315525836-187a6bd5a5d4'),
  ],
  'supermarket-mart-supermarket': [
    unsplashPhoto('photo-1542838132-92c53300491e'),
    IMAGES.templates.retail,
    unsplashPhoto('photo-1601599963565-b7ba29c8e3ff'),
    unsplashPhoto('photo-1583258292688-d0213dc5a3a8'),
  ],
  'contractor-construction': [
    IMAGES.templates.construction,
    unsplashPhoto('photo-1541888946425-d81bb19240f5'),
    unsplashPhoto('photo-1503387762-592deb58ef4e'),
    unsplashPhoto('photo-1504307651254-35680f356dfd'),
  ],
  'accounting-firm-finance': [
    IMAGES.templates.finance,
    unsplashPhoto('photo-1554224154-26032ffc0d07'),
    unsplashPhoto('photo-1554224155-8d04cb21cd6c'),
    unsplashPhoto('photo-1460925895917-afdab827c52f'),
  ],
  'agency-marketing': [
    IMAGES.templates.marketing,
    unsplashPhoto('photo-1552664730-d307ca884978'),
    unsplashPhoto('photo-1542744173-8e7e53415bb0'),
    unsplashPhoto('photo-1519389950473-47ba0277781c'),
  ],
  'interior-studio-interior-design': [
    IMAGES.templates.interior,
    unsplashPhoto('photo-1616486338812-3dadae4b4ace'),
    unsplashPhoto('photo-1600210492493-0946911123ea'),
    unsplashPhoto('photo-1600566753190-17f0baa2a6c3'),
  ],
  'esports-team-gaming': [
    IMAGES.templates.gaming,
    unsplashPhoto('photo-1511512578047-dfb367046420'),
    unsplashPhoto('photo-1493711662062-fa541adb3fc8'),
    unsplashPhoto('photo-1593305841991-05c297ba4575'),
  ],
}

function imageFor(category: string, subcategory: string) {
  const key = `${category} ${subcategory}`.toLowerCase()
  if (key.includes('cafe')) return IMAGES.templates.cafe
  if (key.includes('restaurant')) return IMAGES.templates.restaurant
  if (key.includes('clinic') || key.includes('hospital') || key.includes('dent')) return IMAGES.templates.clinic
  if (key.includes('pharmacy')) return IMAGES.templates.clinic
  if (key.includes('commerce') || key.includes('fashion') || key.includes('jewelry')) return IMAGES.templates.ecommerce
  if (key.includes('hotel')) return IMAGES.templates.hotel
  if (key.includes('gym')) return IMAGES.templates.gym
  if (key.includes('law')) return IMAGES.templates.law
  if (key.includes('estate')) return IMAGES.templates.realestate
  if (key.includes('salon') || key.includes('barber')) return IMAGES.templates.salon
  if (key.includes('school') || key.includes('daycare')) return IMAGES.templates.school
  if (key.includes('spa')) return IMAGES.templates.spa
  if (key.includes('bakery')) return IMAGES.templates.bakery
  if (key.includes('logistics')) return IMAGES.templates.logistics
  if (key.includes('supermarket')) return IMAGES.templates.retail
  if (key.includes('art gallery')) return IMAGES.templates.art
  if (key.includes('portfolio') || key.includes('photography')) return IMAGES.templates.portfolio
  if (key.includes('tech')) return IMAGES.templates.tech
  if (key.includes('ngo')) return IMAGES.templates.ngo
  if (key.includes('church')) return IMAGES.templates.church
  if (key.includes('event')) return IMAGES.templates.event
  if (key.includes('auto')) return IMAGES.templates.automotive
  if (key.includes('travel') || key.includes('car rental')) return IMAGES.templates.travel
  if (key.includes('architecture')) return IMAGES.templates.architecture
  if (key.includes('pet')) return IMAGES.templates.pet
  if (key.includes('music')) return IMAGES.templates.music
  if (key.includes('construction')) return IMAGES.templates.construction
  if (key.includes('finance')) return IMAGES.templates.finance
  if (key.includes('marketing')) return IMAGES.templates.marketing
  if (key.includes('interior')) return IMAGES.templates.interior
  if (key.includes('gaming')) return IMAGES.templates.gaming
  return IMAGES.templates.tech
}

function fallbackGallery(category: string, subcategory: string) {
  const preview = imageFor(category, subcategory)
  const key = `${category} ${subcategory}`.toLowerCase()
  if (key.includes('tech')) return [preview, IMAGES.services.webApps, IMAGES.services.mobileApps, IMAGES.services.dataAnalytics]
  if (key.includes('portfolio') || key.includes('photography')) return [preview, IMAGES.templates.art, IMAGES.templates.architecture, IMAGES.templates.interior]
  if (key.includes('event')) return [preview, IMAGES.templates.event, IMAGES.templates.hotel, IMAGES.templates.restaurant]
  if (key.includes('dent') || key.includes('pharmacy')) return [preview, IMAGES.templates.clinic, unsplashPhoto('photo-1576091160399-112ba8d25d1d'), unsplashPhoto('photo-1538108149393-fbbd81895907')]
  return [preview, imageFor(category, ''), IMAGES.services.websites, IMAGES.about.office]
}

function uniqueGallery(images: string[]) {
  return [...new Set(images.filter(Boolean))]
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
  const imageSet = uniqueGallery(templateGalleries[slug] ?? fallbackGallery(category, subcategory))
  const previewImage = imageSet[0]
  const pages = pagesFor(price)

  return {
    id: `template-${index + 1}`,
    slug,
    name: `${subcategory} Flow`,
    category,
    subcategory,
    style,
    colorScheme: colorSchemeFor(style),
    description: `${style} ${category.toLowerCase()} template for launches that need proof, clarity, and a locally adaptable content path.`,
    longDescription: `A ${subcategory.toLowerCase()} experience shaped for ${category.toLowerCase()} teams. It includes image-led sections, flexible calls to action, responsive pages, and Firebase-ready surfaces AuraFlow can localize for Ghanaian, African, and international launches.`,
    previewImage,
    screenshots: imageSet.slice(1),
    pages,
    features: [...genericFeatures, `${subcategory} conversion sections`, `${category} content blocks`],
    techStack: ['React', 'TypeScript', 'TailwindCSS', 'Firebase', 'Vercel'],
    price,
    tier: tierFor(price),
    popular: index % 9 === 0 || price === 79,
    tags: [category, subcategory, style, colorSchemeFor(style), pages.length > 7 ? 'multi-page' : 'fast-launch'],
  }
})

export const featuredTemplates = templates.slice(0, 8)
