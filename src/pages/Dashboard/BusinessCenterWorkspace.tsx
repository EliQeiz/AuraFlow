import { useMemo, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, Building2, Check, CircleDashed, Clock3, Globe2, Plus, ShieldCheck, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { StatePanel } from '../../components/ui/StatePanel'
import { useAuth } from '../../context/AuthContext'
import { provisioningRequestSchema, schoolModuleOptions, staffBands, studentBands, tenantPlans, type BusinessCenterRequest } from '../../domain/business-center'
import { businessCenterApi } from '../../lib/business-center'
import { asErrorMessage } from '../../lib/utils'

export default function BusinessCenterWorkspace() {
  const { user, admin } = useAuth()
  const [open, setOpen] = useState(false)
  const requests = useQuery({ queryKey: ['business-center-requests', user?.uid, admin], queryFn: () => businessCenterApi<BusinessCenterRequest[]>({ action: 'list' }) })
  return <>
    <div className="workspace-page-header bc-workspace-heading"><div><span className="eyebrow">AuraFlow Business Center</span><h1>{admin ? 'School provisioning control' : 'Your school launch workspace'}</h1><p>{admin ? 'Review qualified schools, reserve their tenant, and record each controlled activation step.' : 'Configure the school system you need. AuraFlow reviews the brief before reserving any school URL.'}</p></div>{!admin && <Button onClick={() => setOpen(true)}><Plus /> Start a school setup</Button>}</div>
    {admin && <AdminSignal requests={requests.data ?? []} />}
    {requests.isPending ? <StatePanel loading /> : requests.error ? <StatePanel error={requests.error} description={asErrorMessage(requests.error)} retry={() => void requests.refetch()} /> : !requests.data?.length ? <StatePanel title={admin ? 'No school setups waiting' : 'Start with your school brief'} description={admin ? 'New demo and provisioning requests will appear here after qualification.' : 'Your school stays private while AuraFlow reviews the operating setup and launch path.'} action={!admin ? <Button onClick={() => setOpen(true)}><Plus /> Start school setup</Button> : undefined} /> : <div className="bc-request-grid">{requests.data.map((request) => <RequestCard key={request.id} request={request} admin={admin} refresh={() => void requests.refetch()} />)}</div>}
    <ProvisioningForm open={open} setOpen={setOpen} refresh={() => void requests.refetch()} />
  </>
}

function AdminSignal({ requests }: { requests: BusinessCenterRequest[] }) {
  const pending = requests.filter((request) => ['submitted', 'discovery', 'approved'].includes(request.status)).length
  const provisioned = requests.filter((request) => request.tenantId).length
  return <div className="bc-admin-signal"><div><CircleDashed /><span><strong>{pending}</strong><small>Awaiting a decision</small></span></div><div><Building2 /><span><strong>{provisioned}</strong><small>Tenants provisioned</small></span></div><div><ShieldCheck /><span><strong>Manual</strong><small>Domain verification gate</small></span></div></div>
}

function RequestCard({ request, admin, refresh }: { request: BusinessCenterRequest; admin: boolean; refresh: () => void }) {
  const [note, setNote] = useState(request.adminNote)
  const [pending, setPending] = useState(false)
  const [provisioning, setProvisioning] = useState(false)
  const [tenantSlug, setTenantSlug] = useState(request.preferredSlug)
  const [plan, setPlan] = useState('trial')
  const [lifecycle, setLifecycle] = useState('')
  const stateLabel = request.status.replace('-', ' ')
  async function call(command: Record<string, unknown>, message: string) { setPending(true); try { await businessCenterApi(command); toast.success(message); refresh() } catch (error) { toast.error(asErrorMessage(error)) } finally { setPending(false) } }
  return <article className="bc-request-card"><header><div><span className={`bc-state bc-state--${request.status}`}>{stateLabel}</span><h2>{request.schoolName}</h2><p>{request.schoolType} / {request.curriculum}</p></div>{request.tenantLifecycle && <span className="bc-tenant-life"><Globe2 /> {request.tenantLifecycle}</span>}</header>
    <dl><div><dt>Preferred URL</dt><dd>{request.hostname || `${request.preferredSlug}.<base-domain>`}</dd></div><div><dt>School size</dt><dd>{request.studentBand} students / {request.staffBand} staff</dd></div><div><dt>Requested modules</dt><dd>{request.requestedModules.length ? request.requestedModules.join(', ') : 'Core school system'}</dd></div>{request.launchTarget && <div><dt>Target launch</dt><dd>{request.launchTarget}</dd></div>}{admin && request.ownerEmail && <div><dt>Owner</dt><dd>{request.ownerEmail}</dd></div>}</dl>
    {request.notes && <p className="bc-request-notes">{request.notes}</p>}
    {admin ? <div className="bc-admin-actions"><Field label="Internal review note"><Textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={6000} /></Field><div className="bc-action-row">{nextStates(request.status).map((status) => <Button key={status} variant="secondary" loading={pending} onClick={() => void call({ action: 'advance', id: request.id, status, note }, `School setup marked ${status}.`)}>{status === 'approved' ? <Check /> : <Clock3 />}{status}</Button>)}</div>{request.status === 'approved' && !request.tenantId && <><button className="bc-inline-toggle" type="button" onClick={() => setProvisioning(!provisioning)}>{provisioning ? 'Close provisioning controls' : 'Reserve tenant and create owner workspace'} <ArrowUpRight /></button>{provisioning && <div className="bc-provision-box"><Field label="Tenant subdomain"><Input value={tenantSlug} onChange={(event) => setTenantSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} /></Field><Field label="Initial plan"><Select value={plan} onChange={(event) => setPlan(event.target.value)}>{tenantPlans.map((entry) => <option key={entry}>{entry}</option>)}</Select></Field><Button loading={pending} onClick={() => void call({ action: 'provision', id: request.id, tenantSlug, plan }, 'Tenant reserved. Complete DNS and launch checks before activation.')}><Sparkles /> Provision tenant</Button></div>}</>}{request.tenantId && <div className="bc-lifecycle"><p>Only use these controls after completing the external hosting, DNS, and access checks.</p><Select aria-label="Tenant lifecycle" value={lifecycle} onChange={(event) => setLifecycle(event.target.value)}><option value="">Choose verified lifecycle step</option>{tenantLifecycleOptions(request.tenantLifecycle).map((entry) => <option key={entry} value={entry}>{entry}</option>)}</Select><Button variant="secondary" loading={pending} disabled={!lifecycle} onClick={() => void call({ action: 'tenant-lifecycle', tenantId: request.tenantId, lifecycle, note: note || `Administrator moved tenant to ${lifecycle} after manual checks.` }, `Tenant marked ${lifecycle}.`)}>Save lifecycle</Button></div>}</div> : <footer><span>Submitted {new Date(request.createdAt).toLocaleDateString()}</span><span>{clientStatusCopy(request.status)}</span></footer>}</article>
}

function nextStates(status: BusinessCenterRequest['status']) { const options: Partial<Record<BusinessCenterRequest['status'], BusinessCenterRequest['status'][]>> = { submitted: ['discovery', 'approved', 'declined'], discovery: ['approved', 'declined'], approved: ['declined'] }; return options[status] ?? [] }
function tenantLifecycleOptions(current?: string) { return current === 'provisioning' ? ['ready', 'suspended'] : current === 'ready' ? ['active', 'suspended'] : current === 'active' ? ['suspended', 'archived'] : current === 'suspended' ? ['active', 'archived'] : [] }
function clientStatusCopy(status: string) { return ({ submitted: 'Awaiting AuraFlow review', discovery: 'Discovery in progress', approved: 'Ready for tenant preparation', provisioning: 'Tenant preparation in progress', ready: 'School environment verified', declined: 'Contact AuraFlow for next steps', cancelled: 'Setup cancelled' } as Record<string, string>)[status] || status }

function ProvisioningForm({ open, setOpen, refresh }: { open: boolean; setOpen: (value: boolean) => void; refresh: () => void }) {
  const [pending, setPending] = useState(false)
  const [selectedModules, setSelectedModules] = useState<string[]>(['Admissions & enrolment', 'Attendance', 'Assessment & report cards', 'Fees & Mobile Money'])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget)
    const parsed = provisioningRequestSchema.safeParse({ schoolName: form.get('schoolName'), preferredSlug: form.get('preferredSlug'), schoolType: form.get('schoolType'), studentBand: form.get('studentBand'), staffBand: form.get('staffBand'), curriculum: form.get('curriculum'), launchTarget: form.get('launchTarget'), requestedModules: selectedModules, branding: { primaryColor: form.get('primaryColor'), logoDirection: form.get('logoDirection') }, notes: form.get('notes') })
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message || 'Check the school setup details.'); return }
    setPending(true); try { await businessCenterApi({ action: 'request-provisioning', payload: parsed.data }); toast.success('Your private school setup is ready for AuraFlow review.'); setOpen(false); refresh() } catch (error) { toast.error(asErrorMessage(error)) } finally { setPending(false) }
  }
  const selected = useMemo(() => new Set(selectedModules), [selectedModules])
  return <Modal open={open} onOpenChange={setOpen} title="Start a school setup" description="This creates a private provisioning brief. It does not publish a school URL, charge a plan, or move existing school data."><form className="bc-provision-form" onSubmit={submit}><div className="bc-form-grid"><Field label="School name"><Input name="schoolName" required minLength={2} /></Field><Field label="Preferred subdomain"><Input name="preferredSlug" required minLength={3} placeholder="crestview-school" pattern="[a-z0-9][a-z0-9-]{2,62}" /></Field></div><div className="bc-form-grid"><Field label="School type"><Select name="schoolType"><option>Basic school</option><option>Senior high school</option><option>International school</option><option>College / training institute</option><option>Multi-campus school group</option></Select></Field><Field label="Curriculum"><Input name="curriculum" required defaultValue="GES" /></Field></div><div className="bc-form-grid"><Field label="Students"><Select name="studentBand">{studentBands.map((band) => <option key={band}>{band}</option>)}</Select></Field><Field label="Staff"><Select name="staffBand">{staffBands.map((band) => <option key={band}>{band}</option>)}</Select></Field></div><Field label="Target launch"><Input name="launchTarget" type="date" /></Field><fieldset className="bc-module-select"><legend>Choose the operating modules you want to discuss</legend>{schoolModuleOptions.map((module) => <label key={module}><input type="checkbox" checked={selected.has(module)} onChange={() => setSelectedModules((values) => values.includes(module) ? values.filter((item) => item !== module) : [...values, module])} />{module}</label>)}</fieldset><div className="bc-form-grid"><Field label="Primary colour"><Input name="primaryColor" type="color" defaultValue="#5f55e8" /></Field><Field label="Logo direction"><Input name="logoDirection" placeholder="Existing crest, text logo, new mark..." /></Field></div><Field label="Operational notes"><Textarea name="notes" maxLength={6000} placeholder="Current processes, data to migrate, parent communication, payment needs, reporting..." /></Field><Button type="submit" loading={pending}>Submit school brief <ArrowUpRight /></Button></form></Modal>
}
