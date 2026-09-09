import { TemplateLibrary } from '../components/shared/TemplateLibrary'
import { SEOHead } from '../components/shared/SEOHead'
export default function Templates() {
  return (
    <main className="section-shell pb-20">
      <SEOHead
        title="Template Library"
        description="Explore AuraFlow's website templates and business suite prototypes."
      />
      <header className="public-page-heading">
        <span className="eyebrow">The AuraFlow library</span>
        <h1>Start with something good.</h1>
        <p>
          Find a direction you love, then make it your own. Explore website
          templates and configurable business suites.
        </p>
      </header>
      <TemplateLibrary />
    </main>
  )
}
