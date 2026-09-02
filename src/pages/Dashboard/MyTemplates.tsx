import { Eye, ServerCog, SlidersHorizontal, Sparkles, UploadCloud } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { suiteBlueprints } from '../../data/suiteBlueprints'
import { templates } from '../../data/templates'

export default function MyTemplates() {
  return (
    <div>
      <div className="mb-5">
        <Badge>Client Library</Badge>
        <h1 className="mt-4 text-3xl font-extrabold">Templates and suite systems inside the app.</h1>
        <p className="mt-2 max-w-3xl text-aura-muted">Use a visual template, start from a complete software suite, or upload your own design references in a private request.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink to="/dashboard/studio" variant="secondary" className="w-fit">
            <SlidersHorizontal className="h-4 w-4" />
            Open Prototype Studio
          </ButtonLink>
          <ButtonLink to="/dashboard/requests/new" variant="ghost" className="w-fit">
            <UploadCloud className="h-4 w-4" />
            Upload Own Reference
          </ButtonLink>
        </div>
      </div>
      <section className="mb-8">
        <h2 className="text-2xl font-bold">Software suite blueprints</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {suiteBlueprints.map((suite) => (
            <Card key={suite.id} className="group overflow-hidden">
              <img src={suite.image} alt={suite.title} className="aspect-video w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
              <div className="p-4">
                <div className="flex flex-wrap gap-2"><Badge>{suite.category}</Badge><Badge className="bg-white/[0.07] text-white">{suite.startingPrice}</Badge></div>
                <h3 className="mt-3 text-xl font-bold">{suite.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-aura-muted">{suite.summary}</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <ButtonLink to={`/solutions/${suite.slug}`} variant="secondary"><Eye className="h-4 w-4" /> Details</ButtonLink>
                  <ButtonLink to={`/dashboard/studio?suite=${suite.slug}`}><ServerCog className="h-4 w-4" /> Build</ButtonLink>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
      <h2 className="mb-4 text-2xl font-bold">Visual website templates</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="group overflow-hidden">
            <img src={template.previewImage} alt={template.name} className="aspect-video w-full object-cover transition duration-500 group-hover:scale-105" />
            <div className="p-4">
              <div className="flex flex-wrap gap-2"><Badge>{template.category}</Badge><Badge className="bg-white/[0.07] text-white">{template.subcategory}</Badge></div>
              <h2 className="mt-3 text-xl font-bold">{template.name}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-aura-muted">{template.longDescription}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <ButtonLink to={`/templates/${template.slug}`} variant="secondary"><Eye className="h-4 w-4" /> Preview</ButtonLink>
                <ButtonLink to={`/dashboard/requests/new?template=${template.slug}`}><Sparkles className="h-4 w-4" /> Use</ButtonLink>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
