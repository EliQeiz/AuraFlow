import { FolderKanban } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useAuth } from '../../context/AuthContext'
import { useProjects } from '../../hooks/useFirebase'

export default function MyProjects() {
  const { user } = useAuth()
  const { data: projects } = useProjects(user?.uid)

  return (
    <Card className="p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold">My Projects</h1>
          <p className="mt-2 text-aura-muted">Firestore project records associated with your account.</p>
        </div>
        <ButtonLink to="/quote">Start New Project</ButtonLink>
      </div>
      {projects.length ? (
        <div className="mt-6 overflow-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[34rem] text-left">
            <thead className="bg-white/[0.07] text-sm text-aura-muted">
              <tr>
                <th className="p-4">Project</th>
                <th className="p-4">Status</th>
                <th className="p-4">Deadline</th>
                <th className="p-4">Updated</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-t border-white/10">
                  <td className="p-4 font-bold text-white">{project.title}</td>
                  <td className="p-4"><Badge>{project.status}</Badge></td>
                  <td className="p-4 text-aura-muted">{project.deadline ?? 'TBD'}</td>
                  <td className="p-4 text-aura-muted">{project.updatedAt ?? 'Recently'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 grid place-items-center rounded-lg border border-dashed border-white/15 bg-black/20 p-10 text-center">
          <FolderKanban className="h-10 w-10 text-cyan-100" />
          <h2 className="mt-4 text-xl font-bold">No project records yet</h2>
          <p className="mt-2 text-aura-muted">A quote submission starts the next project conversation.</p>
        </div>
      )}
    </Card>
  )
}
