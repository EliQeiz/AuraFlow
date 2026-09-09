import { useSearchParams } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import { ChatThread } from '../../components/shared/ChatThread'
import { StatePanel } from '../../components/ui/StatePanel'
import { useAuth } from '../../context/AuthContext'
import { useProjects } from '../../hooks/useFirebase'

export default function Messages() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const projects = useProjects(user?.uid)
  const selected = projects.data.find(
    (project) => project.id === params.get('project'),
  )
  return (
    <>
      <div className="workspace-page-header">
        <div>
          <h1>Messages</h1>
          <p>Stay in touch with your AuraFlow team.</p>
        </div>
      </div>
      <div className="messages-layout">
        <aside className="thread-list">
          <button
            className="thread-item"
            aria-pressed={!selected}
            onClick={() => setParams({})}
          >
            <strong className="flex items-center gap-2">
              <MessageSquare size={14} />
              AuraFlow support
            </strong>
            <small>Questions, ideas, and getting started</small>
          </button>
          {projects.isPending ? (
            <StatePanel loading />
          ) : projects.error ? (
            <StatePanel
              error={projects.error}
              retry={() => void projects.refetch()}
            />
          ) : (
            projects.data.map((project) => (
              <button
                key={project.id}
                className="thread-item"
                aria-pressed={selected?.id === project.id}
                onClick={() => setParams({ project: project.id })}
              >
                <strong>{project.title}</strong>
                <small>{project.status}</small>
              </button>
            ))
          )}
        </aside>
        <ChatThread
          key={selected?.id || 'support'}
          id={selected?.id || user!.uid}
          support={!selected}
          title={selected?.title || 'AuraFlow support'}
        />
      </div>
    </>
  )
}
