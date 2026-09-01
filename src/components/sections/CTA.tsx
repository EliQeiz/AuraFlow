import { CalendarDays, LogIn } from 'lucide-react'
import { ButtonLink } from '../ui/Button'
import { useAuth } from '../../context/AuthContext'

export function CTA() {
  const { user } = useAuth()

  return (
    <section className="relative overflow-hidden bg-aura-gradient bg-[length:180%_180%] py-16 animate-gradientShift">
      <div className="section-shell relative text-center">
        <h2 className="text-3xl font-extrabold text-white sm:text-5xl">Ready to build something exceptional?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85">Bring a product idea, an urgent business workflow, or a template you want made unmistakably yours.</p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink to={user ? '/dashboard/requests/new' : '/register'} className="bg-aura-dark shadow-2xl hover:brightness-125">
            {user ? 'Open Private Request' : 'Create Client Account'}
          </ButtonLink>
          <ButtonLink to={user ? '/dashboard/requests' : '/login'} variant="secondary" className="border-white/50 text-white hover:bg-white/15">
            <CalendarDays className="h-4 w-4" />
            {user ? 'Track Requests' : <><LogIn className="h-4 w-4" /> Login</>}
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}
