import { useState, type CSSProperties } from "react";
import {
  ArrowRight,
  ChartNoAxesCombined,
  Code2,
  Globe2,
  Smartphone,
  Check,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  industrialDesigns,
  portfolioServices,
  recording,
  serviceFlyers,
  websiteDesigns,
} from "../../data/portfolio";
import { ShowcaseMedia } from "./ShowcaseMedia";

const icons = [Globe2, Code2, Smartphone, ChartNoAxesCombined];
const slides = [
  websiteDesigns,
  [
    recording("crestview", "Crestview / School management"),
    recording("buildproof", "BuildProof / Construction operations"),
  ],
  [serviceFlyers[0]],
  industrialDesigns,
];

export function ServiceShowcase() {
  const [selected, setSelected] = useState(0);
  const service = portfolioServices[selected];
  return (
    <section className="pf-section pf-container" id="services">
      <div className="pf-section-heading">
        <div>
          <p className="pf-kicker">What we build</p>
          <h2>
            The right tools.
            <br />
            For your next chapter.
          </h2>
        </div>
        <p>
          From your first website to software that runs your business. Choose
          the service that fits your next step.
        </p>
      </div>
      <div className="pf-service-tabs" aria-label="Services">
        {portfolioServices.map((item, index) => {
          const Icon = icons[index];
          return (
            <button
              type="button"
              key={item.id}
              aria-pressed={selected === index}
              aria-controls="service-details"
              onClick={() => setSelected(index)}
              style={{ "--service-color": item.color } as CSSProperties}
            >
              <Icon size={21} />
              <span>{item.short}</span>
              <ArrowRight size={16} />
            </button>
          );
        })}
      </div>
      <div className="pf-service-detail" id="service-details" key={service.id}>
        <div className="pf-service-detail__copy">
          <p className="pf-kicker">0{selected + 1} / Our expertise</p>
          <h3>{service.title}</h3>
          <p>{service.description}</p>
          <ul>
            {service.features.map((feature) => (
              <li key={feature}>
                <Check size={16} />
                {feature}
              </li>
            ))}
          </ul>
          <Link
            className="pf-button pf-button--outline"
            to={`/dashboard/requests/new?service=${encodeURIComponent(service.title)}`}
          >
            Discuss your project <ArrowRight size={17} />
          </Link>
          {selected === 2 && (
            <p className="pf-note">
              Mobile development is available as a service. A public mobile
              product demo is not listed yet.
            </p>
          )}
        </div>
        <ShowcaseMedia
          slides={slides[selected]}
          label={`${service.short} showcase`}
          autoplay
          className={selected === 2 ? "showcase-media--flyer" : ""}
        />
      </div>
    </section>
  );
}
