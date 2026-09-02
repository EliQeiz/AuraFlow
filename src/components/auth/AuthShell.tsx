import { CheckCircle2, LockKeyhole, ShieldCheck, Sparkles, type LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { PropsWithChildren } from 'react'

const portalPoints = [
  'Private requests, files, previews, and chat',
  'Suite builder for schools, shops, restaurants, hotels, and apps',
  'Owner-only workspace with admin-reviewed progress',
]

export function AuthShell({
  children,
  eyebrow,
  footer,
  title,
}: PropsWithChildren<{
  eyebrow: string
  footer: string
  title: string
}>) {
  return (
    <section className="section-shell grid min-h-[calc(100svh-5rem)] items-center gap-6 py-10 lg:grid-cols-[0.88fr_1fr] lg:py-16">
      <motion.aside
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative hidden overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(145deg,rgba(108,99,255,.18),rgba(0,212,255,.06)_42%,rgba(5,5,16,.88))] p-6 shadow-aura lg:block"
      >
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute -bottom-28 left-8 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-2 font-orbitron text-xl font-black text-white">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-aura-gradient text-sm">AF</span>
            AuraFlow
          </Link>
          <p className="mt-16 text-sm font-bold uppercase tracking-[0.18em] text-cyan-100">{eyebrow}</p>
          <h2 className="mt-4 max-w-xl text-5xl font-extrabold leading-tight">Build the brief like a product team.</h2>
          <p className="mt-5 max-w-lg leading-8 text-aura-muted">
            Your portal turns ideas, files, references, colors, workflows, and revision notes into one private workspace AuraFlow can actually build from.
          </p>
          <div className="mt-8 grid gap-3">
            {portalPoints.map((point) => (
              <div key={point} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.06] p-3 text-sm text-aura-muted">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-100" />
                {point}
              </div>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3">
            <PortalMetric icon={LockKeyhole} label="Gated" value="client data" />
            <PortalMetric icon={ShieldCheck} label="Rules" value="owner/admin" />
            <PortalMetric icon={Sparkles} label="Studio" value="suite briefs" />
          </div>
        </div>
      </motion.aside>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-2xl overflow-hidden rounded-lg border border-white/10 bg-white/[0.075] shadow-2xl shadow-black/30 backdrop-blur-2xl"
      >
        <div className="border-b border-white/10 bg-black/20 px-5 py-4 sm:px-7">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-100">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">{title}</h1>
          <p className="mt-2 text-aura-muted">{footer}</p>
        </div>
        <div className="p-5 sm:p-7">{children}</div>
      </motion.div>
    </section>
  )
}

function PortalMetric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
      <Icon className="h-4 w-4 text-cyan-100" />
      <span className="mt-3 block text-xs text-aura-muted">{label}</span>
      <strong className="mt-1 block text-sm text-white">{value}</strong>
    </div>
  )
}
