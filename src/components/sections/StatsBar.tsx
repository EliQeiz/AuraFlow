import { stats } from '../../data/stats'

export function StatsBar() {
  return (
    <section id="stats" className="section-shell relative z-10 py-10">
      <div className="rounded-lg border border-white/10 bg-white/[0.065] p-3 shadow-2xl shadow-black/25 backdrop-blur-2xl">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map((stat, index) => (
            <div key={stat} className="rounded-lg border border-white/10 bg-black/25 p-4">
              <span className="font-orbitron text-xs text-cyan-100">0{index + 1}</span>
              <strong className="mt-3 block text-sm leading-6 text-white">
                {stat}
              </strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
