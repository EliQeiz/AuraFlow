import { QuoteForm } from '../components/forms/QuoteForm'
import { Badge } from '../components/ui/Badge'
import { PageWrapper } from '../components/shared/PageWrapper'
import { SEOHead } from '../components/shared/SEOHead'

export default function GetQuote() {
  return (
    <PageWrapper>
      <SEOHead title="Get a Quote" description="Send AuraFlow a project type, features, budget, timeline, and contact preference." />
      <section className="section-shell py-16">
        <Badge>Project Intake</Badge>
        <h1 className="mt-5 max-w-4xl text-4xl font-extrabold sm:text-6xl">Shape the quote in five quick steps.</h1>
        <p className="mt-4 max-w-2xl text-lg text-aura-muted">The wizard captures enough context for a useful reply without turning discovery into homework.</p>
        <div className="mt-8">
          <QuoteForm />
        </div>
      </section>
    </PageWrapper>
  )
}
