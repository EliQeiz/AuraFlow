import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
import { Link } from "react-router-dom";

const slides = [
  {
    image: "hero-development-v2",
    label: "Web & mobile development",
    description:
      "Thoughtful websites. Useful applications. Digital experiences that feel like your business.",
    to: "/services",
    action: "Explore our services",
    flyer: false,
  },
  {
    image: "hero-hospitality-v2",
    label: "Websites with a sense of place",
    description:
      "From Ghanaian hospitality to everyday retail, a digital home designed around your customers.",
    to: "/work?category=designs",
    action: "Explore website designs",
    flyer: false,
  },
  {
    image: "hero-operations-v2",
    label: "Software for everyday operations",
    description:
      "See Crestview and BuildProof in action, then explore the products on their own platforms.",
    to: "/work?category=software",
    action: "View our software",
    flyer: false,
  },
  {
    image: "hero-industrial-v2",
    label: "Complex data. Clearer decisions.",
    description:
      "Dashboards, data analysis and machine learning for the questions that matter to your organisation.",
    to: "/work?category=designs#industrial",
    action: "View dashboard designs",
    flyer: false,
  },
  {
    image: "hero-research-v2",
    label: "Knowledge. Ideas. Impact.",
    description:
      "Research data, reproducible analysis, simulation and machine learning for technically grounded questions.",
    to: "/services#research",
    action: "Explore scientific computing",
    flyer: false,
  },
];

export function PortfolioHero() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(!document.hidden);
  const root = useRef<HTMLElement>(null);
  const inView = useInView(root, { amount: 0.25 });
  const reduced = useReducedMotion();
  const slide = slides[index];
  const running = !paused && !reduced && visible && inView;
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  useEffect(() => {
    if (!running) return;
    const timeout = window.setTimeout(
      () => setIndex((value) => (value + 1) % slides.length),
      3000,
    );
    return () => window.clearTimeout(timeout);
  }, [running, index]);
  const choose = (value: number) => {
    setPaused(true);
    setIndex((value + slides.length) % slides.length);
  };
  return (
    <section
      ref={root}
      className="pf-hero"
      aria-label="AuraFlow services"
      aria-roledescription="carousel"
    >
      <div className="pf-hero__art" aria-hidden="true">
        <AnimatePresence initial={false} mode="wait">
          <motion.img
            key={slide.image}
            src={`/media/portfolio/${slide.image}.webp`}
            srcSet={`/media/portfolio/${slide.image}-960.webp 960w, /media/portfolio/${slide.image}.webp 1672w`}
            sizes="100vw"
            width={1672}
            height={941}
            alt=""
            className={slide.flyer ? "pf-hero__flyer" : "pf-hero__screen"}
            initial={{ opacity: reduced ? 1 : 0, scale: reduced ? 1 : 1.035 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: reduced ? 1 : 0 }}
            transition={{
              duration: reduced ? 0 : 0.65,
              ease: [0.22, 1, 0.36, 1],
            }}
            fetchPriority={index === 0 ? "high" : "auto"}
            decoding={index === 0 ? "sync" : "async"}
          />
        </AnimatePresence>
      </div>
      <div className="pf-hero__veil" aria-hidden="true" />
      <div className="pf-container pf-hero__inner">
        <div className="pf-hero__copy">
          <p className="pf-kicker">
            <span className="pf-marker" /> Built in Ghana. Open to the world.
          </p>
          <h1>
            <span className="pf-hero__brand">
              Aura<span>Flow.</span>
            </span>
            <span className="pf-hero__accent">Web, software</span>
            <span className="pf-hero__promise">&amp; data solutions.</span>
          </h1>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={slide.label}
              className="pf-hero__message"
              aria-live={paused ? "polite" : "off"}
              initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : -8 }}
              transition={{ duration: reduced ? 0 : 0.4 }}
            >
              <h2>{slide.label}</h2>
              <p>{slide.description}</p>
            </motion.div>
          </AnimatePresence>
          <div className="pf-actions">
            <Link className="pf-button" to="/contact">
              Let's build together <ArrowUpRight size={18} />
            </Link>
            <Link className="pf-text-link" to="/work">
              View our work <ArrowRight size={17} />
            </Link>
          </div>
          <Link className="pf-hero__slide-link" to={slide.to}>
            {slide.action}
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
      <div className="pf-container pf-hero__bottom">
        <div className="pf-hero__pagination">
          <button
            type="button"
            aria-label="Previous hero slide"
            onClick={() => choose(index - 1)}
          >
            <ChevronLeft size={17} />
          </button>
          {slides.map((item, i) => (
            <button
              key={item.image}
              type="button"
              className="pf-slide-dot"
              aria-label={`Show ${item.label}`}
              aria-pressed={index === i}
              onClick={() => choose(i)}
            >
              <span>
                <i key={index === i ? `progress-${index}` : item.image} />
              </span>
            </button>
          ))}
          <button
            type="button"
            aria-label="Next hero slide"
            onClick={() => choose(index + 1)}
          >
            <ChevronRight size={17} />
          </button>
          {!reduced && (
            <button
              type="button"
              aria-label={
                paused ? "Play hero slideshow" : "Pause hero slideshow"
              }
              onClick={() => setPaused(!paused)}
            >
              {paused ? <Play size={15} /> : <Pause size={15} />}
            </button>
          )}
        </div>
        <span className="pf-hero__slide-number">
          0{index + 1} / 05 <span>{slide.label}</span>
        </span>
      </div>
    </section>
  );
}
