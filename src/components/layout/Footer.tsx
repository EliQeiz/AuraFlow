import { Link } from "react-router-dom";
import { Brand } from "../shared/Brand";

export function Footer() {
  return (
    <footer className="public-footer pf-footer">
      <div className="section-shell">
        <div className="footer-top">
          <div>
            <Brand />
            <p>
              Web, software and data solutions.
              <br />
              Built in Ghana. Open to the world.
            </p>
          </div>
          <div>
            <h3>Portfolio</h3>
            <Link to="/">Home</Link>
            <Link to="/work">Our work</Link>
            <Link to="/services">Development services</Link>
            <Link to="/services#research">Research support</Link>
            <Link to="/work?category=designs">Design studies</Link>
          </div>
          <div>
            <h3>Platforms</h3>
            <Link to="/dashboard">Client workspace</Link>
            <Link to="/afc">AuraFlow Class</Link>
            <Link to="/about">About the engineer</Link>
            <Link to="/contact">Start a conversation</Link>
          </div>
          <div>
            <h3>Let's talk</h3>
            <a href="mailto:elishaafari0@gmail.com">elishaafari0@gmail.com</a>
            <a href="tel:+233506624529">+233 50 662 4529</a>
            <a href="tel:+233535868572">+233 53 586 8572</a>
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
  );
}
