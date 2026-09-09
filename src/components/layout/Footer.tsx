import { Link } from 'react-router-dom'
import { Brand } from '../shared/Brand'

export function Footer() {
  return (
    <footer className="public-footer">
      <div className="section-shell">
        <div className="footer-top">
          <div>
            <Brand />
            <p>
              Websites and business software.
              <br />
              Built with you. Built in Ghana.
            </p>
          </div>
          <div>
            <h3>Platform</h3>
            <Link to="/solutions">Business suites</Link>
            <Link to="/templates">Templates</Link>
            <Link to="/services">Custom development</Link>
            <Link to="/pricing">Pricing</Link>
          </div>
          <div>
            <h3>AuraFlow</h3>
            <Link to="/about">Our story</Link>
            <Link to="/portfolio">Concepts & work</Link>
            <Link to="/blog">Journal</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div>
            <h3>Let's talk</h3>
            <a href="mailto:elishaafari0@gmail.com">elishaafari0@gmail.com</a>
            <a href="tel:+233506624529">+233 50 662 4529</a>
            <a href="tel:+233547395699">+233 54 739 5699</a>
            <a
              href="https://wa.me/233506624529"
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} AuraFlow. All rights reserved.
          </span>
          <div className="flex gap-5">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <span>Ghana, West Africa</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
