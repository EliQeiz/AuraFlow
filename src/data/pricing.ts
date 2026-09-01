export const pricingTiers = [
  {
    name: 'Starter',
    monthly: 299,
    audience: 'Small businesses and landing pages',
    features: ['Conversion landing page', 'Responsive build', 'Contact capture', 'Launch support'],
  },
  {
    name: 'Growth',
    monthly: 799,
    audience: 'Full websites and basic web apps',
    features: ['Multi-page website', 'CMS-ready data', 'Firebase integrations', 'Performance reporting'],
    featured: true,
  },
  {
    name: 'Enterprise',
    monthly: null,
    audience: 'Complex apps, ML, and full-stack delivery',
    features: ['Product squad planning', 'Advanced auth and data', 'AI and analytics options', 'Support plan'],
  },
]

export const templatePricing = [
  { tier: 'Free', price: '$0', includes: 'Starter sections and exploration previews' },
  { tier: 'Starter', price: '$29', includes: 'Focused page set for fast launches' },
  { tier: 'Studio', price: '$49', includes: 'Rich business template with conversion flows' },
  { tier: 'Pro', price: '$79', includes: 'Advanced sections, integrations, and dashboards' },
  { tier: 'Premium', price: '$99', includes: 'Large templates for complex organizations' },
  { tier: 'Custom', price: 'Quote', includes: 'Brand, feature, and backend customization' },
]

export const hostedPlans = [
  {
    name: 'Hosted Starter',
    price: '$39/mo',
    bestFor: 'Portfolios, landing sites, salons, cafes, and simple business websites',
    includes: 'Managed AuraFlow link, template customization, contact capture, updates, and basic dashboard access',
  },
  {
    name: 'Hosted Business',
    price: '$79/mo',
    bestFor: 'Restaurants, shops, pharmacies, churches, NGOs, and appointment businesses',
    includes: 'Business modules, admin dashboard, uploads, request forms, customer messages, and monthly support',
  },
  {
    name: 'Hosted School',
    price: '$99/mo',
    bestFor: 'Schools, academies, training centers, and parent/staff portals',
    includes: 'Admissions, records, classes, fees, announcements, staff roles, parent access, and reports',
  },
  {
    name: 'Hosted Operations',
    price: '$129/mo',
    bestFor: 'Supermarkets, logistics, real estate, clinics, hotels, and multi-role teams',
    includes: 'Advanced workflows, role permissions, dashboards, storage, previews, and upgrade planning',
  },
]
