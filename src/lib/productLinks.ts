export type ProductKey =
  "buildproof" | "crestview" | "edma" | "minat" | "jollofvibes";

const configuredUrls: Record<ProductKey, string | undefined> = {
  buildproof:
    import.meta.env.VITE_BUILDPROOF_APP_URL ||
    "https://cocoa-elisha-afaris-projects.vercel.app/workspace",
  crestview:
    import.meta.env.VITE_CRESTVIEW_APP_URL ||
    "https://www.crestviewschool.com/",
  edma: import.meta.env.VITE_EDMA_APP_URL || "https://edma1.vercel.app/",
  minat: import.meta.env.VITE_MINAT_APP_URL || "https://minat.vercel.app/",
  jollofvibes: import.meta.env.VITE_JOLLOFVIBES_APP_URL,
};

/** Only trusted HTTPS product origins can be presented as external launches. */
export function getProductUrl(key: ProductKey) {
  const value = configuredUrls[key]?.trim();
  if (!value) return undefined;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password)
      return undefined;

    return url.toString();
  } catch {
    return undefined;
  }
}
