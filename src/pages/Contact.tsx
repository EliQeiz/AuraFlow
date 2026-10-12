import { ArrowRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { ProjectBriefForm } from "../components/forms/ProjectBriefForm";
import { PublicPageHero } from "../components/portfolio/PublicPageHero";
import { SEOHead } from "../components/shared/SEOHead";

export default function Contact() {
  const [params] = useSearchParams();
  const service = params.get("service");
  return (
    <main className="pf-page">
      <SEOHead
        title="Start a project"
        description="Share your next website, application, data or research project with AuraFlow in Ghana."
        path="/contact"
      />
      <PublicPageHero
        eyebrow="Start a conversation"
        image="/media/portfolio/hero-hospitality-v2.webp"
        title={
          <>
            Bring the problem. <em>We’ll shape the next step.</em>
          </>
        }
        summary={
          service
            ? `You’re enquiring about ${service}. Share the context below and we’ll respond with a practical next step.`
            : "Tell us what should become easier, clearer or possible. We’ll review the context before recommending a path."
        }
        links={[
          { href: "#brief", label: "Project brief" },
          { href: "#direct", label: "Direct contact" },
          { href: "#expect", label: "What happens next" },
        ]}
      />
      <div className="pf-container pf-section pf-contact-page">
        <section id="brief">
          <ProjectBriefForm initialService={service || ""} />
        </section>
        <aside id="direct" className="pf-contact-direct">
          <p className="pf-kicker">Direct contact</p>
          <h2>Prefer to speak first?</h2>
          <p>
            Use whichever channel is most comfortable. Do not send passwords or
            confidential client records through email or WhatsApp.
          </p>
          <a href="mailto:elishaafari0@gmail.com">
            <Mail aria-hidden="true" />
            <span>
              <strong>Email</strong>elishaafari0@gmail.com
            </span>
          </a>
          <a href="tel:+233506624529">
            <Phone aria-hidden="true" />
            <span>
              <strong>Call</strong>+233 50 662 4529
            </span>
          </a>
          <a
            href="https://wa.me/233506624529"
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle aria-hidden="true" />
            <span>
              <strong>WhatsApp</strong>Start a conversation
            </span>
          </a>
          <div>
            <MapPin aria-hidden="true" />
            <span>
              <strong>Based in Ghana</strong>Working with organisations across
              Africa and beyond.
            </span>
          </div>
        </aside>
      </div>
      <section className="pf-work-band" id="expect">
        <div className="pf-container pf-section pf-next-steps">
          <div>
            <p className="pf-kicker">What happens next</p>
            <h2>A considered response, not an automated sales script.</h2>
          </div>
          <ol>
            <li>
              <span>01</span>
              <p>
                <strong>Review</strong>We read the context and identify the
                important unknowns.
              </p>
            </li>
            <li>
              <span>02</span>
              <p>
                <strong>Conversation</strong>We clarify users, scope, timing and
                a responsible starting point.
              </p>
            </li>
            <li>
              <span>03</span>
              <p>
                <strong>Workspace</strong>Once there is a fit, private files and
                project decisions move into your secure workspace.
              </p>
            </li>
          </ol>
          <Link className="pf-text-link" to="/privacy">
            Read how we handle information <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
