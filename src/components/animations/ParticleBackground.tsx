import { useCallback } from 'react'
import Particles from 'react-particles'
import { loadFull } from 'tsparticles'
import type { Engine } from 'tsparticles-engine'

export function ParticleBackground({ burst = false }: { burst?: boolean }) {
  const initializeParticles = useCallback(async (engine: Engine) => loadFull(engine), [])

  return (
    <Particles
      className="absolute inset-0"
      init={initializeParticles}
      options={{
        fullScreen: { enable: false },
        detectRetina: true,
        fpsLimit: 60,
        particles: {
          color: { value: ['#6C63FF', '#00D4FF', '#ffffff'] },
          links: { color: '#00D4FF', distance: 125, enable: true, opacity: burst ? 0.35 : 0.15, width: 1 },
          move: {
            enable: true,
            outModes: { default: 'out' },
            speed: burst ? 4 : 0.65,
          },
          number: { density: { enable: true, area: 900 }, value: burst ? 160 : 80 },
          opacity: { value: { min: 0.15, max: 0.72 } },
          shape: { type: burst ? 'circle' : ['circle', 'star'] },
          size: { value: { min: 1, max: burst ? 5 : 3 } },
        },
      }}
    />
  )
}
