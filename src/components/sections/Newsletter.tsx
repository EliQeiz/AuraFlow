import { NewsletterForm } from '../forms/NewsletterForm'

export function Newsletter() {
  return (
    <section className="section-shell py-20">
      <div className="grid gap-5 rounded-lg border border-white/10 bg-white/[0.06] px-5 py-10 text-center shadow-cyan">
        <h2 className="text-3xl font-extrabold">Stay in the Flow</h2>
        <p className="mx-auto max-w-xl text-aura-muted">New templates, build notes, Firebase tips, and launch ideas from AuraFlow.</p>
        <NewsletterForm />
      </div>
    </section>
  )
}
