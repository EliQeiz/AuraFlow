import { useEffect, useRef, useState } from 'react'
import { useCountUp } from '../../hooks/useCountUp'

export function CountUpStat({ label, suffix, value }: { label: string; suffix: string; value: number }) {
  const { inView, ref } = useCountUp()
  const animatedValue = useAnimatedCount(value, inView)

  return (
    <div ref={ref} className="min-w-36 text-center">
      <strong className="block font-orbitron text-2xl text-white sm:text-3xl">
        {animatedValue}
        {suffix}
      </strong>
      <span className="mt-1 block text-sm text-aura-muted">{label}</span>
    </div>
  )
}

function useAnimatedCount(target: number, active: boolean) {
  const [count, setCount] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (!active || started.current) return

    started.current = true
    const duration = 2200
    const startTime = performance.now()
    let frame = 0

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(target * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, target])

  return count
}
