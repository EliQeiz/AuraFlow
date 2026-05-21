import { faq } from '../../data/faq'

export function FAQ() {
  return (
    <section className="section-shell py-20">
      <h2 className="text-3xl font-extrabold sm:text-5xl">Questions, Answered</h2>
      <div className="mt-7 grid gap-3">
        {faq.map((item) => (
          <details key={item.question} className="glass rounded-lg p-5">
            <summary className="cursor-pointer list-none font-syne text-lg font-bold text-white">{item.question}</summary>
            <p className="mt-3 max-w-4xl leading-7 text-aura-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
