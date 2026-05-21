import { BlogPreview } from '../components/sections/BlogPreview'
import { CTA } from '../components/sections/CTA'
import { FAQ } from '../components/sections/FAQ'
import { FeaturedPortfolio } from '../components/sections/FeaturedPortfolio'
import { HowItWorks } from '../components/sections/HowItWorks'
import { LandingHero } from '../components/sections/LandingHero'
import { Newsletter } from '../components/sections/Newsletter'
import { ServicesGrid } from '../components/sections/ServicesGrid'
import { StatsBar } from '../components/sections/StatsBar'
import { TemplateEngine } from '../components/sections/TemplateEngine'
import { Testimonials } from '../components/sections/Testimonials'
import { PageWrapper } from '../components/shared/PageWrapper'
import { SEOHead } from '../components/shared/SEOHead'

export default function Home() {
  return (
    <PageWrapper>
      <SEOHead
        title="Web & Mobile Development Solutions"
        description="AuraFlow builds premium websites, apps, dashboards, templates, and Firebase-backed product experiences."
      />
      <LandingHero />
      <StatsBar />
      <ServicesGrid />
      <TemplateEngine />
      <HowItWorks />
      <Testimonials />
      <FeaturedPortfolio />
      <BlogPreview />
      <CTA />
      <FAQ />
      <Newsletter />
    </PageWrapper>
  )
}
