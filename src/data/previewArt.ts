import type { Template } from '../types'
export const previewArt = {
  education: '/template-previews/crestview-school.png',
  restaurant: '/template-previews/edma-restaurant.png',
  cafe: '/template-previews/kofi-cafe.png',
  pharmacy: '/template-previews/everwell-pharmacy.png',
  hotel: '/template-previews/akwaaba-hotel.png',
  industrial: '/template-previews/industrial-operations.png',
}
export const previewVideo = {
  platform: '/media/auraflow-platform.mp4',
  education: '/media/crestview-school.mp4',
  restaurant: '/media/edma-restaurant.mp4',
  restaurantAlt: '/media/restaurant-showcase.mp4',
}
export function suiteArtwork(slug: string) {
  if (slug.includes('school')) return previewArt.education
  if (slug.includes('restaurant')) return previewArt.restaurant
  if (slug.includes('hotel')) return previewArt.hotel
  if (slug.includes('pharmacy')) return previewArt.pharmacy
  if (slug.includes('industrial')) return previewArt.industrial
  return undefined
}
export function suiteVideo(slug: string) {
  if (slug.includes('school')) return [previewVideo.education]
  if (slug.includes('restaurant')) return [previewVideo.restaurant, previewVideo.restaurantAlt]
  return []
}
export function templateArtwork(
  template: Pick<Template, 'category' | 'subcategory'>,
) {
  if (template.subcategory === 'Cafe') return previewArt.cafe
  if (template.category === 'Pharmacy') return previewArt.pharmacy
  if (template.subcategory === 'Fine Dining') return previewArt.restaurant
  if (template.subcategory === 'Boutique Hotel') return previewArt.hotel
  if (template.subcategory === 'K-12 School') return previewArt.education
  return undefined
}
export function templateVideo(template: Pick<Template, 'category' | 'subcategory'>) {
  if (template.subcategory === 'K-12 School') return [previewVideo.education]
  if (template.category === 'Restaurant' || template.subcategory === 'Cafe' || template.subcategory === 'Fine Dining') return [previewVideo.restaurant, previewVideo.restaurantAlt]
  return []
}
