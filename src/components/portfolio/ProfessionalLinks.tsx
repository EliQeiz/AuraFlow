import type { ComponentType } from "react";
import { Download } from "lucide-react";
import { FaGithub, FaLinkedinIn } from "react-icons/fa6";

interface ProfessionalLink {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
  external: boolean;
  download?: string;
}

const links: ProfessionalLink[] = [
  {
    href: "https://github.com/EliQeiz",
    label: "GitHub",
    icon: FaGithub,
    external: true,
  },
  {
    href: "https://www.linkedin.com/in/elisha-afari",
    label: "LinkedIn",
    icon: FaLinkedinIn,
    external: true,
  },
  {
    href: "/media/portfolio/Elisha-Afari-Resume.pdf",
    label: "Download résumé",
    icon: Download,
    external: false,
    download: "Elisha-Afari-Resume.pdf",
  },
];

export function ProfessionalLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`pf-professional-links ${className}`}>
      {links.map(({ download, external, href, icon: Icon, label }) => (
        <a
          key={label}
          href={href}
          download={download}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
        >
          <span aria-hidden="true">
            <Icon size={16} />
          </span>
          {label}
          {external && <span className="sr-only"> (opens in a new tab)</span>}
        </a>
      ))}
    </div>
  );
}
