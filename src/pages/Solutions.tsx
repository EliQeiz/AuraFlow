import { Search, ArrowUpRight } from 'lucide-react'
import { useState } from 'react'
import { suiteBlueprints } from '../data/suiteBlueprints'
import { SEOHead } from '../components/shared/SEOHead'
import { Input, Select } from '../components/ui/Input'
import { ButtonLink } from '../components/ui/Button'
import { StatePanel } from '../components/ui/StatePanel'
import { SuiteCover } from '../components/shared/TemplateCover'

export default function Solutions() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const suites = suiteBlueprints.filter(
    (suite) =>
      (!category || suite.category === category) &&
      `${suite.title} ${suite.summary}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  )
  return (
    <main className="section-shell pb-20">
      <SEOHead
        title="Business Suites"
        description="Configurable prototypes for schools, restaurants, hotels, shops, and service businesses."
      />
      <header className="public-page-heading">
        <span className="eyebrow">The AuraFlow platform</span>
        <h1>Software for the way you work.</h1>
        <p>
          Start with an industry blueprint. Choose your modules, design your
          pages, and work with our team to bring your platform to life.
        </p>
      </header>
      <div className="library-toolbar">
        <div className="search-field">
          <Search />
          <Input
            aria-label="Search business suites"
            placeholder="Find your industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          aria-label="Suite category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All industries</option>
          {[...new Set(suiteBlueprints.map((s) => s.category))].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </div>
      <div className="library-grid">
        {suites.map((suite) => (
          <article key={suite.slug} className="library-item">
            <div className="library-image">
              <SuiteCover suite={suite} />
            </div>
            <h2>{suite.title}</h2>
            <p className="line-clamp-2">{suite.summary}</p>
            <div className="page-actions">
              <ButtonLink to={`/solutions/${suite.slug}`} variant="secondary">
                Explore suite
                <ArrowUpRight />
              </ButtonLink>
              <ButtonLink to={`/studio?suite=${suite.slug}`}>
                Design yours
              </ButtonLink>
            </div>
          </article>
        ))}
      </div>
      {!suites.length && (
        <StatePanel
          title="No matching suites"
          description="Try another industry or search term."
        />
      )}
    </main>
  )
}
