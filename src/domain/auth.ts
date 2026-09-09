import { z } from 'zod'

export const emailSchema = z
  .string()
  .trim()
  .email('Enter a valid email address.')
  .max(254)
export const passwordSchema = z
  .string()
  .min(10, 'Use at least 10 characters.')
  .max(128, 'Use 128 characters or fewer.')
export const registrationSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your full name.').max(120),
    email: emailSchema,
    password: passwordSchema,
    confirm: z.string(),
    terms: z.literal(true, {
      error: 'Accept the terms to create your account.',
    }),
  })
  .refine((data) => data.password === data.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match.',
  })

export function safeReturnPath(
  value: unknown,
  fallback = '/dashboard',
): string {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    [...value].some((character) => character.charCodeAt(0) < 32)
  )
    return fallback
  const url = new URL(value, 'https://auraflow.invalid')
  if (
    url.origin !== 'https://auraflow.invalid' ||
    /^\/(login|register|forgot-password|auth)(\/|$)/.test(url.pathname)
  )
    return fallback
  return `${url.pathname}${url.search}${url.hash}`
}

export function authDestination(state: unknown) {
  const from = (
    state as {
      from?: { pathname?: string; search?: string; hash?: string }
    } | null
  )?.from
  return safeReturnPath(
    from
      ? `${from.pathname ?? ''}${from.search ?? ''}${from.hash ?? ''}`
      : null,
  )
}
