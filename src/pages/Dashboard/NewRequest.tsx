import {
  Check,
  File,
  Trash2,
  UploadCloud,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { StatePanel } from '../../components/ui/StatePanel'
import { useAuth } from '../../context/AuthContext'
import { services } from '../../data/services'
import { suiteBlueprints } from '../../data/suiteBlueprints'
import { templates } from '../../data/templates'
import { draftSchema, type StudioDraft } from '../../domain/studio'
import { requestSchema } from '../../domain/projects'
import { getFirebaseDb } from '../../lib/firebase'
import { createProjectRequest, attachProjectAsset } from '../../lib/firestore'
import { validateMedia, uploadPrivateMedia } from '../../lib/media'
import { asErrorMessage } from '../../lib/utils'
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges'

export default function NewRequest() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const draftId = params.get('draft')
  const draft = useQuery({
    queryKey: ['brief-draft', user?.uid, draftId],
    enabled: Boolean(draftId),
    queryFn: async () => {
      const snapshot = await getDoc(
        doc(getFirebaseDb(), 'users', user!.uid, 'drafts', draftId!),
      )
      if (!snapshot.exists()) throw new Error('Design not found.')
      return draftSchema.parse(snapshot.data())
    },
  })
  if (draftId && draft.isPending) return <StatePanel loading />
  if (draftId && draft.error)
    return <StatePanel error={draft.error} retry={() => void draft.refetch()} />
  return (
    <RequestForm
      key={draftId || params.get('suite') || params.get('template') || 'new'}
      draft={draft.data}
    />
  )
}
function RequestForm({ draft }: { draft?: StudioDraft }) {
  const { user, profile } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const chosen = suiteBlueprints.find(
    (s) =>
      s.slug ===
      (draft?.suiteSlug || params.get('suite') || params.get('solution')),
  )
  const template = templates.find((t) => t.slug === params.get('template'))
  const [requestId] = useState(() => crypto.randomUUID())
  const [step, setStep] = useState(0)
  const [pending, setPending] = useState(false)
  const [created, setCreated] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [accepted, setAccepted] = useState(false)
  const [form, setForm] = useState({
    title: draft?.name || '',
    projectType: chosen?.title || params.get('service') || '',
    description: draft
      ? [
          draft.description,
          draft.notes,
          `Modules: ${draft.modules.join(', ')}. Pages: ${draft.pages.join(', ')}.`,
        ]
          .filter(Boolean)
          .join('\n\n')
      : '',
    audience: chosen?.audience || '',
    budget: params.get('budget') || '500',
    timeline: 'Flexible',
    referenceLinks: '',
  })
  useUnsavedChanges(
    !created && (Boolean(form.title || form.description) || files.length > 0),
  )
  function payload() {
    return requestSchema.parse({
      ...form,
      budget: Number(form.budget),
      userId: user!.uid,
      clientName: profile?.name || user!.displayName || 'Client',
      clientEmail: user!.email,
      referenceLinks: form.referenceLinks
        .split(/\r?\n/)
        .map((value) => value.trim())
        .filter(Boolean),
      templateSlug: template?.slug,
      solutionSlug: chosen?.slug,
      platformMode:
        params.get('mode') === 'managed-hosted'
          ? 'managed-hosted'
          : 'custom-build',
      ...(draft ? { design: draft, designDraftId: params.get('draft') } : {}),
    })
  }
  function advance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    try {
      payload()
      setStep((current) => current + 1)
    } catch (err) {
      setError(asErrorMessage(err))
    }
  }
  function selectFiles(list: FileList | null) {
    if (!list) return
    try {
      const next = [...files, ...Array.from(list)]
      if (next.length > 8) throw new Error('Attach up to 8 files.')
      next.forEach((file) => validateMedia(file))
      setFiles(next)
    } catch (err) {
      setError(asErrorMessage(err))
    }
  }
  async function submit() {
    if (!accepted) {
      setError('Please confirm you have permission to share the content.')
      return
    }
    setPending(true)
    setError('')
    let requestCreated = created
    try {
      const valid = payload()
      await createProjectRequest(valid, requestId)
      requestCreated = true
      setCreated(true)
      const designPaths = draft
        ? [draft.logoPath, draft.bannerPath, ...draft.mediaPaths].filter(
            Boolean,
          )
        : []
      for (const path of [...new Set(designPaths)])
        await attachProjectAsset(requestId, {
          id: path.split('/').at(-1)!,
          name: path.split('/').at(-1)!.slice(37),
          path,
          url: '',
          kind: 'reference',
          uploadedBy: user!.uid,
        })
      for (let index = 0; index < files.length; index++) {
        const file = files[index]
        const path = `projects/${user!.uid}/${requestId}/references/${index}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_').slice(-100)}`
        await uploadPrivateMedia(path, file, (percent) =>
          setProgress(`Uploading ${index + 1} of ${files.length}: ${percent}%`),
        )
        await attachProjectAsset(requestId, {
          id: `asset-${index}`,
          name: file.name,
          path,
          url: '',
          contentType: file.type,
          kind: 'reference',
          uploadedBy: user!.uid,
        })
      }
      toast.success('Your project has been submitted.')
      navigate(`/dashboard/requests/${requestId}`, { replace: true })
    } catch (err) {
      setError(
        `${requestCreated ? 'Your project was created. You can retry the remaining uploads. ' : ''}${asErrorMessage(err)}`,
      )
    } finally {
      setPending(false)
      setProgress('')
    }
  }
  const edit = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }))
  return (
    <div className="max-w-3xl mx-auto">
      <div className="workspace-page-header">
        <div>
          <h1>New project</h1>
          <p>
            {draft
              ? `Design attached: ${draft.name}`
              : template
                ? `Starting with ${template.name}`
                : 'Tell us what you would like to build.'}
          </p>
        </div>
      </div>
      <ol className="request-steps">
        {['Project details', 'Files & references', 'Review & submit'].map(
          (label, index) => (
            <li key={label} aria-current={step === index ? 'step' : undefined}>
              <span>{index < step ? <Check size={13} /> : index + 1}</span>
              {label}
            </li>
          ),
        )}
      </ol>
      {error && (
        <p className="inline-alert error mb-5" role="alert">
          {error}
        </p>
      )}
      {step === 0 ? (
        <form className="request-form" onSubmit={advance}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Project name">
              <Input
                value={form.title}
                onChange={(e) => edit('title', e.target.value)}
                minLength={2}
                maxLength={180}
                required
                placeholder="Your business or project name"
              />
            </Field>
            <Field label="What are we building?">
              <Select
                value={form.projectType}
                onChange={(e) => edit('projectType', e.target.value)}
                required
              >
                <option value="">Choose a type</option>
                {[
                  ...new Set([
                    ...suiteBlueprints.map((s) => s.title),
                    ...services.map((s) => s.title),
                    'Custom software',
                  ]),
                ].map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field
            label="Project description"
            hint="Include the pages, features, and workflows that matter most."
          >
            <Textarea
              value={form.description}
              onChange={(e) => edit('description', e.target.value)}
              required
              minLength={40}
              maxLength={12000}
              className="min-h-40"
            />
          </Field>
          <Field label="Who is it for?">
            <Input
              value={form.audience}
              onChange={(e) => edit('audience', e.target.value)}
              maxLength={800}
              required
              placeholder="Customers, students, staff, or another audience"
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Estimated budget (USD)">
              <Input
                type="number"
                value={form.budget}
                onChange={(e) => edit('budget', e.target.value)}
                min={39}
                max={100000}
                required
              />
            </Field>
            <Field label="Preferred timeline">
              <Select
                value={form.timeline}
                onChange={(e) => edit('timeline', e.target.value)}
              >
                <option>Flexible</option>
                <option>Within a month</option>
                <option>Within 3 months</option>
                <option>Urgent - discuss with our team</option>
              </Select>
            </Field>
          </div>
          <div className="flex justify-end">
            <Button type="submit">
              Continue
              <ArrowRight />
            </Button>
          </div>
        </form>
      ) : step === 1 ? (
        <form className="request-form" onSubmit={advance}>
          <Field
            label="Reference links"
            hint="One full website URL per line. Up to 8 links."
          >
            <Textarea
              value={form.referenceLinks}
              onChange={(e) => edit('referenceLinks', e.target.value)}
              placeholder="https://example.com"
            />
          </Field>
          <label className="upload-zone">
            <UploadCloud size={24} />
            <strong>Add your files</strong>
            <span>
              Photos, videos, branding, documents, or a design you love.
            </span>
            <span>Up to 8 files, 50 MB per file.</span>
            <Input
              type="file"
              multiple
              aria-label="Project files"
              accept=".jpg,.jpeg,.png,.webp,.avif,.gif,.mp4,.webm,.pdf,.docx,.xlsx,.pptx,.txt,.csv,.zip"
              onChange={(e) => selectFiles(e.target.files)}
            />
          </label>
          {files.map((file, index) => (
            <div className="file-row" key={index}>
              <File size={16} />
              <span>
                {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
              </span>
              <button
                type="button"
                className="icon-button"
                aria-label={`Remove ${file.name}`}
                onClick={() =>
                  setFiles((current) => current.filter((_, i) => i !== index))
                }
              >
                <Trash2 />
              </button>
            </div>
          ))}
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(0)}>
              <ArrowLeft />
              Back
            </Button>
            <Button type="submit">
              Review project
              <ArrowRight />
            </Button>
          </div>
        </form>
      ) : (
        <div className="request-form">
          <div className="review-brief">
            <h2>{form.title}</h2>
            <p>{form.projectType}</p>
            <div className="detail-body">{form.description}</div>
            <dl>
              <div>
                <dt>Audience</dt>
                <dd>{form.audience}</dd>
              </div>
              <div>
                <dt>Budget</dt>
                <dd>USD {Number(form.budget).toLocaleString()}</dd>
              </div>
              <div>
                <dt>Timeline</dt>
                <dd>{form.timeline}</dd>
              </div>
              <div>
                <dt>Attachments</dt>
                <dd>
                  {files.length} files{draft ? ' + saved design' : ''}
                </dd>
              </div>
            </dl>
          </div>
          <label className="check-label">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span>
              I have permission to share this content with AuraFlow. I
              understand that the final scope and price will be agreed with the
              team.
            </span>
          </label>
          {progress && (
            <p role="status" className="field-hint">
              {progress}
            </p>
          )}
          <div className="flex flex-wrap justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => setStep(1)}
              disabled={pending || created}
            >
              <ArrowLeft />
              Back
            </Button>
            <Button loading={pending} onClick={submit}>
              {created ? 'Retry file uploads' : 'Submit project'}
            </Button>
          </div>
          {created && error && (
            <ButtonLink
              to={`/dashboard/requests/${requestId}`}
              variant="secondary"
            >
              Open submitted project
            </ButtonLink>
          )}
        </div>
      )}
    </div>
  )
}
