import {
  ArrowRight,
  ArrowUpRight,
  GraduationCap,
  PanelsTopLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import { SEOHead } from "../components/shared/SEOHead";
import { PortfolioHero } from "../components/portfolio/PortfolioHero";
import { ServiceShowcase } from "../components/portfolio/ServiceShowcase";
import { ProjectCard } from "../components/portfolio/ProjectCard";
import { ShowcaseMedia } from "../components/portfolio/ShowcaseMedia";
import { ProfessionalLinks } from "../components/portfolio/ProfessionalLinks";
import { portfolioProjects, serviceFlyers } from "../data/portfolio";

export default function Home() {
  return (
    <main className="pf-page">
      <SEOHead
        title="AuraFlow | Websites, Software & Data"
        description="Websites, software, scientific computing and machine-learning work from Ghana. Explore AuraFlow's portfolio and meet founder Elisha Afari."
        path="/"
        preloadImage="/media/portfolio/hero-development-v2.webp"
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "ProfessionalService",
            name: "AuraFlow",
            url: "https://aura-flow-red.vercel.app",
            email: "elishaafari0@gmail.com",
            telephone: "+233506624529",
            areaServed: ["Ghana", "Africa", "International"],
            founder: { "@type": "Person", name: "Elisha Afari" },
            knowsAbout: [
              "Web development",
              "Software development",
              "Data analysis",
              "Machine learning",
              "Scientific computing",
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "Person",
            name: "Elisha Afari",
            jobTitle: "Founder and software developer",
            worksFor: { "@type": "Organization", name: "AuraFlow" },
            sameAs: [
              "https://github.com/EliQeiz",
              "https://www.linkedin.com/in/elisha-afari",
            ],
          },
        ]}
      />
      <PortfolioHero />
      <div className="pf-service-strip">
        <div className="pf-container">
          <span>Websites</span>
          <span>Web applications</span>
          <span>Mobile apps</span>
          <span>Data & machine learning</span>
          <span>Research data & scientific computing</span>
        </div>
      </div>
      <ServiceShowcase />
      <section className="pf-work-band" id="work">
        <div className="pf-container pf-section">
          <div className="pf-section-heading">
            <div>
              <p className="pf-kicker">Selected work</p>
              <h2>Ideas, brought to life.</h2>
            </div>
            <div>
              <p>
                Explore the details. Watch the real recordings. Open each
                product on its own platform.
              </p>
              <Link className="pf-text-link" to="/work">
                All projects & designs <ArrowRight size={17} />
              </Link>
            </div>
          </div>
          <div className="pf-project-grid">
            {portfolioProjects.slice(0, 4).map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </div>
      </section>
      <section className="pf-container pf-section pf-research" id="research">
        <div>
          <p className="pf-kicker">Research data & scientific computing</p>
          <h2>
            Turn a good question
            <br />
            into meaningful work.
          </h2>
          <p>
            Reproducible data analysis, statistical modelling, scientific
            software and machine-learning prototypes for technically grounded
            research questions. Methods and limitations remain explicit.
          </p>
          <div className="pf-research__topics">
            <span>Reproducible analysis</span>
            <span>Statistical modelling & ML</span>
            <span>Scientific software</span>
            <span>Simulation workflows</span>
          </div>
          <Link
            className="pf-button pf-button--outline"
            to="/services#research"
          >
            Explore scientific computing <ArrowRight size={17} />
          </Link>
        </div>
        <ShowcaseMedia
          slides={[serviceFlyers[1], serviceFlyers[0]]}
          label="AuraFlow service flyers"
          className="showcase-media--flyer"
        />
      </section>
      <section className="pf-founder-band">
        <div className="pf-container pf-section pf-founder">
          <img
            src="/media/portfolio/elisha-afari.webp"
            alt="Elisha Afari at his desk in a home studio"
            width="1254"
            height="1254"
            loading="lazy"
          />
          <div>
            <p className="pf-kicker">Meet the founder</p>
            <h2>Hi, I'm Elisha.</h2>
            <p className="pf-founder__lead">
              A software developer and data enthusiast, building from Ghana.
            </p>
            <p>
              I started AuraFlow to turn useful ideas into working digital
              products. I work across websites, business software and data, with
              a focus on making complex things easier for the people using them.
            </p>
            <p>
              Have a project in mind? Let's talk about what you need, what
              matters most, and how we can get there.
            </p>
            <div className="pf-actions">
              <Link className="pf-button" to="/about">
                More about me <ArrowUpRight size={17} />
              </Link>
              <a className="pf-text-link" href="mailto:elishaafari0@gmail.com">
                Get in touch <ArrowRight size={17} />
              </a>
            </div>
            <ProfessionalLinks />
          </div>
        </div>
      </section>
      <section className="pf-container pf-section pf-destinations">
        <div>
          <p className="pf-kicker">Part of AuraFlow</p>
          <h2>
            Keep learning.
            <br />
            Keep building.
          </h2>
        </div>
        <Link to="/afc">
          <GraduationCap size={26} />
          <div>
            <h3>AuraFlow Class</h3>
            <p>
              Explore practical technology courses and your learning workspace.
            </p>
          </div>
          <ArrowUpRight size={21} />
        </Link>
        <Link to="/dashboard">
          <PanelsTopLeft size={26} />
          <div>
            <h3>Client workspace</h3>
            <p>
              Share your brief, follow your project and stay in touch with us.
            </p>
          </div>
          <ArrowUpRight size={21} />
        </Link>
      </section>
      <section className="pf-contact-band">
        <div className="pf-container">
          <p className="pf-kicker">Your next project</p>
          <h2>
            Let's build something
            <br />
            <span>exceptional together.</span>
          </h2>
          <Link className="pf-button pf-button--white" to="/contact">
            Start a conversation <ArrowUpRight size={19} />
          </Link>
        </div>
      </section>
    </main>
  );
}
