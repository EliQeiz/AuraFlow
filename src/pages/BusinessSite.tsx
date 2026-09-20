import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Minus,
  Phone,
  Plus,
  ShoppingBag,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { businessApi } from '../lib/business'
import { asErrorMessage } from '../lib/utils'
import {
  money,
  orderInputSchema,
  type BusinessSettings,
  type Order,
} from '../domain/business'
import { useAuth } from '../context/AuthContext'
import { StatePanel } from '../components/ui/StatePanel'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { Input, Select, Textarea } from '../components/ui/Input'

type PublicBusiness = {
  preview?: boolean
  id: string
  kind: 'school' | 'restaurant'
  settings: Pick<
    BusinessSettings,
    | 'name'
    | 'description'
    | 'address'
    | 'phone'
    | 'accent'
    | 'currency'
    | 'menu'
    | 'acceptingOrders'
    | 'deliveryEnabled'
    | 'deliveryFeeMinor'
  >
}
export default function BusinessSite() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const preview = params.get('preview') === '1'
  const { user, loading } = useAuth()
  const site = useQuery({
    queryKey: ['public-business', id, preview, preview ? user?.uid : 'public'],
    enabled: !preview || !loading,
    queryFn: () =>
      businessApi<PublicBusiness>({
        action: preview ? 'preview' : 'public',
        id,
      }),
  })
  return site.isPending ? (
    <StatePanel loading />
  ) : site.error ? (
    <StatePanel
      error={site.error}
      description={asErrorMessage(site.error)}
      retry={() => void site.refetch()}
    />
  ) : (
    <Storefront key={id} business={site.data} />
  )
}
function Storefront({ business }: { business: PublicBusiness }) {
  const { settings, id } = business
  const { user } = useAuth()
  const [initialBasket] = useState(() => {
    try {
      return z
        .object({
          cart: z.record(z.string().uuid(), z.number().int().min(0).max(50)),
          orderId: z.string().uuid(),
        })
        .parse(
          JSON.parse(sessionStorage.getItem(`business-basket:${id}`) || ''),
        )
    } catch {
      return { cart: {}, orderId: crypto.randomUUID() }
    }
  })
  const [cart, setCart] = useState<Record<string, number>>(initialBasket.cart)
  const [fulfilment, setFulfilment] = useState<'pickup' | 'delivery'>('pickup')
  const [pending, setPending] = useState(false)
  const [orderId, setOrderId] = useState(initialBasket.orderId)
  useEffect(() => {
    try {
      sessionStorage.setItem(
        `business-basket:${id}`,
        JSON.stringify({ cart, orderId }),
      )
    } catch {
      /* Private browsing may disable session storage. */
    }
  }, [cart, id, orderId])
  const [category, setCategory] = useState('All')
  const orders = useQuery({
    queryKey: ['customer-orders', user?.uid, id],
    enabled: Boolean(user),
    queryFn: () => businessApi<Order[]>({ action: 'my-orders', id }),
    refetchInterval: 15_000,
  })
  const items = settings.menu.filter((item) => cart[item.id])
  const delivery = fulfilment === 'delivery' ? settings.deliveryFeeMinor : 0
  const total = items.reduce(
    (sum, item) => sum + item.priceMinor * cart[item.id],
    delivery,
  )
  function quantity(itemId: string, delta: number) {
    setCart((previous) => ({
      ...previous,
      [itemId]: Math.max(0, Math.min(50, (previous[itemId] || 0) + delta)),
    }))
  }
  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const parsed = orderInputSchema.safeParse({
      id: orderId,
      businessId: id,
      name: form.get('name'),
      phone: form.get('phone'),
      address: form.get('address') || '',
      note: form.get('note') || '',
      fulfilment,
      whatsappConsent: form.get('consent') === 'on',
      items: items.map((i) => ({ id: i.id, quantity: cart[i.id] })),
    })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message)
      return
    }
    setPending(true)
    try {
      await businessApi({ action: 'order', order: parsed.data })
      setCart({})
      setOrderId(crypto.randomUUID())
      await orders.refetch()
      toast.success('Order received. Track its status below.')
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setPending(false)
    }
  }
  return (
    <main
      className="business-site"
      style={{ '--business-accent': settings.accent } as CSSProperties}
    >
      {business.preview && (
        <div className="inline-alert">
          Private preview. Ordering is disabled.
          <Link to={`/dashboard/businesses?business=${id}`}>
            Return to business settings
          </Link>
        </div>
      )}
      <header className="business-site-nav">
        <Link to="/">
          <ArrowLeft size={16} />
          AuraFlow
        </Link>
        <strong>{settings.name}</strong>
        <a href={`tel:${settings.phone}`}>
          <Phone size={16} />
          Contact
        </a>
      </header>
      <section className="business-site-intro">
        <span>
          {business.kind === 'restaurant'
            ? 'Kitchen & dining'
            : 'School community'}
        </span>
        <h1>{settings.name}</h1>
        <p>{settings.description}</p>
        <div>
          <MapPin size={16} />
          {settings.address}
        </div>
      </section>
      {business.kind === 'restaurant' ? (
        <div className="business-store-grid">
          <section>
            <div className="tab-bar" aria-label="Menu categories">
              {['All', ...new Set(settings.menu.map((i) => i.category))].map(
                (c) => (
                  <button
                    key={c}
                    aria-pressed={category === c}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </button>
                ),
              )}
            </div>
            <h2>Our menu</h2>
            {!settings.acceptingOrders && (
              <p className="inline-alert">
                The kitchen is not accepting orders right now.
              </p>
            )}
            <div className="business-menu">
              {settings.menu
                .filter(
                  (item) => category === 'All' || item.category === category,
                )
                .map((item) => (
                  <article key={item.id}>
                    <div>
                      <small>{item.category}</small>
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                      <b>{money(item.priceMinor, settings.currency)}</b>
                    </div>
                    <button
                      className="icon-button"
                      disabled={!settings.acceptingOrders || pending}
                      title={`Add ${item.name}`}
                      aria-label={`Add ${item.name}`}
                      onClick={() => quantity(item.id, 1)}
                    >
                      <Plus />
                    </button>
                  </article>
                ))}
            </div>
          </section>
          <aside className="business-checkout">
            <h2>
              <ShoppingBag size={20} />
              Your order
            </h2>
            {items.length ? (
              <>
                <div className="business-cart">
                  {items.map((item) => (
                    <div key={item.id}>
                      <span>{item.name}</span>
                      <button
                        className="icon-button"
                        disabled={pending}
                        aria-label={`Remove one ${item.name}`}
                        onClick={() => quantity(item.id, -1)}
                      >
                        <Minus />
                      </button>
                      <b>{cart[item.id]}</b>
                      <button
                        className="icon-button"
                        disabled={pending}
                        aria-label={`Add one ${item.name}`}
                        onClick={() => quantity(item.id, 1)}
                      >
                        <Plus />
                      </button>
                    </div>
                  ))}
                </div>
                <form className="business-form" onSubmit={checkout}>
                  <Field label="Fulfilment">
                    <Select
                      value={fulfilment}
                      disabled={pending}
                      onChange={(e) =>
                        setFulfilment(e.target.value as typeof fulfilment)
                      }
                    >
                      <option value="pickup">Pickup</option>
                      {settings.deliveryEnabled && (
                        <option value="delivery">Delivery</option>
                      )}
                    </Select>
                  </Field>
                  {fulfilment === 'delivery' && (
                    <Field label="Delivery address">
                      <Textarea
                        name="address"
                        required
                        minLength={5}
                        maxLength={500}
                      />
                    </Field>
                  )}
                  <Field label="Your name">
                    <Input
                      name="name"
                      required
                      minLength={2}
                      maxLength={120}
                      autoComplete="name"
                    />
                  </Field>
                  <Field label="Phone number">
                    <Input
                      name="phone"
                      type="tel"
                      required
                      placeholder="+233..."
                      autoComplete="tel"
                    />
                  </Field>
                  <Field label="Order notes">
                    <Textarea name="note" maxLength={500} />
                  </Field>
                  <label className="business-check">
                    <input name="consent" type="checkbox" />
                    Send updates about this order to my WhatsApp number.
                  </label>
                  {delivery > 0 && (
                    <p>Delivery: {money(delivery, settings.currency)}</p>
                  )}
                  <div className="business-total">
                    <span>Total</span>
                    <strong>{money(total, settings.currency)}</strong>
                  </div>
                  <p className="field-hint">
                    Pay the restaurant on pickup or delivery. No online payment
                    is taken.
                  </p>
                  {user ? (
                    <Button
                      type="submit"
                      loading={pending}
                      disabled={!settings.acceptingOrders}
                    >
                      Place order
                    </Button>
                  ) : (
                    <Link
                      className="af-button af-button--primary"
                      to="/login"
                      state={{ from: { pathname: `/b/${id}` } }}
                    >
                      Sign in to order
                    </Link>
                  )}
                </form>
              </>
            ) : (
              <p>Your basket is empty.</p>
            )}
          </aside>
        </div>
      ) : (
        <section className="business-school-contact">
          <h2>Admissions & enquiries</h2>
          <p>Contact the school for enrolment information and appointments.</p>
          <a
            className="af-button af-button--primary"
            href={`tel:${settings.phone}`}
          >
            Call the school
            <Phone size={16} />
          </a>
        </section>
      )}
      {user && business.kind === 'restaurant' && (
        <section className="business-customer-orders">
          <h2>Your orders</h2>
          {orders.error ? (
            <StatePanel
              error={orders.error}
              retry={() => void orders.refetch()}
            />
          ) : orders.isPending ? (
            <StatePanel loading />
          ) : orders.data?.length ? (
            [...orders.data]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((order) => (
                <article key={order.id}>
                  <strong>#{order.id.slice(0, 8)}</strong>
                  <span>
                    {order.items
                      .map((i) => `${i.quantity} x ${i.name}`)
                      .join(', ')}
                  </span>
                  <span className="business-status">{order.status}</span>
                  <b>{money(order.totalMinor, order.currency)}</b>
                </article>
              ))
          ) : (
            <p>No orders yet.</p>
          )}
        </section>
      )}
      <footer className="business-site-footer">
        {settings.name}
        <span>
          Powered by <Link to="/">AuraFlow</Link>
        </span>
      </footer>
    </main>
  )
}
