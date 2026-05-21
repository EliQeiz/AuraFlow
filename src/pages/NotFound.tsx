import { ButtonLink } from '../components/ui/Button'
import { PageWrapper } from '../components/shared/PageWrapper'
import { SEOHead } from '../components/shared/SEOHead'

export default function NotFound() {
  return (
    <PageWrapper>
      <SEOHead title="Not Found" description="The requested AuraFlow route could not be found." />
      <section className="section-shell grid min-h-[60vh] place-items-center py-16 text-center">
        <div>
          <p className="font-orbitron text-cyan-100">404</p>
          <h1 className="mt-3 text-4xl font-extrabold">That route slipped out of the flow.</h1>
          <ButtonLink to="/" className="mt-6">Return Home</ButtonLink>
        </div>
      </section>
    </PageWrapper>
  )
}
