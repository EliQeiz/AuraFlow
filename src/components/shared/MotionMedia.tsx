import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useInView,
} from 'framer-motion'
import { ImageOff, Pause, Play } from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'

const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
function subscribeReducedMotion(change: () => void) {
  reducedQuery.addEventListener('change', change)
  return () => reducedQuery.removeEventListener('change', change)
}

function imageSource(source: string, width = 960) {
  try {
    const url = new URL(source)
    if (['images.unsplash.com', 'images.pexels.com'].includes(url.hostname)) {
      url.searchParams.set('w', String(width))
      url.searchParams.set('q', '80')
    }
    return url.href
  } catch {
    return source
  }
}
export function MotionMedia({
  images,
  videos = [],
  alt,
  autoplay = false,
  children,
}: {
  images: string[]
  videos?: string[]
  alt: string
  autoplay?: boolean
  children?: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const visible = useInView(ref, { amount: 0.15 })
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    () => reducedQuery.matches,
    () => true,
  )
  const [hovered, setHovered] = useState(false),
    [paused, setPaused] = useState(false),
    [manual, setManual] = useState(false),
    [index, setIndex] = useState(0),
    [failed, setFailed] = useState(false)
  const [foreground, setForeground] = useState(() => !document.hidden)
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection
  const active =
    visible &&
    foreground &&
    !paused &&
    !reduced &&
    !connection?.saveData &&
    (autoplay || hovered || manual)
  const sources = [...new Set(images)]
    .slice(0, 4)
    .map((src) => imageSource(src))
  const videoSources = [...new Set(videos)].slice(0, 2)
  const mediaCount = videoSources.length > 0 ? videoSources.length : sources.length
  const stableSources = JSON.stringify({ sources, videoSources })
  const controls = useAnimationControls()
  useEffect(() => {
    const change = () => setForeground(!document.hidden)
    document.addEventListener('visibilitychange', change)
    return () => document.removeEventListener('visibilitychange', change)
  }, [])
  useEffect(() => {
    if (active)
      void controls.start({
        scale: [1, 1.065],
        transition: {
          duration: 12,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'linear',
        },
      })
    else controls.stop()
    return () => controls.stop()
  }, [active, controls])
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (active) void video.play().catch(() => undefined)
    else video.pause()
  }, [active, index])
  useEffect(() => {
    const gallery = JSON.parse(stableSources) as { sources: string[]; videoSources: string[] }
    if (!active || mediaCount < 2) return
    let live = true
    const timer = window.setInterval(() => {
      const next = (index + 1) % mediaCount
      if (gallery.videoSources.length) {
        if (live) setIndex(next)
        return
      }
      const image = new Image()
      image.onload = () => {
        if (live) {
          setIndex(next)
          setFailed(false)
        }
      }
      image.src = gallery.sources[next]
    }, 6500)
    return () => {
      live = false
      window.clearInterval(timer)
    }
  }, [active, index, mediaCount, stableSources])
  return (
    <div
      ref={ref}
      className="motion-media"
      data-playing={active}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setHovered(false)
      }}
    >
      <motion.div className="motion-media-stage" animate={controls}>
        <AnimatePresence initial={false}>
          {!failed && videoSources.length > 0 ? (
            <video
              key={videoSources[index % videoSources.length]}
              src={videoSources[index % videoSources.length]}
              ref={videoRef}
              poster={sources[0]}
              muted
              loop
              playsInline
              autoPlay={active}
              preload="auto"
              aria-label={alt}
              onError={() => setFailed(true)}
            />
          ) : !failed && sources.length > 0 ? (
            <motion.img
              key={sources[index % sources.length]}
              src={sources[index % sources.length]}
              alt={alt}
              loading="lazy"
              decoding="async"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.7 }}
              onError={() => setFailed(true)}
            />
          ) : (
            <div className="media-unavailable">
              <ImageOff />
              <span>{alt}</span>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
      {children}
      {!reduced && !connection?.saveData && (
        <button
          type="button"
          className="media-play"
          aria-label={`${active ? 'Pause' : 'Play'} ${alt} reel`}
          title={active ? 'Pause image reel' : 'Play image reel'}
          onClick={() => {
            if (active) setPaused(true)
            else {
              setPaused(false)
              setManual(true)
            }
          }}
        >
          {active ? <Pause size={13} /> : <Play size={13} />}
        </button>
      )}
      {videoSources.length + sources.length > 1 && (
        <div className="media-dots" aria-hidden="true">
          {[...videoSources, ...sources].map((source, i) => (
            <i key={source} data-active={i === index} />
          ))}
        </div>
      )}
    </div>
  )
}
