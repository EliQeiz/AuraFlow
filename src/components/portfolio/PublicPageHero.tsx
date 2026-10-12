import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface PageHeroLink {
  href: string;
  label: string;
}

export function PublicPageHero({
  eyebrow,
  title,
  summary,
  image,
  imageAlt = "",
  links = [],
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  summary: string;
  image: string;
  imageAlt?: string;
  links?: PageHeroLink[];
  children?: ReactNode;
}) {
  const reduced = useReducedMotion();
  const compactImage = image.replace(/\.webp$/, "-960.webp");
  return (
    <>
      <section className="pf-page-hero">
        <motion.img
          src={image}
          srcSet={`${compactImage} 960w, ${image} 1672w`}
          sizes="100vw"
          alt={imageAlt}
          width={1672}
          height={941}
          initial={{ opacity: reduced ? 1 : 0, scale: reduced ? 1 : 1.025 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduced ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
          fetchPriority="high"
          decoding="sync"
        />
        <div className="pf-page-hero__veil" aria-hidden="true" />
        <div className="pf-container pf-page-hero__inner">
          <motion.div
            initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 0.55, delay: 0.08 }}
          >
            <p className="pf-kicker">
              <span className="pf-marker" /> {eyebrow}
            </p>
            <h1>{title}</h1>
            <p className="pf-page-hero__summary">{summary}</p>
            {children}
          </motion.div>
        </div>
      </section>
      {links.length > 0 && (
        <nav className="pf-section-nav" aria-label="On this page">
          <div className="pf-container">
            <span>On this page</span>
            {links.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}
