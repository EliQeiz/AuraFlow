import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { SEOHead } from "../components/shared/SEOHead";
import { ShowcaseMedia } from "../components/portfolio/ShowcaseMedia";
import { PublicPageHero } from "../components/portfolio/PublicPageHero";
import { ScrollReveal } from "../components/portfolio/ScrollReveal";
import {
  industrialDesigns,
  portfolioServices,
  recording,
  serviceFlyers,
  websiteDesigns,
} from "../data/portfolio";

const galleries = [
  websiteDesigns,
  [
    recording("crestview", "Crestview / School operations"),
    recording("buildproof", "BuildProof / Project operations"),
  ],
  [serviceFlyers[0]],
  industrialDesigns,
];

export default function Services() {
  return (
    <main className="pf-page">
      <SEOHead
        title="Development & Research Services | AuraFlow"
        description="Websites, web and mobile apps, data dashboards, machine learning and academic research support from Ghana."
        path="/services"
      />
      <PublicPageHero
        eyebrow="Development and research services"
        image="/media/portfolio/hero-development-v2.webp"
        title={
          <>
            From a first idea <em>to something useful.</em>
          </>
        }
        summary="Start with the problem you want to solve. We’ll shape the brief, design the experience and build the right path to delivery."
        links={[
          { href: "#websites", label: "Websites" },
          { href: "#applications", label: "Applications" },
          { href: "#mobile", label: "Mobile" },
          { href: "#data", label: "Data & ML" },
          { href: "#research", label: "Research" },
        ]}
      >
        <Link className="pf-button" to="/contact">
          Start a conversation <ArrowRight size={17} />
        </Link>
      </PublicPageHero>
      <div className="pf-container pf-section" id="development-services">
        <div className="pf-services-list">
          {portfolioServices.map((service, index) => (
            <ScrollReveal key={service.id}>
              <section id={service.id} className="pf-service-row">
                <div className="pf-service-detail">
                  <div className="pf-service-detail__copy">
                    <p className="pf-kicker">0{index + 1} / Development</p>
                    <h2>{service.title}</h2>
                    <p className="mt-5">{service.description}</p>
                    <ul>
                      {service.features.map((feature) => (
                        <li key={feature}>
                          <Check size={17} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link
                      className="pf-button pf-button--outline"
                      to={`/contact?service=${encodeURIComponent(service.title)}`}
                    >
                      Discuss your project <ArrowRight size={17} />
                    </Link>
                    {service.id === "mobile" && (
                      <p className="pf-note">
                        Available as a development service. A public mobile
                        product demo is not listed yet.
                      </p>
                    )}
                  </div>
                  <ShowcaseMedia
                    slides={galleries[index]}
                    label={service.title}
                    className={index === 2 ? "showcase-media--flyer" : ""}
                  />
                </div>
              </section>
            </ScrollReveal>
          ))}
        </div>
      </div>
      <section className="pf-work-band" id="research">
        <div className="pf-container pf-section pf-research">
          <div>
            <p className="pf-kicker">05 / Research & academic support</p>
            <h2>
              Good questions.
              <br />
              Careful work.
            </h2>
            <p>
              Research-method guidance, statistical analysis, software
              prototypes and editing support for your own academic work.
            </p>
            <div className="pf-research__topics">
              <span>Research methodology</span>
              <span>Statistical analysis & ML</span>
              <span>Academic prototypes</span>
              <span>Structure & refinement</span>
            </div>
            <p>
              We support your learning and authorship. You remain responsible
              for your research, citations and your institution's requirements.
            </p>
            <Link className="pf-button pf-button--outline" to="/contact">
              Discuss your research <ArrowRight size={17} />
            </Link>
          </div>
          <ShowcaseMedia
            slides={[serviceFlyers[1]]}
            label="Research services flyer"
            className="showcase-media--flyer"
          />
        </div>
      </section>
      <section className="pf-container pf-section pf-delivery" id="delivery">
        <div className="pf-section-heading">
          <div>
            <p className="pf-kicker">How delivery works</p>
            <h2>Clear decisions at every stage.</h2>
          </div>
          <p>
            No inflated promises: a practical sequence from discovery to a
            working release and continued improvement.
          </p>
        </div>
        <ol>
          {[
            [
              "01",
              "Discover",
              "Define the users, the operational problem and what a useful first release must achieve.",
            ],
            [
              "02",
              "Design",
              "Map journeys, content, roles and interfaces before expensive development decisions are locked in.",
            ],
            [
              "03",
              "Build",
              "Implement in reviewable stages, with security, responsiveness and accessibility treated as product requirements.",
            ],
            [
              "04",
              "Release",
              "Validate the result, prepare deployment and document the next responsible stage of growth.",
            ],
          ].map(([number, title, copy]) => (
            <li key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
