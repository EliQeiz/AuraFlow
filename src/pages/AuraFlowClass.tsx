import { ArrowLeft, ArrowUpRight, BookOpenCheck, GraduationCap, ShieldCheck } from 'lucide-react'
import { PageWrapper } from '../components/shared/PageWrapper'
import { SEOHead } from '../components/shared/SEOHead'
import { ButtonLink } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

export default function AuraFlowClass() {
  const { user } = useAuth()
  return (
    <PageWrapper>
      <SEOHead
        title="AuraFlow Class"
        description="AFC is AuraFlow's practical learning workspace for technology, AI, and software development courses."
      />
      <main className="afc-gateway">
        <section className="section-shell afc-gateway__hero">
          <div>
            <p className="eyebrow">AuraFlow Class</p>
            <h1>Learn the work behind great digital products.</h1>
            <p>
              AFC is AuraFlow's focused learning environment for software development,
              data, AI, product design, and the practical work that connects them.
            </p>
            <div className="hero-actions afc-gateway__actions">
              <ButtonLink to={user ? '/dashboard/afc' : '/register'}>
                {user ? 'Open learning workspace' : 'Create AFC account'} <ArrowUpRight />
              </ButtonLink>
              <ButtonLink to="/" variant="secondary">
                <ArrowLeft /> Back to AuraFlow
              </ButtonLink>
            </div>
          </div>
          <div className="afc-gateway__panel" aria-label="AFC learning features">
            <div>
              <GraduationCap />
              <span>Guided learning paths</span>
            </div>
            <div>
              <BookOpenCheck />
              <span>Course materials, quizzes, and practical assignments</span>
            </div>
            <div>
              <ShieldCheck />
              <span>Integrity-aware assessment and progress records</span>
            </div>
          </div>
        </section>
        <p className="afc-gateway__notice">
          AFC uses the same AuraFlow account, protected workspace, and support team. Learners
          only see their own progress, submissions, and certificates.
        </p>
      </main>
    </PageWrapper>
  )
}
