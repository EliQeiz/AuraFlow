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
