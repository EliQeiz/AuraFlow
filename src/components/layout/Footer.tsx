import { Mail, MapPin, Phone } from 'lucide-react'
import { FaGithub, FaInstagram, FaLinkedin, FaWhatsapp, FaXTwitter } from 'react-icons/fa6'
import { Link } from 'react-router-dom'
import { services } from '../../data/services'
import { NewsletterForm } from '../forms/NewsletterForm'

const quickLinks = [
  ['Services', '/services'],
  ['Templates', '/templates'],
  ['Portfolio', '/portfolio'],
  ['Pricing', '/pricing'],
  ['Blog', '/blog'],
  ['About', '/about'],
  ['Contact', '/contact'],
]

const socialLinks = [
  { Icon: FaXTwitter, label: 'X', href: 'https://x.com' },
  { Icon: FaLinkedin, label: 'LinkedIn', href: 'https://www.linkedin.com' },
  { Icon: FaGithub, label: 'GitHub', href: 'https://github.com' },
  { Icon: FaInstagram, label: 'Instagram', href: 'https://www.instagram.com' },
  { Icon: FaWhatsapp, label: 'WhatsApp', href: 'https://wa.me/233506624529' },
]

export function Footer() {
  return (
    <footer className="grid-texture border-t border-white/10 bg-aura-surface py-14">
      <div className="section-shell grid gap-10 lg:grid-cols-[1.1fr_1fr_0.9fr]">
        <div>
          <Link to="/" className="font-orbitron text-2xl font-extrabold text-white">
            AuraFlow
          </Link>
          <p className="mt-3 max-w-md text-aura-muted">Let's build something exceptional together. Web and mobile development solutions from Ghana.</p>
          <div className="mt-4 flex gap-2">
            {socialLinks.map(({ Icon, href, label }) => (
              <a key={label} aria-label={label} className="grid h-10 w-10 place-items-center rounded-md border border-white/10 text-aura-muted transition hover:scale-105 hover:border-cyan-200/50 hover:text-cyan-100" href={href} target="_blank" rel="noreferrer">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
          <div className="mt-5">
            <NewsletterForm compact />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-bold uppercase text-white">Quick Links</h2>
            <div className="mt-3 grid gap-2 text-sm text-aura-muted">
              {quickLinks.map(([label, to]) => (
                <Link key={to} to={to} className="transition hover:text-white">
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase text-white">Services</h2>
            <div className="mt-3 grid gap-2 text-sm text-aura-muted">
              {services.map((service) => (
                <Link key={service.id} to="/services" className="transition hover:text-white">
                  {service.shortTitle}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase text-white">Contact</h2>
          <div className="mt-3 grid gap-3 text-sm text-aura-muted">
            <a className="flex items-center gap-2 hover:text-white" href="mailto:elishaafari0@gmail.com">
              <Mail className="h-4 w-4 text-cyan-100" />
              elishaafari0@gmail.com
            </a>
            <a className="flex items-center gap-2 hover:text-white" href="tel:+233506624529">
              <Phone className="h-4 w-4 text-cyan-100" />
              0506624529
            </a>
            <a className="flex items-center gap-2 hover:text-white" href="tel:+233547395699">
              <Phone className="h-4 w-4 text-cyan-100" />
              0547395699
            </a>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-cyan-100" />
              Ghana
            </span>
            <span>Business hours: Mon-Sat, 8:00-19:00</span>
          </div>
        </div>
      </div>

      <div className="section-shell mt-10 flex flex-col gap-3 border-t border-white/10 pt-5 text-sm text-aura-muted sm:flex-row sm:items-center sm:justify-between">
        <span>Copyright {new Date().getFullYear()} AuraFlow. All rights reserved.</span>
        <div className="flex gap-4">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms</Link>
        </div>
      </div>
    </footer>
  )
}
