import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { SEOHead } from "../components/shared/SEOHead";
import {
  ProjectCard,
  ProductLaunch,
} from "../components/portfolio/ProjectCard";
import { ShowcaseMedia } from "../components/portfolio/ShowcaseMedia";
import { PublicPageHero } from "../components/portfolio/PublicPageHero";
import { ScrollReveal } from "../components/portfolio/ScrollReveal";
import {
  industrialDesigns,
  portfolioProjects,
  websiteDesigns,
} from "../data/portfolio";

const aliases: Record<string, string> = {
  "cloud-erp": "crestview",
  "buildproof-ai": "buildproof",
};

export default function Labs() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  if (slug && aliases[slug])
    return <Navigate to={`/work/${aliases[slug]}`} replace />;
  if (slug === "energymat-ml")
    return <Navigate to="/work?category=designs#industrial" replace />;
  if (slug === "fieldsync-mobile")
    return <Navigate to="/services#mobile" replace />;
  const project = portfolioProjects.find((item) => item.slug === slug);
  if (slug && !project)
    return (
      <main className="pf-page pf-container pf-section">
        <h1>Project not found</h1>
        <Link className="pf-text-link" to="/work">
          Explore our work <ArrowRight size={17} />
        </Link>
      </main>
    );
  if (project)
    return (
      <main className="pf-page pf-project-page">
        <SEOHead
          title={`${project.title} | AuraFlow portfolio`}
          description={project.description}
          path={`/work/${project.slug}`}
          image={project.media[0]?.poster || project.media[0]?.src}
        />
        <PublicPageHero
          eyebrow={project.category}
          image={
            ["crestview", "buildproof"].includes(project.key)
              ? "/media/portfolio/hero-operations-v2.webp"
              : "/media/portfolio/hero-hospitality-v2.webp"
          }
          title={
            <>
              {project.title}. <em>Built around real use.</em>
            </>
          }
          summary={project.description}
          links={[
            { href: "#overview", label: "Overview" },
            { href: "#walkthrough", label: "Walkthrough" },
            { href: "#workflows", label: "Workflows" },
            { href: "#safeguards", label: "Safeguards" },
          ]}
        >
          <div className="pf-actions">
            <ProductLaunch project={project} />
            <Link className="pf-text-link" to="/work">
              <ArrowLeft size={17} /> All work
            </Link>
          </div>
        </PublicPageHero>
        <div className="pf-container pf-section" id="overview">
          <section className="pf-case-intro">
            <div>
              <p className="pf-kicker">The problem</p>
              <h2>{project.problem}</h2>
            </div>
            <div>
              <p className="pf-kicker">AuraFlow’s role</p>
              <p>{project.role}</p>
              <p className="pf-case-status">
                <strong>Current status</strong>
                {project.status}
              </p>
            </div>
          </section>
          <ScrollReveal className="pf-case-media">
            <div id="walkthrough">
              <ShowcaseMedia
                slides={project.media}
                label={project.title}
                priority
              />
            </div>
          </ScrollReveal>
          <section className="pf-case-grid" id="workflows">
            <div>
              <p className="pf-kicker">Key workflows</p>
              <h2>What the experience is designed to support.</h2>
              <ul>
                {project.workflows.map((item) => (
                  <li key={item}>
                    <Check size={17} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="pf-kicker">Implementation</p>
              <h3>Technology chosen for the product.</h3>
              <div className="pf-tech-list">
                {project.technologies.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
              <p>
                {project.note ||
                  "Open the public product to experience the current implementation in context."}
              </p>
            </div>
          </section>
          <section className="pf-case-safeguards" id="safeguards">
            <div>
              <p className="pf-kicker">Responsible delivery</p>
              <h2>Security, access and clarity are part of the product.</h2>
            </div>
            <ul>
              {project.safeguards.map((item) => (
                <li key={item}>
                  <Check size={17} />
                  {item}
                </li>
              ))}
            </ul>
          </section>
          <div className="pf-detail-contact">
            <div>
              <p className="pf-kicker">Your project</p>
              <h2>Something similar in mind?</h2>
            </div>
            <Link className="pf-button" to="/contact">
              Discuss your project <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </main>
    );

  const filter = ["software", "websites", "designs"].includes(
    params.get("category") || "",
  )
    ? params.get("category")
    : "all";
  const projects = portfolioProjects.filter(
    (item) =>
      filter === "all" ||
      (filter === "software"
        ? ["crestview", "buildproof"].includes(item.key)
        : filter === "websites"
          ? !["crestview", "buildproof"].includes(item.key)
          : false),
  );
  return (
    <main className="pf-page">
      <SEOHead
        title="Our work | AuraFlow"
        description="Explore real AuraFlow software recordings, restaurant websites and visual studies for hospitality, healthcare and industrial dashboards."
        path="/work"
      />
      <PublicPageHero
        eyebrow="The AuraFlow portfolio"
        image="/media/portfolio/hero-operations-v2.webp"
        title={
          <>
            Proof in the details. <em>Work in context.</em>
          </>
        }
        summary="Explore real product recordings, public websites and clearly labelled design studies—then open the work on its own platform where available."
        links={[
          { href: "#portfolio", label: "Projects" },
          { href: "#web-designs", label: "Website studies" },
          { href: "#industrial", label: "Industrial dashboards" },
        ]}
      />
      <div className="pf-container pf-section" id="portfolio">
        <div className="pf-work-filters" aria-label="Filter portfolio">
          {[
            ["all", "All work"],
            ["software", "Software"],
            ["websites", "Websites"],
            ["designs", "Design studies"],
          ].map(([value, title]) => (
            <button
              type="button"
              key={value}
              aria-pressed={filter === value}
              onClick={() =>
                setParams(value === "all" ? {} : { category: value })
              }
            >
              {title}
            </button>
          ))}
        </div>
        {projects.length > 0 && (
          <div className="pf-project-grid">
            {projects.map((item) => (
              <ProjectCard key={item.slug} project={item} />
            ))}
          </div>
        )}
        {(filter === "all" || filter === "designs") && (
          <div className="pf-design-galleries">
            <section id="web-designs">
              <div className="pf-section-heading">
                <div>
                  <p className="pf-kicker">Visual concepts / Website design</p>
                  <h2>Made for the setting.</h2>
                </div>
                <p>
                  Hospitality and pharmacy website studies. These are visual
                  design concepts, not live booking or pharmacy services.
                </p>
              </div>
              <ShowcaseMedia
                slides={websiteDesigns}
                label="Website designs"
                autoplay
              />
            </section>
            <section id="industrial">
              <div className="pf-section-heading">
                <div>
                  <p className="pf-kicker">
                    Visual concepts / Data & machine learning
                  </p>
                  <h2>Operations, in focus.</h2>
                </div>
                <p>
                  Mining, plant control and smelter dashboard concepts. The
                  figures shown are illustrative, not live industrial
                  measurements.
                </p>
              </div>
              <ShowcaseMedia
                slides={industrialDesigns}
                label="Industrial dashboards"
                autoplay
              />
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
