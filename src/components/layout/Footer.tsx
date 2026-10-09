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
              Engineering systems and applied software.
              <br />
              Built in Ghana. Made to hold up.
            </p>
          </div>
          <div>
            <h3>Portfolio</h3>
            <Link to="/">Home</Link>
            <Link to="/labs">Flagship systems</Link>
            <Link to="/labs/cloud-erp">Modular Cloud ERP</Link>
            <Link to="/labs/buildproof-ai">BuildProof AI</Link>
            <Link to="/labs/energymat-ml">EnergyMat ML Studio</Link>
          </div>
          <div>
            <h3>Platforms</h3>
            <Link to="/business-center">Business Center</Link>
            <Link to="/afc">AuraFlow Class</Link>
            <Link to="/about">About the engineer</Link>
            <Link to="/contact">Start a conversation</Link>
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
