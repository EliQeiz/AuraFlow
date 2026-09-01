import { Helmet } from 'react-helmet-async'

interface SEOHeadProps {
  title: string
  description: string
  image?: string
}

export function SEOHead({ description, image, title }: SEOHeadProps) {
  const pageTitle = `${title} | AuraFlow`

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      {image ? <meta property="og:image" content={image} /> : null}
      {image ? <meta name="twitter:image" content={image} /> : null}
    </Helmet>
  )
}
