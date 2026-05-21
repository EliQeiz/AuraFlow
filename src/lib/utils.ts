import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number) {
  return price === 0 ? 'Free' : `$${price}`
}

export function getInitials(name?: string | null) {
  if (!name) return 'AF'
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function pageBucket(count: number) {
  if (count <= 3) return '1-3'
  if (count <= 7) return '5-7'
  return '10+'
}

export function asErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}
