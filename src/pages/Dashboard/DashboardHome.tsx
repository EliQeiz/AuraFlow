import { ArrowRight, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ButtonLink } from '../../components/ui/Button'
import { StatePanel } from '../../components/ui/StatePanel'
import { useAuth } from '../../context/AuthContext'
import { suiteBlueprints } from '../../data/suiteBlueprints'
import { useProjects } from '../../hooks/useFirebase'
import { displayDate } from '../../domain/projects'
import { SuiteCover } from '../../components/shared/TemplateCover'

export default function DashboardHome() {
  const { profile, user } = useAuth()
  const projects = useProjects(user?.uid)
  const name = (profile?.name || user?.displayName || '').split(' ')[0]
  const active = projects.data.filter(
    (project) => !['Completed', 'On Hold'].includes(project.status),
  )
  const suites = suiteBlueprints.filter((suite) =>
    [
      'school-management-system',
      'ecommerce-storefront',
      'restaurant-ordering-booking',
      'hotel-lodge-guesthouse-booking',
    ].includes(suite.slug),
  )
  return (
    <>
      <div className="workspace-page-header">
        <div>
          <p className="eyebrow mb-3">Your workspace</p>
          <h1>{name ? `Good to see you, ${name}.` : 'Welcome to AuraFlow.'}</h1>
          <p>Make space for your next project.</p>
        </div>
        <ButtonLink to="/dashboard/requests/new">
          <Plus />
          New project
        </ButtonLink>
      </div>
      <div className="summary-strip">
        <div>
          <small>Active projects</small>
          <strong>{active.length}</strong>
        </div>
        <div>
          <small>Projects in review</small>
          <strong>
            {projects.data.filter((p) => p.status === 'Review').length}
          </strong>
        </div>
        <div>
          <small>Completed</small>
          <strong>
            {projects.data.filter((p) => p.status === 'Completed').length}
          </strong>
        </div>
        <div>
          <small>Saved templates</small>
          <strong>{profile?.savedTemplates?.length ?? 0}</strong>
        </div>
      </div>
      <div className="section-title-row">
        <h2>Your projects</h2>
        <Link to="/dashboard/requests">
          View all <ArrowRight size={13} className="inline ml-1" />
        </Link>
      </div>
      {projects.isPending ? (
        <StatePanel loading />
      ) : projects.error ? (
        <StatePanel
          error={projects.error}
          retry={() => void projects.refetch()}
        />
      ) : projects.data.length ? (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Status</th>
                <th>Type</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {projects.data.slice(0, 5).map((project) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-dashed border-[var(--line)] rounded-md">
          <StatePanel
            title="Your next idea starts here"
            description="Create a project brief or explore a template to make it your own."
            action={
              <ButtonLink to="/studio" variant="secondary">
                Open design studio
                <ArrowRight />
              </ButtonLink>
            }
          />
        </div>
      )}
      <div className="section-title-row mt-10">
        <h2>Start with a business suite</h2>
        <Link to="/dashboard/templates">
          Explore library <ArrowRight size={13} className="inline ml-1" />
        </Link>
      </div>
      <div className="workspace-suites">
        {suites.map((suite) => (
          <Link
            to={`/studio?suite=${suite.slug}`}
            className="workspace-suite"
            key={suite.slug}
          >
            <div className="suite-thumbnail">
              <SuiteCover suite={suite} />
            </div>
            <div className="workspace-suite-body">
              <h3>
                {suite.category === 'School Management'
                  ? 'School management'
                  : suite.title}
              </h3>
              <p>{suite.modules.length} modules · Configurable prototype</p>
            </div>
          </Link>
        ))}
      </div>
      {projects.data.length > 0 && (
        <>
          <div className="section-title-row">
            <h2>Recent updates</h2>
            <Link to="/dashboard/activity">
              Activity inbox <ArrowRight size={13} className="inline ml-1" />
            </Link>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {projects.data.slice(0, 4).map((project) => (
              <Link
                key={project.id}
                to={`/dashboard/requests/${project.id}`}
                className="flex justify-between gap-4 py-4 text-xs"
              >
                <span>
                  {project.adminSummary ||
                    `${project.title} is ${project.status.toLowerCase()}.`}
                </span>
                <span className="text-aura-muted shrink-0">
                  {displayDate(project.updatedAt)}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  )
}
