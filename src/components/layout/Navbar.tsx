import { Menu, X, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Brand } from "../shared/Brand";
import { ButtonLink } from "../ui/Button";

const links = [
  ["Home", "/"],
  ["Services", "/services"],
  ["Our work", "/work"],
  ["AFC", "/afc"],
  ["About", "/about"],
] as const;
export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  return (
    <header className="public-nav pf-nav">
      <div className="nav-inner">
        <Brand />
        <nav className="nav-links" aria-label="Main navigation">
          {links.map(([label, path]) => (
            <NavLink key={path} to={path}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="nav-actions">
          {!user && (
            <Link className="nav-login text-xs mr-2" to="/login">
              Sign in
            </Link>
          )}
          <ButtonLink to={user ? "/dashboard" : "/contact"}>
            {user ? "Workspace" : "Let's talk"}
            <ArrowUpRight />
          </ButtonLink>
          <button
            type="button"
            className="icon-button mobile-nav-toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-public-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <nav
            id="mobile-public-navigation"
            className="mobile-public-nav"
            aria-label="Mobile navigation"
          >
            {links.map(([label, path]) => (
              <Link onClick={() => setOpen(false)} key={path} to={path}>
                {label}
              </Link>
            ))}
            <Link to="/login" onClick={() => setOpen(false)}>
              Sign in
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
