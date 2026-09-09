import {
  ArrowLeft,
  ArrowUpRight,
  MessageSquare,
  Plus,
  Search,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ProjectWorkflow } from '../../components/shared/ProjectWorkflow'
import { useQuery } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useProjects } from '../../hooks/useFirebase'
import { usePrivateMedia } from '../../hooks/usePrivateMedia'
import { getFirebaseDb } from '../../lib/firebase'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { StatePanel } from '../../components/ui/StatePanel'
import { PrivateFile } from '../../components/shared/PrivateFile'
import { ProjectFileUploader } from '../../components/shared/ProjectFileUploader'
import { SuiteCanvas } from '../../components/shared/SuiteCanvas'
import { requestRevision } from '../../lib/firestore'
import { asErrorMessage } from '../../lib/utils'
import { displayDate, httpUrl, requestStatuses } from '../../domain/projects'
import type { ProjectRecord, RequestAsset } from '../../types'

export default function MyProjects() {
  const { user } = useAuth()
  const { id } = useParams()
  const projects = useProjects(user?.uid)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const detail = useQuery({
    queryKey: ['project', user?.uid, id],
    enabled: Boolean(id),
    queryFn: async () => {
      const snapshot = await getDoc(doc(getFirebaseDb(), 'projects', id!))
      if (!snapshot.exists()) throw new Error('Project not found.')
      return { ...snapshot.data(), id: snapshot.id } as ProjectRecord
    },
  })
  const selected =
    projects.data.find((project) => project.id === id) || detail.data
  if (id) {
    if (!selected && (detail.isPending || projects.isPending))
      return <StatePanel loading />
    if (!selected)
      return (
        <StatePanel
          error={detail.error || new Error('Project not found')}
          retry={() => void detail.refetch()}
        />
      )
    return (
      <ProjectDetail
        key={selected.id}
        project={selected}
        refresh={() => void detail.refetch()}
      />
    )
  }
  const filtered = projects.data.filter(
    (project) =>
      (!status || project.status === status) &&
      [project.title, project.projectType]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase()),
  )
  return (
    <>
      <div className="workspace-page-header">
        <div>
          <h1>Projects</h1>
          <p>Your briefs, deliveries, and everything in between.</p>
        </div>
        <ButtonLink to="/dashboard/requests/new">
          <Plus />
          New project
        </ButtonLink>
      </div>
      <div className="library-toolbar">
        <div className="search-field">
          <Search />
          <Input
            aria-label="Search projects"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          aria-label="Filter project status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {requestStatuses.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </Select>
      </div>
      {projects.isPending ? (
        <StatePanel loading />
      ) : projects.error ? (
        <StatePanel
          error={projects.error}
          retry={() => void projects.refetch()}
        />
      ) : filtered.length ? (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Status</th>
                <th>Type</th>
                <th>Updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((project) => (
                <tr key={project.id}>
                  <td>
                    <Link
                      className="row-link"
                      to={`/dashboard/requests/${project.id}`}
                    >
                      {project.title}
                    </Link>
                  </td>
                  <td>
                    <span className="status" data-status={project.status}>
                      {project.status}
                    </span>
                  </td>
                  <td>{project.projectType}</td>
                  <td>{displayDate(project.updatedAt)}</td>
                  <td>
                    <Link
                      className="icon-button"
                      aria-label={`Open ${project.title}`}
                      to={`/dashboard/requests/${project.id}`}
                    >
                      <ArrowUpRight />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <StatePanel
          title={
            search || status
              ? 'No matching projects'
              : 'Your projects will live here'
          }
          description="Create a brief to start working with our team."
          action={
            <ButtonLink to="/dashboard/requests/new" variant="secondary">
              Create project
            </ButtonLink>
          }
        />
      )}
    </>
  )
}
function ProjectDetail({
  project,
  refresh,
}: {
  project: ProjectRecord
  refresh: () => void
}) {
  const [params] = useSearchParams()
  const [tab, setTab] = useState(
    params.get('view') === 'workflow' ? 'Workflow' : 'Overview',
  )
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const logo = usePrivateMedia(project.design?.logoPath)
  const banner = usePrivateMedia(project.design?.bannerPath)
  async function revise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const note = String(new FormData(form).get('revision'))
    setPending(true)
    setError('')
    try {
      await requestRevision(project.id, note)
      form.reset()
      refresh()
      toast.success('Your revision request has been sent.')
    } catch (err) {
      setError(asErrorMessage(err))
    } finally {
      setPending(false)
    }
  }
  return (
    <>
      <Link
        className="inline-flex gap-2 items-center text-xs text-aura-muted mb-6"
        to="/dashboard/requests"
      >
        <ArrowLeft size={14} />
        All projects
      </Link>
      <div className="workspace-page-header">
        <div>
          <span className="status mb-3" data-status={project.status}>
            {project.status}
          </span>
          <h1>{project.title}</h1>
          <p>Submitted {displayDate(project.createdAt)}</p>
        </div>
        <ButtonLink
          to={`/dashboard/messages?project=${project.id}`}
          variant="secondary"
        >
          <MessageSquare />
          Message team
        </ButtonLink>
      </div>
      <div className="tab-bar" role="tablist" aria-label="Project views">
        {[
          'Overview',
          'Workflow',
          'Design',
          'Files',
          'Previews',
          'Request changes',
        ].map((value) => (
          <button
            role="tab"
            key={value}
            aria-selected={tab === value}
            onClick={() => setTab(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <div className="detail-grid">
        <section>
          {tab === 'Workflow' ? (
            <ProjectWorkflow project={project} />
          ) : tab === 'Overview' ? (
            <>
              {project.adminSummary && (
                <div className="inline-alert mb-6">
                  <strong className="block mb-2">Latest from AuraFlow</strong>
                  {project.adminSummary}
                </div>
              )}
              <h2 className="mb-4">Project brief</h2>
              <p className="detail-body">{project.description}</p>
              {project.referenceLinks?.length > 0 && (
                <div className="mt-8">
                  <h2 className="mb-4">References</h2>
                  {project.referenceLinks
                    .filter((url) => httpUrl.safeParse(url).success)
                    .map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-xs text-[var(--primary)] break-all mb-3"
                      >
                        {url}
                      </a>
                    ))}
                </div>
              )}
            </>
          ) : tab === 'Design' ? (
            project.design ? (
              <>
                <SuiteCanvas
                  draft={project.design}
                  website
                  bannerUrl={banner}
                  logoUrl={logo}
                />
                <p className="product-caption">
                  Submitted design snapshot · Example content
                </p>
              </>
            ) : (
              <StatePanel
                title="No studio design attached"
                description="This project began with a written brief. Design previews will appear in Previews."
              />
            )
          ) : tab === 'Files' ? (
            <div className="file-list">
              <ProjectFileUploader
                projectId={project.id}
                count={project.assets?.length || 0}
                onUploaded={refresh}
              />
              {project.assets?.length ? (
                project.assets.map((asset) => (
                  <PrivateFile asset={asset} key={asset.id} />
                ))
              ) : (
                <StatePanel
                  title="No source files yet"
                  description="Add your photos, brand assets, or documents above."
                />
              )}
            </div>
          ) : tab === 'Previews' ? (
            <>
              {[project.stagingUrl, project.productionUrl]
                .filter(
                  (url): url is string =>
                    Boolean(url) && httpUrl.safeParse(url).success,
                )
                .map((url) => (
                  <a
                    href={url}
                    key={url}
                    className="af-button af-button--secondary mb-5 mr-3"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open preview
                    <ArrowUpRight size={15} />
                  </a>
                ))}
              <div className="grid gap-5">
                {project.previews?.length ? (
                  project.previews.map((asset) => (
                    <PreviewFile asset={asset} key={asset.id} />
                  ))
                ) : (
                  <StatePanel
                    title="Your preview is on its way"
                    description="The team will share preview files and progress here when they are ready for review."
                  />
                )}
              </div>
            </>
          ) : (
            <form className="request-form" onSubmit={revise}>
              <h2>What would you like to change?</h2>
              <p className="field-hint">
                Mention the page or feature, and describe what should be added,
                removed, or adjusted.
              </p>
              <Textarea
                name="revision"
                aria-label="Requested changes"
                minLength={20}
                maxLength={4000}
                required
                className="min-h-40"
              />
              {error && (
                <p role="alert" className="inline-alert error">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                loading={pending}
                className="justify-self-start"
              >
                Send revision request
              </Button>
            </form>
          )}
        </section>
        <aside className="detail-meta">
          <dl>
            <div>
              <dt>Service</dt>
              <dd>{project.projectType}</dd>
            </div>
            <div>
              <dt>Target audience</dt>
              <dd>{project.audience}</dd>
            </div>
            <div>
              <dt>Budget</dt>
              <dd>USD {project.budget?.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Timeline</dt>
              <dd>{project.timeline}</dd>
            </div>
            <div>
              <dt>Agreed deadline</dt>
              <dd>{project.deadline || 'Not yet agreed'}</dd>
            </div>
            <div>
              <dt>Last updated</dt>
              <dd>{displayDate(project.updatedAt)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </>
  )
}
function PreviewFile({ asset }: { asset: RequestAsset }) {
  const source = usePrivateMedia(asset.path)
  return (
    <div>
      {source && asset.contentType?.startsWith('image/') && (
        <img
          src={source}
          alt={asset.name}
          className="rounded-md border border-[var(--line)] mb-3 w-full"
        />
      )}
      {source && asset.contentType?.startsWith('video/') && (
        <video src={source} controls className="w-full mb-3" />
      )}
      <PrivateFile asset={asset} />
    </div>
  )
}
