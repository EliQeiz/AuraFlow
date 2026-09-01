import { stats } from '../../data/stats'

export function StatsBar() {
  return (
    <section id="stats" className="section-shell relative z-10 -mt-2 py-10">
      <div className="rounded-full bg-aura-gradient p-px shadow-aura">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-6 rounded-full bg-aura-surface/95 px-5 py-6">
          {stats.map((stat) => (
            <strong key={stat} className="max-w-44 text-center font-orbitron text-sm text-white sm:text-base">
              {stat}
            </strong>
          ))}
        </div>
      </div>
    </section>
  )
}
