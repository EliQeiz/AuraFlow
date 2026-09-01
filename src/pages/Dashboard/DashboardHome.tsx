import { CalendarClock, FolderKanban, LayoutTemplate, MessageSquareMore, Sparkles } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useAuth } from '../../context/AuthContext'
import { useProjects } from '../../hooks/useFirebase'

const activity = [
  'Quote brief shared with AuraFlow',
  'Template shortlist updated',
  'Dashboard milestone prepared for review',
]

const sparkData = [
  { week: 'W1', velocity: 2 },
  { week: 'W2', velocity: 4 },
  { week: 'W3', velocity: 5 },
  { week: 'W4', velocity: 8 },
  { week: 'W5', velocity: 7 },
]

export default function DashboardHome() {
  const { profile, user } = useAuth()
  const { data: projects } = useProjects(user?.uid)
  const activeProjects = projects.filter((project) => !['Completed', 'On Hold'].includes(project.status))

  return (
    <div className="grid gap-4">
      <Card className="grid min-w-0 gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <p className="text-aura-muted">Welcome back</p>
          <h1 className="mt-2 text-3xl font-extrabold">{profile?.name ?? user?.displayName ?? 'AuraFlow Client'}</h1>
          <p className="mt-3 max-w-xl text-aura-muted">Projects, templates, and next actions stay in one calm place.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <ButtonLink to="/dashboard/requests/new">New Request</ButtonLink>
            <ButtonLink to="/dashboard/studio" variant="secondary">Prototype Studio</ButtonLink>
            <ButtonLink to="/dashboard/templates" variant="ghost">Browse Templates</ButtonLink>
            <ButtonLink to="/dashboard/requests" variant="ghost">Track Requests</ButtonLink>
            <ButtonLink to="/dashboard/messages" variant="ghost">
              <MessageSquareMore className="h-4 w-4" />
              Messages
            </ButtonLink>
          </div>
        </div>
        <div className="h-56 min-w-0 rounded-lg border border-white/10 bg-black/20 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id="velocity" x1="0" x2="0" y1="0" y2="1">
                  <stop stopColor="#00D4FF" stopOpacity={0.7} />
                  <stop offset="1" stopColor="#6C63FF" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" stroke="#A0A8C0" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#12122A', border: '1px solid rgba(255,255,255,.12)' }} />
              <Area dataKey="velocity" stroke="#00D4FF" fill="url(#velocity)" type="monotone" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat icon={FolderKanban} label="Active Projects" value={`${activeProjects.length || profile?.projectCount || 0}`} />
        <Stat icon={LayoutTemplate} label="Templates Saved" value={`${profile?.savedTemplates.length ?? 0}`} />
        <Stat icon={CalendarClock} label="Next Deadline" value={projects[0]?.deadline ?? 'Discovery'} />
      </div>

      <Card className="p-5">
        <h2 className="text-2xl font-bold">Recent activity</h2>
        <div className="mt-4 grid gap-3">
          {activity.map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.05] p-3 text-aura-muted">
              <Sparkles className="h-4 w-4 text-cyan-100" />
              {item}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: typeof FolderKanban; label: string; value: string }) {
  return (
    <Card className="p-5">
      <Icon className="h-5 w-5 text-cyan-100" />
      <p className="mt-4 text-sm text-aura-muted">{label}</p>
      <strong className="mt-2 block font-orbitron text-2xl text-white">{value}</strong>
    </Card>
  )
}
