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
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code) : ''

  const firebaseMessages: Record<string, string> = {
    'auth/email-already-in-use': 'That email already has an AuraFlow account. Sign in instead, or reset the password.',
    'auth/invalid-credential': 'The email or password is not correct.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase Auth yet.',
    'auth/popup-blocked': 'Your browser blocked the Google sign-in window. Try again or allow popups for AuraFlow.',
    'auth/popup-closed-by-user': 'Google sign-in was closed before it finished.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment, then try again.',
    'auth/unauthorized-domain': 'This domain is not authorized in Firebase Auth. Add the production domain to Authorized domains.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/weak-password': 'Use a stronger password with at least 6 characters.',
    'permission-denied': 'Firebase security rules blocked that action. Please sign in again and retry.',
  }

  if (firebaseMessages[code]) return firebaseMessages[code]
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}
