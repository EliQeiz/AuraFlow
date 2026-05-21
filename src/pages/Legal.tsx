import { PageWrapper } from '../components/shared/PageWrapper'
import { SEOHead } from '../components/shared/SEOHead'

export function Legal({ kind }: { kind: 'Privacy Policy' | 'Terms' }) {
  return (
    <PageWrapper>
      <SEOHead title={kind} description={`${kind} for AuraFlow client and website visitors.`} />
      <section className="section-shell py-16">
        <h1 className="text-4xl font-extrabold">{kind}</h1>
        <div className="prose-aura mt-6 max-w-3xl">
          <p>AuraFlow uses submitted contact, quote, newsletter, and account information to respond to clients and deliver requested services.</p>
          <p>Project scope, pricing, template licensing, and support expectations are confirmed in writing before production work begins.</p>
          <p>For questions, contact elishaafari0@gmail.com.</p>
        </div>
      </section>
    </PageWrapper>
  )
}
