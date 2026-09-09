import { Layers2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PropsWithChildren } from 'react'
import { Brand } from '../shared/Brand'

export function AuthShell({
  children,
  footer,
  title,
}: PropsWithChildren<{ eyebrow?: string; footer: string; title: string }>) {
  return (
    <main className="auth-page">
      <header className="auth-header">
        <Brand />
        <Link to="/contact">Need help?</Link>
      </header>
      <div className="auth-content">
        <section className="auth-form-container">
          <div className="auth-heading">
            <span className="auth-symbol">
              <Layers2 size={24} />
            </span>
            <h1>{title}</h1>
            <p>{footer}</p>
          </div>
          {children}
        </section>
      </div>
      <footer className="auth-footer">
        <Link to="/privacy">Privacy</Link>
        <span> · </span>
        <Link to="/terms">Terms</Link>
        <span> · AuraFlow, Ghana</span>
      </footer>
    </main>
  )
}
