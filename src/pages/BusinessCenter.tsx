import { useState, type FormEvent } from 'react'
import { ArrowRight, BadgeCheck, Building2, CalendarCheck, CheckCircle2, Globe2, GraduationCap, Layers3, LockKeyhole, UsersRound, type LucideIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { SEOHead } from '../components/shared/SEOHead'
import { Button, ButtonLink } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { studentBands, demoBookingSchema } from '../domain/business-center'
import { businessCenterApi } from '../lib/business-center'
import { asErrorMessage } from '../lib/utils'
import { useAuth } from '../context/AuthContext'

const highlights: Array<[string, string, LucideIcon]> = [
  ['Branded school portal', 'A dedicated school URL, logo, colours, public pages, and operational workspaces.', Globe2],
  ['Every school role', 'Separate workspaces for leadership, teachers, parents, learners, finance, HR, and support.', UsersRound],
  ['Operational core', 'Admissions, attendance, academics, reports, fees, communication, and school records in one system.', Layers3],
  ['Controlled launch', 'AuraFlow reviews each configuration, provisions it privately, and activates it only after checks pass.', LockKeyhole],
]

export default function BusinessCenter() {
  const { user } = useAuth()
  const [booking, setBooking] = useState(false)
  const [pending, setPending] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const parsed = demoBookingSchema.safeParse({
      fullName: form.get('fullName'), email: form.get('email'), phone: form.get('phone'), schoolName: form.get('schoolName'),
      roleTitle: form.get('roleTitle'), studentBand: form.get('studentBand'), message: form.get('message'),
    })
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message || 'Check the form and try again.'); return }
    setPending(true)
    try {
      await businessCenterApi({ action: 'book-demo', payload: parsed.data }, false)
      toast.success('Your school demo request is with AuraFlow.')
      setBooking(false)
    } catch (error) { toast.error(asErrorMessage(error)) } finally { setPending(false) }
  }
  return (
    <main className="business-center-public">
      <SEOHead title="AuraFlow Business Center" description="School operations software, provisioned securely for each institution." />
      <section className="bc-hero section-shell">
        <div className="bc-hero-copy">
          <p className="eyebrow"><span /> AuraFlow Business Center</p>
          <h1>Run your school on a platform built around it.</h1>
          <p className="bc-lede">Start with a guided school-management system, shape it around your campus, and launch on a secure branded school URL with AuraFlow beside you.</p>
          <div className="bc-actions">
            <Button onClick={() => setBooking(true)}>Book a school demo <ArrowRight /></Button>
            <ButtonLink variant="secondary" to={user ? '/dashboard/business-center' : '/register'}>{user ? 'Open Business Center' : 'Start school setup'} <ArrowRight /></ButtonLink>
          </div>
          <div className="bc-trust"><span><CheckCircle2 /> Guided onboarding</span><span><CheckCircle2 /> Role-based portals</span><span><CheckCircle2 /> Ghana-ready operations</span></div>
        </div>
        <div className="bc-hero-panel" aria-label="School operating system overview">
          <div className="bc-browser"><span /><span /><span /><strong>my-school.aura...</strong><BadgeCheck /></div>
          <div className="bc-portal-head"><div className="bc-school-mark">CS</div><div><strong>Campus operations</strong><small>First Term / Week 03</small></div><button type="button">School owner</button></div>
          <div className="bc-metric-grid"><Metric value="360" label="Learners on roll" /><Metric value="94%" label="Register today" /><Metric value="12" label="Actions to review" /></div>
          <div className="bc-workflow-row"><span><GraduationCap /> Admissions</span><span><CalendarCheck /> Attendance</span><span><Building2 /> Finance</span></div>
          <div className="bc-task-list"><strong>Priority actions</strong><p><i /> Review seven submitted admissions <ArrowRight /></p><p><i /> Complete Crest 4 attendance <ArrowRight /></p><p><i /> Publish end-of-term reports <ArrowRight /></p></div>
        </div>
      </section>
      <section className="bc-band"><div className="section-shell"><p>One platform. One accountable rollout. Your school’s own operating environment.</p></div></section>
      <section className="section-shell bc-section">
        <header className="bc-section-heading"><p className="eyebrow">What you receive</p><h2>A school system that starts useful and grows with you.</h2><p>Choose the operational modules your school needs now. Add others as your workflow grows, with data and access controlled per school.</p></header>
        <div className="bc-highlight-grid">{highlights.map(([title, copy, Icon]) => <article key={title as string} className="bc-highlight"><Icon /><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </section>
      <section className="bc-process"><div className="section-shell"><header className="bc-section-heading"><p className="eyebrow">A clear launch path</p><h2>From school brief to a system your team can use.</h2></header><div className="bc-process-grid"><Process number="01" title="Book discovery" copy="Tell us your school size, curriculum, priorities, and target launch date." /><Process number="02" title="Configure your school" copy="Set the brand, operating modules, roles, records, and school calendar in your private onboarding workspace." /><Process number="03" title="Provision & verify" copy="AuraFlow creates your tenant, owner access, secure storage, entitlements, and branded school URL." /><Process number="04" title="Go live with confidence" copy="Train staff, import reviewed records, and activate only after the configuration is checked." /></div></div></section>
      <section className="section-shell bc-cta"><div><p className="eyebrow">Start with a conversation</p><h2>Bring your school’s operating reality. We will shape the system around it.</h2></div><Button onClick={() => setBooking(true)}>Book a school demo <ArrowRight /></Button></section>
      <Modal open={booking} onOpenChange={setBooking} title="Book a school demo" description="Tell AuraFlow how your school works today. We will use this only to prepare the right discovery conversation.">
        <form className="bc-demo-form" onSubmit={submit}>
          <div className="bc-form-grid"><Field label="Your name"><Input name="fullName" required minLength={2} /></Field><Field label="Work email"><Input name="email" type="email" required /></Field></div>
          <div className="bc-form-grid"><Field label="School name"><Input name="schoolName" required minLength={2} /></Field><Field label="Your role"><Input name="roleTitle" required placeholder="Proprietor, headteacher..." /></Field></div>
          <div className="bc-form-grid"><Field label="Phone (optional)"><Input name="phone" type="tel" /></Field><Field label="Students"><Select name="studentBand">{studentBands.map((band) => <option key={band}>{band}</option>)}</Select></Field></div>
          <Field label="What should we understand before the call?"><Textarea name="message" maxLength={3000} placeholder="Admissions, fees, reports, parent communication, existing data..." /></Field>
          <Button type="submit" loading={pending}>Request demo <ArrowRight /></Button>
        </form>
      </Modal>
    </main>
  )
}
function Metric({ value, label }: { value: string; label: string }) { return <div><strong>{value}</strong><span>{label}</span></div> }
function Process({ number, title, copy }: { number: string; title: string; copy: string }) { return <article><span>{number}</span><h3>{title}</h3><p>{copy}</p></article> }
