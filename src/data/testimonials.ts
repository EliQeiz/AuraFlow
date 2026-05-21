import type { Testimonial } from '../types'

export const testimonials: Testimonial[] = [
  ['Amina Boateng', 'Founder', 'PlateRoom', 'AuraFlow turned a scattered restaurant idea into a booking flow customers actually finish.'],
  ['Daniel Mensah', 'Operations Lead', 'Kite Logistics', 'The dashboard replaced three weekly spreadsheets and made delayed jobs visible in minutes.'],
  ['Lena Park', 'Product Manager', 'Fieldnote', 'They found the sharp product story before they wrote a line of interface code.'],
  ['Kwesi Addo', 'Director', 'North Clinic', 'Our patient intake feels calm, clear, and much faster on mobile.'],
  ['Sofia Ramos', 'Owner', 'Studio Sol', 'The template gave us speed, and the customization made it unmistakably ours.'],
  ['Evan Cole', 'CTO', 'PulseGrid', 'Firebase auth, storage, and deployment landed cleanly with excellent handoff notes.'],
  ['Maya Singh', 'Marketing Lead', 'Cascade Travel', 'Page speed improved and our quote requests became easier to qualify.'],
  ['Olivia Chen', 'Founder', 'Luma Commerce', 'AuraFlow balanced polish with sensible tradeoffs. The store feels premium without friction.'],
  ['Noah Williams', 'Coach', 'Forge Fitness', 'People can see schedules, classes, and pricing immediately. That clarity sells.'],
  ['Tariq Hassan', 'Partner', 'Hassan Legal', 'The site finally matches the confidence of the firm while staying easy to update.'],
  ['Grace Arthur', 'Program Lead', 'BrightSteps', 'The nonprofit template gave donors and volunteers a clear next step.'],
  ['Mateo Silva', 'Creative Director', 'Monument', 'The portfolio motion is tasteful, fast, and focused on the work.'],
].map(([name, role, company, quote], index) => ({
  id: `review-${index + 1}`,
  avatar: `https://randomuser.me/api/portraits/${index % 2 ? 'men' : 'women'}/${18 + index}.jpg`,
  name,
  role,
  company,
  rating: index === 2 ? 4 : 5,
  quote,
}))
