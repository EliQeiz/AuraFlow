import { ArrowRight, ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import type { PortfolioProject } from "../../data/portfolio";
import { getProductUrl } from "../../lib/productLinks";
import { ShowcaseMedia } from "./ShowcaseMedia";

export function ProductLaunch({ project }: { project: PortfolioProject }) {
  const url = getProductUrl(project.key);
  return url ? (
    <a
      className="pf-button pf-button--outline"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {project.launchLabel}
      <ArrowUpRight size={17} />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  ) : (
    <a
      className="pf-button pf-button--outline"
      href={`mailto:elishaafari0@gmail.com?subject=${encodeURIComponent(`${project.title} walkthrough request`)}`}
    >
      Request a walkthrough
      <ArrowUpRight size={17} />
    </a>
  );
}

export function ProjectCard({ project }: { project: PortfolioProject }) {
  const reduced = useReducedMotion();
  return (
    <motion.article
      className="pf-project"
      initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: reduced ? 0 : 0.45 }}
    >
      <ShowcaseMedia slides={project.media} label={project.title} autoplay />
      <div className="pf-project__heading">
        <div>
          <p className="pf-kicker">{project.category}</p>
          <h3>
            <Link to={`/work/${project.slug}`}>{project.title}</Link>
          </h3>
        </div>
        <Link
          to={`/work/${project.slug}`}
          className="pf-round-link"
          aria-label={`View ${project.title} details`}
        >
          <ArrowUpRight size={22} />
        </Link>
      </div>
      <p>{project.description}</p>
      <div className="pf-project__actions">
        <ProductLaunch project={project} />
        <Link className="pf-text-link" to={`/work/${project.slug}`}>
          Project details <ArrowRight size={16} />
        </Link>
      </div>
      {project.accessLabel && (
        <p className="pf-project__access">{project.accessLabel}</p>
      )}
    </motion.article>
  );
}
