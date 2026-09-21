import { useMemo, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowUpRight,
  Check,
  Copy,
  Download,
  GraduationCap,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShoppingBag,
  Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { StatePanel } from '../../components/ui/StatePanel'
import { Modal } from '../../components/ui/Modal'
import { businessApi } from '../../lib/business'
import { asErrorMessage } from '../../lib/utils'
import {
  businessSettingsSchema,
  canTransitionOrder,
  money,
  orderStates,
  studentSchema,
  type Attendance,
  type Business,
  type BusinessSettings,
  type Student,
  type WorkspaceData,
} from '../../domain/business'
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges'

export default function BusinessSystems() {
  const { user, admin } = useAuth()
  const [params, setParams] = useSearchParams()
  const id = params.get('business') || ''
  const list = useQuery({
    queryKey: ['businesses', user!.uid],
    queryFn: () => businessApi<Business[]>({ action: 'list' }),
  })
  const workspace = useQuery({
    queryKey: ['business-workspace', user!.uid, id],
    enabled: Boolean(id),
    queryFn: () => businessApi<WorkspaceData>({ action: 'workspace', id }),
    refetchOnWindowFocus: false,
  })
  const [creating, setCreating] = useState(false)
  const [selectedTab, setSelectedTab] = useState('Setup')
  const [pending, setPending] = useState(false)
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true)
    try {
      const business = await businessApi<Business>({
        action: 'create',
        id: crypto.randomUUID(),
        name: form.get('name'),
        phone: form.get('phone'),
        kind: form.get('kind'),
      })
      await list.refetch()
      setParams({ business: business.id })
      setCreating(false)
      toast.success('Business workspace created.')
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setPending(false)
    }
  }
  return (
    <>
      <div className="workspace-page-header">
        <div>
          <h1>Business systems</h1>
          <p>
            {admin
              ? 'Review and manage hosted client businesses.'
              : 'Configure your business and manage its daily operations.'}
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus />
          New business
        </Button>
      </div>
      {list.isPending ? (
        <StatePanel loading />
      ) : list.error ? (
        <StatePanel
          error={list.error}
          description={asErrorMessage(list.error)}
          retry={() => void list.refetch()}
        />
      ) : (
        <>
          <div className="business-toolbar">
            <Select
              aria-label="Select business"
              value={id}
              onChange={(e) =>
                setParams(e.target.value ? { business: e.target.value } : {})
              }
            >
              <option value="">All business systems</option>
              {list.data?.map((b) => (
                <option key={b.id} value={b.id}>
                  {businessName(b)} / {b.kind} / {b.status}
                </option>
              ))}
            </Select>
            <Button
              variant="secondary"
              onClick={() => {
                void list.refetch()
                if (id) void workspace.refetch()
              }}
            >
              <RefreshCw />
              Refresh
            </Button>
          </div>
          {!id ? (
            <div className="business-directory">
              {list.data?.length ? (
                list.data.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setParams({ business: b.id })}
                  >
                    {b.kind === 'school' ? <GraduationCap /> : <ShoppingBag />}
                    <span>
                      <strong>{businessName(b)}</strong>
                      <small>
                        {b.kind === 'school'
                          ? 'School operations'
                          : 'Restaurant ordering'}
                      </small>
                    </span>
                    <span className="business-status">{b.status}</span>
                    <ArrowUpRight />
                  </button>
                ))
              ) : (
                <StatePanel
                  title="Your first business system"
                  description="Create a school or restaurant workspace. Public access requires AuraFlow activation."
                />
              )}
            </div>
          ) : workspace.isPending ? (
            <StatePanel loading />
          ) : workspace.error ? (
            <StatePanel
              error={workspace.error}
              description={asErrorMessage(workspace.error)}
              retry={() => void workspace.refetch()}
            />
          ) : workspace.data ? (
            <BusinessEditor
              key={`${id}:${workspace.data.business.revision}`}
              data={workspace.data}
              admin={admin}
              selectedTab={selectedTab}
              setTab={setSelectedTab}
              refresh={async () => {
                await workspace.refetch()
                await list.refetch()
              }}
            />
          ) : null}
        </>
      )}
      <Modal
        open={creating}
        onOpenChange={setCreating}
        title="Create a business system"
        description="Start privately. AuraFlow reviews each system before public activation."
      >
        <form onSubmit={create} className="business-form">
          <Field label="Business name">
            <Input name="name" required minLength={2} maxLength={120} />
          </Field>
          <Field label="System">
            <Select name="kind">
              <option value="restaurant">Restaurant ordering</option>
              <option value="school">School management</option>
            </Select>
          </Field>
          <Field label="Business phone">
            <Input
              name="phone"
              type="tel"
              required
              placeholder="+233..."
              pattern="\+[1-9][0-9]{7,14}"
            />
          </Field>
          <Button type="submit" loading={pending}>
            Create workspace
          </Button>
        </form>
      </Modal>
    </>
  )
}

function businessName(business: Business) {
  return business.settings?.name || 'Untitled business'
}

function cloneSettings(settings: BusinessSettings) {
  return JSON.parse(JSON.stringify(settings)) as BusinessSettings
}

function BusinessEditor({
  data,
  admin,
  refresh,
  selectedTab,
  setTab,
}: {
  data: WorkspaceData
  admin: boolean
  refresh: () => Promise<void>
  selectedTab: string
  setTab: (tab: string) => void
}) {
  const { business } = data
  const baseline = useMemo(
    () => JSON.stringify(business.settings),
    [business.settings],
  )
  const [settings, setSettings] = useState(() =>
    cloneSettings(business.settings),
  )
  const [changed, setChanged] = useState(false)
  const [pending, setPending] = useState(false)
  const [search, setSearch] = useState('')
  const [student, setStudent] = useState<Student | null>(null)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [marks, setMarks] = useState<
    Record<string, Attendance['entries'][number]['state']>
  >({})
  const dirty = changed || JSON.stringify(settings) !== baseline
  useUnsavedChanges(dirty || Boolean(student) || Object.keys(marks).length > 0)
  const school = business.kind === 'school'
  const tabs = school
    ? ['Setup', 'Students', 'Attendance', 'Activity']
    : ['Setup', 'Menu', 'Orders', 'WhatsApp', 'Activity']
  const tab = tabs.includes(selectedTab) ? selectedTab : 'Setup'
  const update = (change: Partial<BusinessSettings>) => {
    setChanged(true)
    setSettings((s) => ({ ...s, ...change }))
  }
  async function run(command: Record<string, unknown>, message: string) {
    if (dirty && command.action !== 'configure') {
      toast.error('Save your configuration changes before continuing.')
      return false
    }
    setPending(true)
    try {
      await businessApi({ ...command, id: business.id })
      toast.success(message)
      setStudent(null)
      setMarks({})
      await refresh()
      return true
    } catch (error) {
      toast.error(asErrorMessage(error))
      return false
    } finally {
      setPending(false)
    }
  }
  async function save() {
    const parsed = businessSettingsSchema.safeParse(settings)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message)
      return
    }
    await run(
      {
        action: 'configure',
        settings: parsed.data,
        revision: business.revision,
      },
      'Business configuration saved.',
    )
  }
  const publicUrl = `${window.location.origin}/b/${business.id}`
  const visibleStudents = data.students.filter((s) =>
    `${s.name} ${s.admissionNumber} ${s.className}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )
  const existingAttendance = data.attendance.find((a) => a.date === date)
  function downloadRoster() {
    const columns = [
      'Admission number',
      'Name',
      'Class',
      'Guardian',
      'Phone',
      'Active',
    ]
    const escape = (value: string) =>
      `"${(/^[=+@\-\t\r]/.test(value) ? "'" : '') + value.replaceAll('"', '""')}"`
    const csv = [
      columns,
      ...data.students.map((s) => [
        s.admissionNumber,
        s.name,
        s.className,
        s.guardianName,
        s.guardianPhone,
        String(s.active),
      ]),
    ]
      .map((row) => row.map(escape).join(','))
      .join('\r\n')
    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = 'student-register.csv'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <fieldset className="business-workspace" disabled={pending}>
      <header className="business-heading">
        <div>
          <span className="business-status">{business.status}</span>
          <h2>{business.settings.name}</h2>
          <p>
            {school
              ? `${data.students.filter((s) => s.active).length} active students`
              : `${data.orders.filter((o) => !['completed', 'cancelled'].includes(o.status)).length} open orders`}
          </p>
        </div>
        <div className="page-actions">
          <Link
            className="af-button af-button--secondary"
            to={`/studio?suite=${school ? 'school-management-system' : 'restaurant-ordering-booking'}`}
          >
            Design studio
            <ArrowUpRight />
          </Link>
          {business.status !== 'active' && (
            <Link
              className="af-button af-button--secondary"
              to={`/b/${business.id}?preview=1`}
            >
              Preview website
              <ArrowUpRight />
            </Link>
          )}
          {business.status === 'active' && (
            <Link
              target="_blank"
              className="af-button af-button--secondary"
              to={`/b/${business.id}`}
            >
              Open website
              <ArrowUpRight />
            </Link>
          )}
        </div>
      </header>
      {business.status !== 'active' && (
        <div className="inline-alert">
          {business.status === 'draft'
            ? 'Private setup. Complete your configuration, then contact AuraFlow for activation.'
            : 'Public access is suspended. Contact AuraFlow for assistance.'}
          <Link to="/dashboard/messages">Contact AuraFlow</Link>
        </div>
      )}
      {admin && (
        <div className="business-admin">
          <strong>AuraFlow controls</strong>
          <span>Owner: {business.ownerId}</span>
          <Button
            variant={business.status === 'active' ? 'danger' : 'secondary'}
            loading={pending}
            onClick={() => {
              if (
                window.confirm(
                  `${business.status === 'active' ? 'Suspend public access to' : 'Activate'} ${business.settings.name}?`,
                )
              )
                void run(
                  {
                    action: 'activate',
                    revision: business.revision,
                    status:
                      business.status === 'active' ? 'suspended' : 'active',
                  },
                  'Business status updated.',
                )
            }}
          >
            {business.status === 'active' ? 'Suspend' : 'Activate'}
          </Button>
        </div>
      )}
      <div className="tab-bar" role="tablist" aria-label="Business views">
        {tabs.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'Setup' && (
        <div className="business-settings">
          <div className="business-form">
            <h3>Business profile</h3>
            <Field label="Business name">
              <Input
                value={settings.name}
                maxLength={120}
                onChange={(e) => update({ name: e.target.value })}
              />
            </Field>
            <Field label="Description">
              <Textarea
                value={settings.description}
                maxLength={1200}
                onChange={(e) => update({ description: e.target.value })}
              />
            </Field>
            <Field label="Address">
              <Textarea
                value={settings.address}
                maxLength={500}
                onChange={(e) => update({ address: e.target.value })}
              />
            </Field>
            <Field label="Business phone">
              <Input
                type="tel"
                value={settings.phone}
                onChange={(e) => update({ phone: e.target.value })}
              />
            </Field>
            <label className="studio-swatch">
              Brand accent
              <input
                type="color"
                value={settings.accent}
                onChange={(e) => update({ accent: e.target.value })}
              />
            </label>
            <Field label="Currency">
              <Select
                value={settings.currency}
                onChange={(e) =>
                  update({
                    currency: e.target.value as BusinessSettings['currency'],
                  })
                }
              >
                {['GHS', 'NGN', 'ZAR', 'USD', 'EUR', 'GBP'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="business-form">
            <h3>{school ? 'Academic structure' : 'Ordering & fulfilment'}</h3>
            {school ? (
              <>
                <Field label="Academic year">
                  <Input
                    value={settings.academicYear}
                    maxLength={40}
                    onChange={(e) => update({ academicYear: e.target.value })}
                    placeholder="2026 / 2027"
                  />
                </Field>
                <Field label="Current term">
                  <Input
                    value={settings.term}
                    maxLength={40}
                    onChange={(e) => update({ term: e.target.value })}
                  />
                </Field>
                <Field label="Classes (one per line)">
                  <Textarea
                    rows={8}
                    value={settings.classes.join('\n')}
                    onChange={(e) =>
                      update({ classes: e.target.value.split('\n') })
                    }
                  />
                </Field>
              </>
            ) : (
              <>
                <label className="business-check">
                  <input
                    type="checkbox"
                    checked={settings.acceptingOrders}
                    onChange={(e) =>
                      update({ acceptingOrders: e.target.checked })
                    }
                  />
                  Accept orders
                </label>
                <label className="business-check">
                  <input
                    type="checkbox"
                    checked={settings.deliveryEnabled}
                    onChange={(e) =>
                      update({ deliveryEnabled: e.target.checked })
                    }
                  />
                  Offer delivery
                </label>
                <Field label={`Delivery fee (${settings.currency})`}>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={settings.deliveryFeeMinor / 100}
                    onChange={(e) =>
                      update({
                        deliveryFeeMinor: Math.round(
                          Number(e.target.value) * 100,
                        ),
                      })
                    }
                  />
                </Field>
                <p className="field-hint">
                  Payment is collected by the restaurant. Online payment
                  processing is not enabled.
                </p>
              </>
            )}
            <h3>Hosted address</h3>
            <div className="business-link">
              <code>{publicUrl}</code>
              <button
                className="icon-button"
                title="Copy business link"
                aria-label="Copy business link"
                onClick={() =>
                  void navigator.clipboard
                    .writeText(publicUrl)
                    .then(() => toast.success('Link copied.'))
                    .catch(() => toast.error('Could not copy the link.'))
                }
              >
                <Copy />
              </button>
            </div>
            <p className="field-hint">
              {business.status === 'active'
                ? 'Public website is active.'
                : 'This address becomes available after activation.'}
            </p>
            <Button onClick={save} loading={pending} disabled={!dirty}>
              <Save />
              Save configuration
            </Button>
          </div>
        </div>
      )}
      {tab === 'Menu' && (
        <>
          <div className="business-toolbar">
            <h3>Menu / {settings.menu.length} items</h3>
            <div className="page-actions">
              <Button
                variant="secondary"
                disabled={settings.menu.length >= 60}
                onClick={() =>
                  update({
                    menu: [
                      ...settings.menu,
                      {
                        id: crypto.randomUUID(),
                        name: '',
                        description: '',
                        category: 'Main dishes',
                        priceMinor: 100,
                        available: true,
                      },
                    ],
                  })
                }
              >
                <Plus />
                Add item
              </Button>
              <Button loading={pending} disabled={!dirty} onClick={save}>
                <Save />
                Save menu
              </Button>
            </div>
          </div>
          <div className="business-menu-editor">
            {settings.menu.map((item, index) => {
              const edit = (change: Partial<typeof item>) =>
                update({
                  menu: settings.menu.map((i) =>
                    i.id === item.id ? { ...i, ...change } : i,
                  ),
                })
              return (
                <section key={item.id}>
                  <div className="business-toolbar">
                    <strong>Item {index + 1}</strong>
                    <button
                      className="icon-button"
                      title="Remove menu item"
                      aria-label={`Remove menu item ${index + 1}`}
                      onClick={() => {
                        if (window.confirm('Remove this item from the menu?'))
                          update({
                            menu: settings.menu.filter((i) => i.id !== item.id),
                          })
                      }}
                    >
                      <Trash2 />
                    </button>
                  </div>
                  <Field label="Dish name">
                    <Input
                      value={item.name}
                      maxLength={120}
                      onChange={(e) => edit({ name: e.target.value })}
                    />
                  </Field>
                  <Field label="Category">
                    <Input
                      value={item.category}
                      maxLength={60}
                      onChange={(e) => edit({ category: e.target.value })}
                    />
                  </Field>
                  <Field label="Description">
                    <Textarea
                      value={item.description}
                      maxLength={500}
                      onChange={(e) => edit({ description: e.target.value })}
                    />
                  </Field>
                  <Field label={`Price (${settings.currency})`}>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.priceMinor / 100}
                      onChange={(e) =>
                        edit({
                          priceMinor: Math.round(Number(e.target.value) * 100),
                        })
                      }
                    />
                  </Field>
                  <label className="business-check">
                    <input
                      type="checkbox"
                      checked={item.available}
                      onChange={(e) => edit({ available: e.target.checked })}
                    />
                    Available
                  </label>
                </section>
              )
            })}
          </div>
          {!settings.menu.length && (
            <StatePanel
              title="Build your menu"
              description="Add dishes, prices and availability before opening for orders."
            />
          )}
        </>
      )}
      {tab === 'Orders' && (
        <>
          <div className="business-toolbar">
            <h3>Recent orders</h3>
            <span className="field-hint">Latest 100 orders</span>
          </div>
          <div className="business-order-list">
            {data.orders.map((order) => (
              <article key={order.id}>
                <header>
                  <strong>
                    #{order.id.slice(0, 8)} / {order.name}
                  </strong>
                  <span className="business-status">{order.status}</span>
                  <b>{money(order.totalMinor, order.currency)}</b>
                </header>
                <p>
                  {order.items
                    .map((i) => `${i.quantity} x ${i.name}`)
                    .join(', ')}
                </p>
                <p>
                  {order.fulfilment} / {order.phone}
                  {order.address ? ` / ${order.address}` : ''}
                </p>
                {order.note && <p>Note: {order.note}</p>}
                <div className="page-actions">
                  {orderStates
                    .filter((s) =>
                      canTransitionOrder(order.status, s, order.fulfilment),
                    )
                    .map((s) => (
                      <Button
                        key={s}
                        loading={pending}
                        variant={s === 'cancelled' ? 'danger' : 'secondary'}
                        onClick={() => {
                          if (
                            s !== 'cancelled' ||
                            window.confirm('Cancel this order?')
                          )
                            void run(
                              {
                                action: 'order-status',
                                orderId: order.id,
                                from: order.status,
                                status: s,
                              },
                              'Order updated.',
                            )
                        }}
                      >
                        {s}
                      </Button>
                    ))}
                  <Button
                    variant="ghost"
                    disabled={
                      !order.whatsappConsent ||
                      !data.whatsappReady ||
                      data.outbound.some(
                        (n) =>
                          n.orderId === order.id &&
                          n.orderStatus === order.status,
                      )
                    }
                    loading={pending}
                    onClick={() =>
                      void run(
                        { action: 'notify', orderId: order.id },
                        'WhatsApp update submitted.',
                      )
                    }
                  >
                    Send WhatsApp update
                  </Button>
                </div>
              </article>
            ))}
          </div>
          {!data.orders.length && (
            <StatePanel
              title="No orders yet"
              description="Orders placed on your active website will appear here."
            />
          )}
        </>
      )}
      {tab === 'WhatsApp' && (
        <div className="business-form">
          <h3>Restaurant WhatsApp Business</h3>
          <span className="business-status">
            {data.whatsappReady ? 'Configured' : 'Connection required'}
          </span>
          <p>
            Your restaurant uses its own WhatsApp Business number. AuraFlow
            connects the account and approved order-update template securely.
          </p>
          <p className="field-hint">
            Share your business name and number with AuraFlow. Never send an
            access token in support chat. Updates are sent only to customers who
            opted in during checkout.
          </p>
          <Link
            className="af-button af-button--secondary"
            to="/dashboard/messages"
          >
            Arrange WhatsApp connection
            <ArrowUpRight />
          </Link>
          <h3>Delivery history</h3>
          <div className="business-events">
            {data.outbound.length ? (
              data.outbound.map((notification) => (
                <div key={notification.id}>
                  <span>
                    #{notification.orderId.slice(0, 8)} /{' '}
                    {notification.orderStatus}
                  </span>
                  <strong>
                    {notification.state === 'accepted'
                      ? 'Accepted by Meta'
                      : notification.state}
                  </strong>
                </div>
              ))
            ) : (
              <p className="field-hint">
                No WhatsApp notifications submitted yet.
              </p>
            )}
          </div>
        </div>
      )}
      {tab === 'Students' && (
        <>
          <div className="business-toolbar">
            <div className="business-search">
              <Search />
              <Input
                aria-label="Search students"
                placeholder="Name, admission number or class"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="page-actions">
              <Button variant="secondary" onClick={downloadRoster}>
                <Download />
                Export CSV
              </Button>
              <Button
                disabled={!settings.classes.filter(Boolean).length}
                onClick={() =>
                  setStudent({
                    id: crypto.randomUUID(),
                    name: '',
                    admissionNumber: '',
                    className: settings.classes[0],
                    guardianName: '',
                    guardianPhone: '',
                    active: true,
                  })
                }
              >
                <Plus />
                Add student
              </Button>
            </div>
          </div>
          <div className="business-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Admission no.</th>
                  <th>Class</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visibleStudents.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.admissionNumber}</td>
                    <td>{s.className}</td>
                    <td>{s.active ? 'Active' : 'Inactive'}</td>
                    <td>
                      <Button variant="ghost" onClick={() => setStudent(s)}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!visibleStudents.length && (
            <StatePanel
              title="No students found"
              description="Set up classes, then add student and guardian details."
            />
          )}
        </>
      )}
      {tab === 'Attendance' && (
        <>
          <div className="business-toolbar">
            <Field label="Attendance date">
              <Input
                type="date"
                value={date}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => {
                  if (
                    Object.keys(marks).length &&
                    !window.confirm('Discard unsaved attendance marks?')
                  )
                    return
                  setDate(e.target.value)
                  setMarks({})
                }}
              />
            </Field>
            <Button
              loading={pending}
              disabled={!data.students.some((s) => s.active)}
              onClick={() => {
                const entries = data.students
                  .filter((s) => s.active)
                  .map((s) => ({
                    studentId: s.id,
                    state:
                      marks[s.id] ||
                      existingAttendance?.entries.find(
                        (e) => e.studentId === s.id,
                      )?.state,
                  }))
                if (entries.some((e) => !e.state)) {
                  toast.error('Mark every active student before saving.')
                  return
                }
                void run(
                  {
                    action: 'attendance',
                    revision: business.revision,
                    attendance: { date, entries },
                  },
                  'Attendance saved.',
                )
              }}
            >
              <Check />
              Save register
            </Button>
          </div>
          <div className="business-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {data.students
                  .filter((s) => s.active)
                  .map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.className}</td>
                      <td>
                        <Select
                          aria-label={`Attendance for ${s.name}`}
                          value={
                            marks[s.id] ||
                            existingAttendance?.entries.find(
                              (e) => e.studentId === s.id,
                            )?.state ||
                            ''
                          }
                          onChange={(e) =>
                            setMarks((m) => ({
                              ...m,
                              [s.id]: e.target
                                .value as Attendance['entries'][number]['state'],
                            }))
                          }
                        >
                          <option value="" disabled>
                            Not marked
                          </option>
                          {['present', 'absent', 'late', 'excused'].map(
                            (state) => (
                              <option key={state}>{state}</option>
                            ),
                          )}
                        </Select>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {tab === 'Activity' && (
        <div className="business-events">
          {data.events.length ? (
            data.events.map((e) => (
              <div key={e.id}>
                <span>{e.action}</span>
                <time>{new Date(e.createdAt).toLocaleString()}</time>
              </div>
            ))
          ) : (
            <StatePanel title="No activity yet" />
          )}
        </div>
      )}
      <Modal
        open={Boolean(student)}
        onOpenChange={(open) => {
          if (!open) setStudent(null)
        }}
        title="Student record"
        description="Only this school's operator and AuraFlow administrators can access these records."
      >
        {student && (
          <form
            className="business-form"
            onSubmit={(e) => {
              e.preventDefault()
              const parsed = studentSchema.safeParse(student)
              if (!parsed.success) {
                toast.error(parsed.error.issues[0].message)
                return
              }
              void run(
                {
                  action: 'student',
                  revision: business.revision,
                  student: parsed.data,
                },
                'Student saved.',
              )
            }}
          >
            {(
              [
                'name',
                'admissionNumber',
                'guardianName',
                'guardianPhone',
              ] as const
            ).map((key) => (
              <Field
                key={key}
                label={
                  {
                    name: 'Student name',
                    admissionNumber: 'Admission number',
                    guardianName: 'Guardian name',
                    guardianPhone: 'Guardian phone',
                  }[key]
                }
              >
                <Input
                  required
                  value={student[key]}
                  onChange={(e) =>
                    setStudent({ ...student, [key]: e.target.value })
                  }
                />
              </Field>
            ))}
            <Field label="Class">
              <Select
                value={student.className}
                onChange={(e) =>
                  setStudent({ ...student, className: e.target.value })
                }
              >
                {business.settings.classes.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <label className="business-check">
              <input
                type="checkbox"
                checked={student.active}
                onChange={(e) =>
                  setStudent({ ...student, active: e.target.checked })
                }
              />
              Active enrolment
            </label>
            <Button type="submit" loading={pending}>
              <Save />
              Save student
            </Button>
          </form>
        )}
      </Modal>
    </fieldset>
  )
}
