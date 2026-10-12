import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title: string;
  description: string;
  image?: string;
  path?: string;
  preloadImage?: string;
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
}

const siteUrl = (
  import.meta.env.VITE_SITE_URL || "https://aura-flow-red.vercel.app"
).replace(/\/$/, "");

export function SEOHead({
  description,
  image = "/media/portfolio/hero-development-v2.webp",
  path = "/",
  preloadImage,
  structuredData,
  title,
}: SEOHeadProps) {
  const pageTitle = title.includes("AuraFlow") ? title : `${title} | AuraFlow`;
  const canonical = `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const socialImage = image.startsWith("http") ? image : `${siteUrl}${image}`;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index,follow,max-image-preview:large" />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={socialImage} />
      <meta property="og:image:alt" content="AuraFlow technology portfolio" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={socialImage} />
      {preloadImage ? (
        <link
          rel="preload"
          as="image"
          href={preloadImage}
          fetchPriority="high"
        />
      ) : null}
      {structuredData ? (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      ) : null}
    </Helmet>
  );
}
