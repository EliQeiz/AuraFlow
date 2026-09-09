import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ZodError } from 'zod'

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
  if (error instanceof ZodError)
    return error.issues[0]?.message || 'Check the information you entered.'
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: unknown }).code)
      : ''

  const firebaseMessages: Record<string, string> = {
    'auth/email-already-in-use':
      'That email already has an AuraFlow account. Sign in instead, or reset the password.',
    'auth/invalid-credential': 'The email or password is not correct.',
    'auth/wrong-password': 'The email or password is not correct.',
    'auth/user-not-found': 'The email or password is not correct.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/operation-not-allowed':
      'This sign-in method is temporarily unavailable. Please contact AuraFlow support.',
    'auth/popup-blocked':
      'Your browser blocked the Google sign-in window. Try again or allow popups for AuraFlow.',
    'auth/popup-closed-by-user':
      'Google sign-in was closed before it finished.',
    'auth/too-many-requests':
      'Too many attempts. Please wait a moment, then try again.',
    'auth/unauthorized-domain':
      'Sign-in is unavailable at this address. Please contact AuraFlow support.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/weak-password':
      'Choose a longer password with at least 10 characters.',
    'auth/network-request-failed':
      'Unable to connect. Check your internet connection and try again.',
    'auth/requires-recent-login':
      'Please sign in again to confirm this sensitive change.',
    'permission-denied':
      'You do not have access to this item. Sign in with the correct account or contact support.',
    'storage/unauthorized':
      'This file is unavailable to your account. Check the file type and sign-in account, or contact support.',
    'storage/retry-limit-exceeded':
      'The upload could not finish. Check your connection and retry.',
    'storage/object-not-found':
      'This file is no longer available. Please ask the team to upload it again.',
  }

  if (firebaseMessages[code]) return firebaseMessages[code]
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.'
}
