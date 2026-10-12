import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Pause,
  Play,
} from "lucide-react";
import type { ShowcaseSlide } from "../../data/portfolio";
import { Modal } from "../ui/Modal";

export function ShowcaseMedia({
  slides,
  label,
  autoplay = false,
  className = "",
  priority = false,
}: {
  slides: ShowcaseSlide[];
  label: string;
  autoplay?: boolean;
  className?: string;
  priority?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [manual, setManual] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(!document.hidden);
  const container = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const inView = useInView(container, { amount: 0.2 });
  const reduced = useReducedMotion();
  const saveData = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection?.saveData;
  const slide = slides[index % slides.length];
  const active =
    inView &&
    visible &&
    !expanded &&
    !paused &&
    (manual || (autoplay && !reduced && !saveData));

  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  useEffect(() => {
    if (!active || slide.kind === "video" || slides.length < 2) return;
    const timer = window.setTimeout(
      () => setIndex((value) => (value + 1) % slides.length),
      7000,
    );
    return () => window.clearTimeout(timer);
  }, [active, index, slide.kind, slides.length]);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let current = true;
    if (active)
      void element.play().catch(() => {
        if (current) setPlaying(false);
      });
    else element.pause();
    return () => {
      current = false;
      element.pause();
    };
  }, [active, slide.src]);

  function select(next: number) {
    setIndex((next + slides.length) % slides.length);
    setFailed(false);
  }
  function toggle() {
    if (
      (slide.kind === "video" && playing) ||
      (slide.kind === "image" && active)
    )
      setPaused(true);
    else {
      setPaused(false);
      setManual(true);
    }
  }
  const isRunning = slide.kind === "video" ? playing : active;
  return (
    <figure
      ref={container}
      className={`showcase-media ${className}`}
      aria-label={label}
      aria-roledescription={slides.length > 1 ? "carousel" : undefined}
    >
      <div className="showcase-media__stage">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={slide.src}
            className="showcase-media__frame"
            initial={{ opacity: reduced ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: reduced ? 1 : 0 }}
            transition={{ duration: 0.35 }}
          >
            {slide.kind === "video" ? (
              <video
                ref={video}
                src={inView || priority ? slide.src : undefined}
                poster={slide.poster}
                muted
                loop
                playsInline
                autoPlay={active}
                preload={active ? "auto" : "none"}
                aria-label={slide.title}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onError={() => {
                  setFailed(true);
                  setPlaying(false);
                }}
              />
            ) : (
              <img
                src={slide.src}
                alt={slide.title}
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : undefined}
                onError={() => setFailed(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
        <button
          type="button"
          className="showcase-expand"
          title="View full size"
          aria-label={`Expand ${label}`}
          onClick={() => {
            video.current?.pause();
            setExpanded(true);
          }}
        >
          <Maximize2 size={17} />
        </button>
        {failed && (
          <div className="showcase-error">
            Preview unavailable.{" "}
            <button
              type="button"
              onClick={() => {
                setFailed(false);
                video.current?.load();
              }}
            >
              Retry
            </button>
          </div>
        )}
      </div>
      <figcaption className="showcase-media__caption">
        <div>
          <span>
            {slide.caption ||
              (slide.kind === "video" ? "Product recording" : "Design study")}
          </span>
          <p aria-live={paused ? "polite" : "off"}>{slide.title}</p>
        </div>
        <div className="showcase-media__controls">
          {slides.length > 1 && (
            <>
              <button
                type="button"
                aria-label={`Previous ${label}`}
                title="Previous"
                onClick={() => select(index - 1)}
              >
                <ChevronLeft size={18} />
              </button>
              <span className="showcase-counter">
                {String(index + 1).padStart(2, "0")} /{" "}
                {String(slides.length).padStart(2, "0")}
              </span>
              <button
                type="button"
                aria-label={`Next ${label}`}
                title="Next"
                onClick={() => select(index + 1)}
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
          {(slides.length > 1 || slide.kind === "video") && (
            <button
              type="button"
              title={isRunning ? "Pause" : "Play"}
              aria-label={`${isRunning ? "Pause" : "Play"} ${label}`}
              onClick={toggle}
            >
              {isRunning ? <Pause size={17} /> : <Play size={17} />}
            </button>
          )}
        </div>
      </figcaption>
      <Modal
        open={expanded}
        onOpenChange={setExpanded}
        title={slide.title}
        className="showcase-modal"
      >
        {expanded &&
          (slide.kind === "video" ? (
            <video
              src={slide.src}
              poster={slide.poster}
              controls
              playsInline
              preload="metadata"
              aria-label={slide.title}
            />
          ) : (
            <img src={slide.src} alt={slide.title} />
          ))}
        {slides.length > 1 && (
          <div className="showcase-modal__nav">
            <button type="button" onClick={() => select(index - 1)}>
              <ChevronLeft size={18} /> Previous
            </button>
            <span>
              {index + 1} / {slides.length}
            </span>
            <button type="button" onClick={() => select(index + 1)}>
              Next <ChevronRight size={18} />
            </button>
          </div>
        )}
      </Modal>
    </figure>
  );
}
