import { Badge } from '../../components/ui/Badge'
import { ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useAuth } from '../../context/AuthContext'
import { templates } from '../../data/templates'

export default function MyTemplates() {
  const { profile } = useAuth()
  const saved = templates.filter((template) => profile?.savedTemplates.includes(template.slug))

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-3xl font-extrabold">My Templates</h1>
        <p className="mt-2 text-aura-muted">Saved or purchased template records appear here.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(saved.length ? saved : templates.slice(0, 3)).map((template) => (
          <Card key={template.id} className="overflow-hidden">
            <img src={template.previewImage} alt={template.name} className="aspect-video w-full object-cover" />
            <div className="p-4">
              <Badge>{saved.length ? 'Saved' : 'Preview'}</Badge>
              <h2 className="mt-3 text-xl font-bold">{template.name}</h2>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <ButtonLink to={`/templates/${template.slug}`} variant="secondary">Preview</ButtonLink>
                <ButtonLink to={`/quote?template=${template.slug}`}>Use Template</ButtonLink>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
