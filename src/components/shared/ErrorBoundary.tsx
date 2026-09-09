import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('AuraFlow rendering failure', error, info.componentStack)
  }
  render() {
    if (this.state.failed)
      return (
        <main className="app-error" role="alert">
          <h1>This page could not load.</h1>
          <p>Your saved work is still available. Reload to reconnect.</p>
          <button
            className="af-button af-button--primary"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={16} /> Reload AuraFlow
          </button>
        </main>
      )
    return this.props.children
  }
}
