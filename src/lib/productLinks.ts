export type ProductKey = 'buildproof' | 'crestview'

const configuredUrls: Record<ProductKey, string | undefined> = {
  buildproof: import.meta.env.VITE_BUILDPROOF_APP_URL,
  crestview: import.meta.env.VITE_CRESTVIEW_APP_URL,
}

/** Only trusted HTTPS product origins can be presented as external launches. */
export function getProductUrl(key: ProductKey) {
  const value = configuredUrls[key]?.trim()
  if (!value) return undefined

  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return undefined

    // BuildProof's real evaluation journey begins with its own secure
    // organisation signup, never with an unauthenticated replica.
    if (key === 'buildproof' && url.pathname === '/') {
      url.pathname = '/auth'
      url.searchParams.set('mode', 'signup')
    }

    return url.toString()
  } catch {
    return undefined
  }
}
