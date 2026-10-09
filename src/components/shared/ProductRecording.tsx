import { Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRef, useState } from 'react'

interface ProductRecordingProps {
  src: string
  title: string
  label: string
  duration: string
  className?: string
  controls?: boolean
}

/** A compact, honest frame for product recordings used in the public portfolio. */
export function ProductRecording({
  src,
  title,
  label,
  duration,
  className = '',
  controls = true,
}: ProductRecordingProps) {
  const video = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [unavailable, setUnavailable] = useState(false)

  async function togglePlayback() {
    if (!video.current) return
    if (video.current.paused) {
      await video.current.play()
      setIsPlaying(true)
    } else {
      video.current.pause()
      setIsPlaying(false)
    }
  }

  function toggleMute() {
    if (!video.current) return
    video.current.muted = !video.current.muted
    setIsMuted(video.current.muted)
  }

  return (
    <motion.figure
      className={`product-recording ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="product-recording__chrome" aria-hidden="true">
        <span /><span /><span />
        <p>Product recording</p>
      </div>
      <div className="product-recording__screen">
        {unavailable ? (
          <div className="product-recording__fallback">
            <span>Recording unavailable</span>
            <strong>{title}</strong>
            <p>The source video could not be loaded in this browser.</p>
          </div>
        ) : (
          <video
            ref={video}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            preload="metadata"
            aria-label={label}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onError={() => setUnavailable(true)}
          >
            <source src={src} type="video/mp4" />
          </video>
        )}
        <div className="product-recording__overlay">
          <span>{label}</span>
          <small>{duration}</small>
        </div>
      </div>
      {controls && !unavailable && (
        <div className="product-recording__controls">
          <button type="button" onClick={togglePlayback} aria-label={isPlaying ? 'Pause recording preview' : 'Play recording preview'}>
            {isPlaying ? <Pause /> : <Play />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button type="button" onClick={toggleMute} aria-label={isMuted ? 'Unmute recording preview' : 'Mute recording preview'}>
            {isMuted ? <VolumeX /> : <Volume2 />}
            {isMuted ? 'Muted' : 'Sound on'}
          </button>
        </div>
      )}
    </motion.figure>
  )
}
