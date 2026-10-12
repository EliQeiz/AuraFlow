import {
  ArrowRight,
  Check,
  Code2,
  Compass,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PublicPageHero } from "../components/portfolio/PublicPageHero";
import { ProfessionalLinks } from "../components/portfolio/ProfessionalLinks";
import { ScrollReveal } from "../components/portfolio/ScrollReveal";
import { SEOHead } from "../components/shared/SEOHead";

const founder = "/media/portfolio/elisha-afari.webp";
const principles = [
  [
    Compass,
    "Clarity before complexity",
    "Define the users, the decision and the smallest useful release before choosing technology.",
  ],
  [
    UsersRound,
    "Built with the people using it",
    "Workflows should reflect how a team actually operates—not force the team to imitate the software.",
  ],
  [
    ShieldCheck,
    "Responsible by default",
    "Access control, privacy, accessibility and honest product status belong in the brief from the beginning.",
  ],
  [
    Code2,
    "Designed to keep evolving",
    "Use maintainable systems, documented decisions and clear ownership so useful products can grow responsibly.",
  ],
] as const;

export default function About() {
  return (
    <main className="pf-page">
      <SEOHead
        title="About AuraFlow"
        description="Meet Elisha Afari and learn how AuraFlow approaches websites, business software, data and research work from Ghana."
        path="/about"
      />
      <PublicPageHero
        eyebrow="Ghanaian technology practice"
        image="/media/portfolio/hero-research-v2.webp"
        title={
          <>
            Close to the problem. <em>Serious about the outcome.</em>
          </>
        }
        summary="AuraFlow connects practical engineering, careful design and direct collaboration—building from Ghana for organisations at home and beyond."
        links={[
          { href: "#founder", label: "Founder" },
          { href: "#principles", label: "Principles" },
          { href: "#capabilities", label: "Capabilities" },
        ]}
      >
        <Link className="pf-button" to="/contact">
          Start a conversation <ArrowRight size={17} />
        </Link>
      </PublicPageHero>
      <section
        className="pf-container pf-section pf-founder pf-founder--about"
        id="founder"
      >
        <ScrollReveal className="pf-founder__portrait">
          <img
            src={founder}
            alt="Elisha Afari, founder of AuraFlow, working in his studio"
            width={1254}
            height={1254}
            loading="eager"
          />
        </ScrollReveal>
        <ScrollReveal>
          <p className="pf-kicker">Elisha Afari / Founder and developer</p>
          <h2 className="pf-founder__lead">
            Good software begins with understanding the work around it.
          </h2>
          <p>
            AuraFlow is a Ghana-based technology practice building websites,
            operational software, data experiences and research tools.
          </p>
          <p>
            My technical foundation is a BSc in Materials Engineering from
            KNUST. I now work as a Research and Teaching Assistant while
            developing software, data and scientific-computing systems,
            including a hybrid machine-learning and SCAPS-1D workflow for
            perovskite solar-cell research.
          </p>
          <p>
            The work begins with the people, decisions and constraints behind
            the interface. That means asking what must be simpler, what
            information must remain private, and what a responsible first
            release should actually do.
          </p>
          <p>
            AuraFlow is growing deliberately: presenting completed work
            honestly, distinguishing live products from design studies, and
            building the systems needed to support clients beyond a launch day.
          </p>
          <div className="pf-actions">
            <Link className="pf-button" to="/work">
              Explore the work <ArrowRight size={17} />
            </Link>
            <a className="pf-text-link" href="mailto:elishaafari0@gmail.com">
              Email Elisha
            </a>
          </div>
          <ProfessionalLinks />
        </ScrollReveal>
      </section>
      <section className="pf-work-band" id="principles">
        <div className="pf-container pf-section">
          <div className="pf-section-heading">
            <div>
              <p className="pf-kicker">How we work</p>
              <h2>Professional principles, made practical.</h2>
            </div>
            <p>
              These are working standards, not decorative claims. They shape
              briefs, reviews and delivery decisions.
            </p>
          </div>
          <div className="pf-principles-grid">
            {principles.map(([Icon, title, copy]) => (
              <article key={title}>
                <Icon aria-hidden="true" />
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section
        className="pf-container pf-section pf-capability-band"
        id="capabilities"
      >
        <div>
          <p className="pf-kicker">Capabilities</p>
          <h2>One practice, connected disciplines.</h2>
          <p>
            Strategy, experience design and implementation stay connected so
            decisions are not lost between separate handoffs.
          </p>
        </div>
        <div className="pf-capability-columns">
          {[
            [
              "Product and interface",
              [
                "Discovery and product briefs",
                "Information architecture",
                "Responsive UI systems",
                "Accessible interaction design",
              ],
            ],
            [
              "Software engineering",
              [
                "React and TypeScript applications",
                "Cloud data and authentication",
                "Role-based workflows",
                "API and service integration",
              ],
            ],
            [
              "Data and research",
              [
                "Operational dashboards",
                "Statistical analysis",
                "Machine-learning prototypes",
                "Research-method support",
              ],
            ],
          ].map(([title, items]) => (
            <section key={title as string}>
              <h3>{title as string}</h3>
              <ul>
                {(items as string[]).map((item) => (
                  <li key={item}>
                    <Check size={16} />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
