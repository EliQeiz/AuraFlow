import { Helmet } from 'react-helmet-async'

interface SEOHeadProps {
  title: string
  description: string
  image?: string
}

export function SEOHead({ description, image, title }: SEOHeadProps) {
  return (
    <Helmet>
      <title>{title} | AuraFlow</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={`${title} | AuraFlow`} />
      <meta property="og:description" content={description} />
      {image ? <meta property="og:image" content={image} /> : null}
    </Helmet>
  )
}
