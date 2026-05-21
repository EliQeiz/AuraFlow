import { useInView } from 'react-intersection-observer'

export function useCountUp() {
  return useInView({ triggerOnce: true, threshold: 0.35 })
}
