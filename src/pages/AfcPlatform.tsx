import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CirclePlay,
  Clock3,
  GraduationCap,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react'
import { useMemo, useState, type FormEvent, type PropsWithChildren } from 'react'
import { FcGoogle } from 'react-icons/fc'
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button, ButtonLink } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { Input, Select, Textarea } from '../components/ui/Input'
import { PasswordInput } from '../components/ui/PasswordInput'
import { StatePanel } from '../components/ui/StatePanel'
import { useAuth } from '../context/AuthContext'
import {
  useAfcAllEnrollmentRequests,
  useAfcAllSubmissions,
  useAfcCertificates,
  useAfcCourses,
  useAfcEnrollments,
} from '../hooks/useFirebase'
import {
  createAfcStarterCourses,
  decideAfcEnrollmentRequest,
  afcYoutubeEmbedUrl,
  requestAfcEnrollment,
  reviewAfcSubmission,
  saveAfcCourse,
  toggleAfcLesson,
} from '../lib/afc'
import { loginWithEmail, loginWithGoogle, registerWithEmail } from '../lib/auth'
import { firebaseConfigured } from '../lib/firebase'
import { asErrorMessage } from '../lib/utils'
import type { AfcCourse, AfcCourseLevel } from '../types'

const fields = [
  'Software development',
  'Data & analytics',
  'AI & machine learning',
  'Product design',
  'Mobile development',
]

function coursePrice(course: AfcCourse) {
  return course.priceGhs === 0 ? 'Free to start' : `GHS ${course.priceGhs}`
}

function AfcBrand() {
  return (
    <Link className="afc-brand" to="/afc" aria-label="AuraFlow Class home">
      <span className="afc-brand__mark"><GraduationCap /></span>
      <span>AFC</span><small>AuraFlow Class</small>
    </Link>
  )
}

function AfcShell({ children, learner = false }: PropsWithChildren<{ learner?: boolean }>) {
  const { user, admin, loading, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  async function signOut() {
    try {
      await logout()
      navigate('/afc')
    } catch (error) {
      toast.error(asErrorMessage(error))
    }
  }
  const navigation = learner
    ? [
        { to: '/afc/learn', label: 'My learning', Icon: LayoutDashboard },
        { to: '/afc/catalog', label: 'Catalog', Icon: Library },
        { to: '/afc/certificates', label: 'Credentials', Icon: Award },
        ...(admin ? [{ to: '/afc/teach', label: 'Teach', Icon: UsersRound }] : []),
      ]
    : [
        { to: '/afc/catalog', label: 'Explore programs', Icon: Search },
        { to: '/afc/about', label: 'How AFC works', Icon: CirclePlay },
      ]
  return (
    <div className="afc-app">
      <header className="afc-topbar">
        <AfcBrand />
        <nav className={menuOpen ? 'afc-nav afc-nav--open' : 'afc-nav'} aria-label="AFC navigation">
          {navigation.map(({ to, label, Icon }) => (
            <Link key={to} to={to} onClick={() => setMenuOpen(false)}>
              <Icon /> {label}
            </Link>
          ))}
        </nav>
        <div className="afc-topbar__actions">
          {!loading && user ? (
            <>
              <Link className="afc-user-link" to="/afc/learn">
                <span>{(user.displayName || user.email || 'L').slice(0, 1).toUpperCase()}</span>
                <b>{user.displayName || 'My learning'}</b>
              </Link>
              <button className="afc-icon-button" onClick={() => void signOut()} aria-label="Sign out of AFC"><LogOut /></button>
            </>
          ) : (
            <>
              <Link className="afc-login-link" to="/afc/login">Log in</Link>
              <ButtonLink to="/afc/register" className="afc-join-button">Join AFC</ButtonLink>
            </>
          )}
          <button className="afc-menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle AFC navigation">
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      {children}
    </div>
  )
}

function AfcFooter() {
  return (
    <footer className="afc-footer">
      <div><AfcBrand /><p>Practical technology education, built from Ghana for learners everywhere.</p></div>
      <div><strong>Learn</strong><Link to="/afc/catalog">Explore programs</Link><Link to="/afc/about">How AFC works</Link></div>
      <div><strong>AuraFlow</strong><Link to="/">Business platform</Link><Link to="/contact">Contact the team</Link></div>
    </footer>
  )
}

function CourseCard({ course, action = 'View program' }: { course: AfcCourse; action?: string }) {
  return (
    <article className="afc-course-card-v2">
      <img src={course.coverImage} alt="" loading="lazy" />
      <div className="afc-course-card-v2__body">
        <span className="afc-course-card-v2__label">{course.category}</span>
        <h3>{course.title}</h3>
        <p>{course.summary}</p>
        <div className="afc-course-card-v2__meta"><span><Clock3 /> {course.estimatedHours} hours</span><span>{course.level}</span></div>
        <Link to={`/afc/course/${course.slug}`} className="afc-card-link">{action} <ArrowRight /></Link>
      </div>
    </article>
  )
}

function Landing() {
  const courses = useAfcCourses().data
  const featured = courses.slice(0, 3)
  return (
    <AfcShell>
      <main>
        <section className="afc-hero">
          <div className="afc-hero__copy">
            <p className="afc-kicker">AuraFlow Class</p>
            <h1>Build skills that hold up in real work.</h1>
            <p>Structured learning in software, data, AI, product, and digital business. Study at your pace, prove what you can do, and keep your work in one private place.</p>
            <div className="afc-hero__actions"><ButtonLink to="/afc/catalog">Explore learning paths <ArrowRight /></ButtonLink><ButtonLink to="/afc/about" variant="secondary">See how AFC works</ButtonLink></div>
            <div className="afc-hero__trust"><span><CheckCircle2 /> Practical assignments</span><span><ShieldCheck /> Integrity-aware assessment</span></div>
          </div>
          <div className="afc-hero__visual" aria-label="AFC learning experience preview">
            <div className="afc-hero__visual-bar"><span /><span /><span /><b>Today&apos;s focus</b></div>
            <div className="afc-hero__visual-content"><p>Software engineering</p><h2>Build an interface system</h2><div className="afc-video-block"><Play fill="currentColor" /><span>Lesson video and guided notes</span></div><div className="afc-progress-line"><i /></div><small>2 of 5 lessons complete</small></div>
            <div className="afc-hero__certificate"><Award /><span>Verified work, not just watch time</span></div>
          </div>
        </section>
        <section className="afc-section afc-section--formats">
          <div className="afc-section-heading-v2"><div><p className="afc-kicker">Choose a format</p><h2>Start small. Build toward a role.</h2></div><Link to="/afc/catalog">Browse all learning <ChevronRight /></Link></div>
          <div className="afc-format-grid">
            <article><Clock3 /><h3>Short courses</h3><p>Focused lessons for one practical skill, with a clear outcome and a manageable pace.</p></article>
            <article><Library /><h3>Learning paths</h3><p>Sequenced courses that build a coherent capability across a specialist area.</p></article>
            <article><Award /><h3>Career certificates</h3><p>Evidence-led programs combining assessed work, review, and a verifiable record.</p></article>
          </div>
        </section>
        <section className="afc-section afc-section--catalog">
          <div className="afc-section-heading-v2"><div><p className="afc-kicker">Available now</p><h2>Made for the work you want to do.</h2></div><Link to="/afc/catalog">Explore catalog <ArrowRight /></Link></div>
          {featured.length ? <div className="afc-course-grid-v2">{featured.map((course) => <CourseCard course={course} key={course.id} />)}</div> : <StatePanel loading />}
        </section>
        <section className="afc-section afc-section--integrity">
          <div><p className="afc-kicker">Meaningful credentials</p><h2>Learning that is visible, reviewable, and yours.</h2><p>AFC keeps completion, submitted work, instructor feedback, and issued credentials separate for every learner. That creates a useful learning record without exposing it to other students.</p></div>
          <ul><li><CheckCircle2 /> Clearly scoped outcomes and assignments</li><li><CheckCircle2 /> Timed and reviewed assessments as courses require them</li><li><CheckCircle2 /> Private learner records and certificate codes</li></ul>
        </section>
      </main>
      <AfcFooter />
    </AfcShell>
  )
}

function Catalog() {
  const { data: courses, isLoading } = useAfcCourses()
  const [search, setSearch] = useState('')
  const [field, setField] = useState('All subjects')
  const [level, setLevel] = useState('All levels')
  const filtered = useMemo(() => courses.filter((course) => {
    const haystack = `${course.title} ${course.summary} ${course.category}`.toLowerCase()
    return (!search || haystack.includes(search.toLowerCase())) && (field === 'All subjects' || course.category === field) && (level === 'All levels' || course.level === level)
  }), [courses, field, level, search])
  return <AfcShell><main className="afc-page"><section className="afc-page-intro"><p className="afc-kicker">Course catalog</p><h1>Find the next useful thing to learn.</h1><p>Browse practical technology programs by role, subject, level, and pace.</p></section><section className="afc-catalog-controls" aria-label="Course filters"><label><Search /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search skills, courses, and topics" /></label><Select value={field} onChange={(event) => setField(event.target.value)}><option>All subjects</option>{fields.map((item) => <option key={item}>{item}</option>)}</Select><Select value={level} onChange={(event) => setLevel(event.target.value)}><option>All levels</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></Select></section><div className="afc-catalog-result"><span>{filtered.length} {filtered.length === 1 ? 'program' : 'programs'} available</span></div>{isLoading ? <StatePanel loading /> : filtered.length ? <section className="afc-course-grid-v2">{filtered.map((course) => <CourseCard course={course} key={course.id} />)}</section> : <StatePanel title="No programs match those filters." description="Try a wider search or clear one of the filters." />}</main><AfcFooter /></AfcShell>
}

function CourseDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: courses, isLoading } = useAfcCourses()
  const { data: enrolments } = useAfcEnrollments(user?.uid)
  const [busy, setBusy] = useState(false)
  const course = courses.find((item) => item.slug === slug)
  const enrolled = course ? enrolments.find((item) => item.courseId === course.id && item.status === 'active') : undefined
  async function enroll() {
    if (!course) return
    if (!user) { navigate('/afc/register', { state: { from: { pathname: `/afc/course/${course.slug}` } } }); return }
    setBusy(true)
    try {
      const result = await requestAfcEnrollment(course)
      toast.success(result === 'enrolled' ? 'You are enrolled. Your learning space is ready.' : 'Your enrollment request is with the AFC team.')
      if (result === 'enrolled') navigate(`/afc/learn/${course.id}`)
    } catch (error) { toast.error(asErrorMessage(error)) } finally { setBusy(false) }
  }
  if (isLoading) return <AfcShell><StatePanel loading /></AfcShell>
  if (!course) return <Navigate to="/afc/catalog" replace />
  return <AfcShell><main className="afc-course-detail"><section className="afc-course-detail__hero"><div><Link className="afc-breadcrumb" to="/afc/catalog">Catalog <ChevronRight /> {course.category}</Link><p className="afc-kicker">{course.level} course</p><h1>{course.title}</h1><p>{course.summary}</p><div className="afc-course-detail__stats"><span><Clock3 /> {course.estimatedHours} hours</span><span><BookOpen /> {course.lessons.length} lessons</span><span><GraduationCap /> {course.instructorName}</span></div></div><aside><img src={course.coverImage} alt="" /><strong>{coursePrice(course)}</strong><p>{course.priceGhs === 0 ? 'Access learning materials and begin today.' : 'Request enrollment; the AFC team confirms access before any paid entitlement.'}</p>{enrolled ? <ButtonLink to={`/afc/learn/${course.id}`}><Play /> Continue learning</ButtonLink> : <Button onClick={() => void enroll()} loading={busy}>{course.priceGhs === 0 ? 'Enroll free' : 'Request enrollment'} <ArrowRight /></Button>}</aside></section><section className="afc-course-detail__grid"><div><h2>What you will learn</h2><ul className="afc-outcome-list">{course.outcomes.map((outcome) => <li key={outcome}><CheckCircle2 /> {outcome}</li>)}</ul><h2>Course content</h2><ol className="afc-curriculum">{course.lessons.map((lesson, index) => <li key={lesson.id}><span>{String(index + 1).padStart(2, '0')}</span><div><b>{lesson.title}</b><p>{lesson.summary}</p></div><small>{lesson.durationMinutes} min</small></li>)}</ol></div><aside className="afc-course-detail__instructor"><span>Instructor</span><h3>{course.instructorName}</h3><p>AFC instructors connect concepts to projects and working systems, with review where the program calls for it.</p></aside></section></main><AfcFooter /></AfcShell>
}

function AfcGuard({ children }: PropsWithChildren) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <AfcShell><StatePanel loading /></AfcShell>
  if (!user) return <Navigate to="/afc/login" replace state={{ from: location }} />
  return <>{children}</>
}

function LearnerHome() {
  const { user } = useAuth()
  const { data: courses, isLoading } = useAfcCourses()
  const { data: enrollments } = useAfcEnrollments(user?.uid)
  const active = enrollments.filter((item) => item.status === 'active')
  const courseMap = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses])
  return <AfcShell learner><main className="afc-learner"><section className="afc-learner__welcome"><div><p className="afc-kicker">My learning</p><h1>Welcome back, {user?.displayName?.split(' ')[0] || 'learner'}.</h1><p>Pick up a lesson, review your feedback, or choose your next learning path.</p></div><ButtonLink to="/afc/catalog" variant="secondary"><Search /> Explore catalog</ButtonLink></section><section className="afc-learning-summary"><article><span>Active programs</span><strong>{active.length}</strong></article><article><span>Lessons completed</span><strong>{active.reduce((sum, item) => sum + item.completedLessonIds.length, 0)}</strong></article><article><span>Average progress</span><strong>{active.length ? Math.round(active.reduce((sum, item) => sum + item.progress, 0) / active.length) : 0}%</strong></article></section>{isLoading ? <StatePanel loading /> : active.length ? <section className="afc-continue"><div className="afc-section-heading-v2"><div><p className="afc-kicker">Continue learning</p><h2>Your current programs</h2></div></div><div className="afc-enrollment-grid">{active.map((enrollment) => { const course = courseMap.get(enrollment.courseId); return course ? <article key={enrollment.id}><img src={course.coverImage} alt="" /><div><span>{course.category}</span><h3>{course.title}</h3><p>{enrollment.completedLessonIds.length} of {course.lessons.length} lessons complete</p><div className="afc-progress-track"><i style={{ width: `${enrollment.progress}%` }} /></div><ButtonLink to={`/afc/learn/${course.id}`}>Resume <ArrowRight /></ButtonLink></div></article> : null })}</div></section> : <section className="afc-empty-learning"><Sparkles /><h2>Start with a course that fits your next goal.</h2><p>Your progress, submissions, feedback, and certificates will appear here privately as you learn.</p><ButtonLink to="/afc/catalog">Explore programs <ArrowRight /></ButtonLink></section>}</main></AfcShell>
}

function CoursePlayer() {
  const { courseId } = useParams()
  const { user } = useAuth()
  const { data: courses, isLoading } = useAfcCourses()
  const { data: enrollments } = useAfcEnrollments(user?.uid)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const course = courses.find((item) => item.id === courseId)
  const enrollment = enrollments.find((item) => item.courseId === courseId && item.status === 'active')
  const selected = course?.lessons.find((lesson) => lesson.id === (selectedId || course.lessons[0]?.id))
  const videoEmbed = afcYoutubeEmbedUrl(selected?.videoUrl)
  async function complete() {
    if (!course || !enrollment || !selected) return
    setBusy(true)
    try { await toggleAfcLesson(enrollment, course, selected.id) } catch (error) { toast.error(asErrorMessage(error)) } finally { setBusy(false) }
  }
  if (isLoading) return <AfcShell learner><StatePanel loading /></AfcShell>
  if (!course || !enrollment) return <Navigate to={course ? `/afc/course/${course.slug}` : '/afc/catalog'} replace />
  const completeLesson = enrollment.completedLessonIds.includes(selected?.id || '')
  return <AfcShell learner><main className="afc-player"><aside className="afc-player__rail"><Link to="/afc/learn"><ChevronRight className="afc-player__back" /> My learning</Link><p>{course.category}</p><h2>{course.title}</h2><div className="afc-player__progress"><span>Course progress</span><strong>{enrollment.progress}%</strong><div className="afc-progress-track"><i style={{ width: `${enrollment.progress}%` }} /></div></div><ol>{course.lessons.map((lesson, index) => <li key={lesson.id}><button onClick={() => setSelectedId(lesson.id)} className={lesson.id === selected?.id ? 'is-active' : ''}><span>{enrollment.completedLessonIds.includes(lesson.id) ? <CheckCircle2 /> : String(index + 1).padStart(2, '0')}</span><div><b>{lesson.title}</b><small>{lesson.durationMinutes} min</small></div></button></li>)}</ol></aside><section className="afc-player__main"><div className="afc-player__lesson-meta"><span>Lesson {course.lessons.findIndex((lesson) => lesson.id === selected?.id) + 1}</span><span>{selected?.durationMinutes} minutes</span></div><div className="afc-player__video">{videoEmbed ? <iframe title={`${selected?.title || 'Lesson'} video`} src={videoEmbed} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : <><img src={course.coverImage} alt="" /><div><CirclePlay /><span>Lesson media is released by your instructor here.</span></div></>}</div><article><h1>{selected?.title}</h1><p>{selected?.summary}</p><div className="afc-player__notes"><h3>Before you continue</h3><p>Use this space for the lesson instructions, resources, and practical context. Course media and materials are supplied through instructor publishing, not exposed through public catalog pages.</p></div><Button onClick={() => void complete()} loading={busy} variant={completeLesson ? 'secondary' : 'primary'}>{completeLesson ? 'Mark as not complete' : 'Mark lesson complete'} <CheckCircle2 /></Button></article></section></main></AfcShell>
}

function Certificates() {
  const { user } = useAuth()
  const { data: courses } = useAfcCourses()
  const { data: certificates } = useAfcCertificates(user?.uid)
  const map = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses])
  return <AfcShell learner><main className="afc-page"><section className="afc-page-intro"><p className="afc-kicker">Credential wallet</p><h1>Your AFC records.</h1><p>Certificates are issued only after the appropriate course completion and review process.</p></section>{certificates.length ? <section className="afc-certificate-grid-v2">{certificates.map((certificate) => <article key={certificate.id}><Award /><span>AuraFlow Class certificate</span><h2>{map.get(certificate.courseId)?.title || 'Learning program'}</h2><p>Certificate code</p><code>{certificate.certificateCode}</code></article>)}</section> : <section className="afc-empty-learning"><Award /><h2>No certificates have been issued yet.</h2><p>Keep learning. When a course has completion and review requirements, your issued credential will appear here.</p><ButtonLink to="/afc/learn">Open my learning</ButtonLink></section>}</main></AfcShell>
}

function Instructor() {
  const { admin } = useAuth()
  const coursesQuery = useAfcCourses(true)
  const requestsQuery = useAfcAllEnrollmentRequests(admin)
  const submissionsQuery = useAfcAllSubmissions(admin)
  const [busy, setBusy] = useState(false)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [lessons, setLessons] = useState('')
  if (!admin) return <Navigate to="/afc/learn" replace />
  async function provision() { setBusy(true); try { await createAfcStarterCourses(); await coursesQuery.refetch(); toast.success('Starter AFC curriculum is available.'); } catch (error) { toast.error(asErrorMessage(error)) } finally { setBusy(false) } }
  async function publish(event: FormEvent) { event.preventDefault(); const lessonItems = lessons.split('\n').map((item) => item.trim()).filter(Boolean); if (!lessonItems.length) { toast.error('Add at least one lesson.'); return }; setBusy(true); try { const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); const parsedLessons = lessonItems.map((item, index) => { const [lessonTitle, rawVideoUrl, rawMinutes] = item.split('|').map((part) => part.trim()); return { id: `lesson-${index + 1}`, title: lessonTitle, summary: 'Instructor notes will be published here.', durationMinutes: Number(rawMinutes) || 45, ...(rawVideoUrl ? { videoUrl: rawVideoUrl } : {}) } }); await saveAfcCourse({ title, slug, summary, category: 'Software development', level: 'Beginner' as AfcCourseLevel, priceGhs: 0, instructorName: 'AuraFlow Class', coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&q=85', published: true, estimatedHours: Math.max(1, parsedLessons.reduce((total, lesson) => total + lesson.durationMinutes, 0) / 60), outcomes: ['Apply the material in a practical setting'], lessons: parsedLessons }); setTitle(''); setSummary(''); setLessons(''); await coursesQuery.refetch(); toast.success('Course published.'); } catch (error) { toast.error(asErrorMessage(error)) } finally { setBusy(false) } }
  async function decide(id: string, decision: 'approved' | 'declined') { const request = requestsQuery.data.find((item) => item.id === id); if (!request) return; setBusy(true); try { await decideAfcEnrollmentRequest(request, decision); toast.success(decision === 'approved' ? 'Enrollment approved.' : 'Enrollment declined.'); } catch (error) { toast.error(asErrorMessage(error)) } finally { setBusy(false) } }
  async function release(submissionId: string) { setBusy(true); try { await reviewAfcSubmission(submissionId, { status: 'reviewed', score: 70, reviewerNote: 'Reviewed by AuraFlow Class. Open the assignment feedback to continue improving your work.' }); toast.success('Feedback released.'); } catch (error) { toast.error(asErrorMessage(error)) } finally { setBusy(false) } }
  return <AfcShell learner><main className="afc-instructor"><section className="afc-page-intro"><p className="afc-kicker">Instructor operations</p><h1>Publish learning. Review evidence.</h1><p>Manage what learners see, decide enrollment requests, and release feedback without accessing unrelated AuraFlow workspace data.</p></section><section className="afc-operations-grid"><article><span>Published courses</span><strong>{coursesQuery.data.filter((course) => course.published).length}</strong></article><article><span>Enrollment requests</span><strong>{requestsQuery.data.filter((request) => request.status === 'submitted').length}</strong></article><article><span>Awaiting review</span><strong>{submissionsQuery.data.filter((submission) => submission.status === 'submitted').length}</strong></article></section><section className="afc-teach-grid"><form className="afc-author-form" onSubmit={(event) => void publish(event)}><div className="afc-section-heading-v2"><div><p className="afc-kicker">Course authoring</p><h2>Publish a focused course</h2></div><Button type="button" variant="secondary" onClick={() => void provision()} loading={busy}>Provision starter curriculum</Button></div><Field label="Course title"><Input value={title} onChange={(event) => setTitle(event.target.value)} minLength={4} maxLength={140} required /></Field><Field label="Course summary"><Textarea value={summary} onChange={(event) => setSummary(event.target.value)} minLength={20} maxLength={2400} required /></Field><Field label="Lessons, one per line" hint="Use: Lesson title | YouTube URL | minutes. Video and minutes are optional."><Textarea value={lessons} onChange={(event) => setLessons(event.target.value)} required placeholder="First concept | https://youtu.be/example-id | 35\nGuided practice | | 45\nApplied review" /></Field><Button type="submit" loading={busy}>Publish course <ArrowRight /></Button></form><div className="afc-operations-list"><div><p className="afc-kicker">Enrollment queue</p><h2>Requests to decide</h2>{requestsQuery.data.filter((request) => request.status === 'submitted').length ? requestsQuery.data.filter((request) => request.status === 'submitted').map((request) => <article key={request.id}><div><b>{request.courseId}</b><span>Learner {request.userId.slice(0, 8)}</span></div><div><Button disabled={busy} onClick={() => void decide(request.id, 'approved')}>Approve</Button><Button disabled={busy} variant="secondary" onClick={() => void decide(request.id, 'declined')}>Decline</Button></div></article>) : <p>No paid enrollment requests are waiting.</p>}</div><div><p className="afc-kicker">Review queue</p><h2>Submitted work</h2>{submissionsQuery.data.filter((submission) => submission.status === 'submitted').length ? submissionsQuery.data.filter((submission) => submission.status === 'submitted').map((submission) => <article key={submission.id}><div><b>{submission.title}</b><span>{submission.courseId}</span></div><Button disabled={busy} onClick={() => void release(submission.id)}>Release review</Button></article>) : <p>No submissions are waiting.</p>}</div></div></section></main></AfcShell>
}

function About() {
  return <AfcShell><main className="afc-page afc-about"><section className="afc-page-intro"><p className="afc-kicker">How AFC works</p><h1>Education designed around application.</h1><p>AFC combines flexible learning with clear expectations, practical evidence, feedback, and records that belong to each learner.</p></section><div className="afc-format-grid"><article><span>01</span><h3>Discover a path</h3><p>Use the catalog to compare subject, level, effort, and the practical outcome you want.</p></article><article><span>02</span><h3>Learn with structure</h3><p>Move through lessons and materials at a pace that works, with progress stored privately.</p></article><article><span>03</span><h3>Show the work</h3><p>Complete assessed work when a course requires it, then receive instructor review and a credential where earned.</p></article></div></main><AfcFooter /></AfcShell>
}

function AfcAuth({ mode }: { mode: 'login' | 'register' }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [pending, setPending] = useState<'email' | 'google' | null>(null)
  const [error, setError] = useState('')
  const [terms, setTerms] = useState(false)
  const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/afc/learn'
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const password = String(form.get('password')); if (mode === 'register' && !terms) { setError('Please accept the AFC terms before creating an account.'); return }; if (mode === 'register' && password !== String(form.get('confirm'))) { setError('The password confirmation does not match.'); return }; setPending('email'); setError(''); try { if (mode === 'login') await loginWithEmail(String(form.get('email')), password, form.has('remember')); else await registerWithEmail(String(form.get('name')), String(form.get('email')), password); } catch (reason) { setError(asErrorMessage(reason)) } finally { setPending(null) } }
  async function google() { if (mode === 'register' && !terms) { setError('Please accept the AFC terms before continuing with Google.'); return }; setPending('google'); setError(''); try { await loginWithGoogle() } catch (reason) { setError(asErrorMessage(reason)) } finally { setPending(null) } }
  if (user && !loading && !pending) return <Navigate to={destination} replace />
  const registration = mode === 'register'
  return <AfcShell><main className="afc-auth-page"><section><AfcBrand /><p className="afc-kicker">{registration ? 'Start learning with AFC' : 'Welcome back'}</p><h1>{registration ? 'Build a learning record you can use.' : 'Continue your learning.'}</h1><p>AFC is AuraFlow&apos;s focused education environment. Your learning profile is separate from client projects and private to your account.</p><ul><li><CheckCircle2 /> Track structured courses and evidence of work</li><li><CheckCircle2 /> Keep assignments, feedback, and credentials private</li><li><CheckCircle2 /> Access AuraFlow support when you need it</li></ul></section><section className="afc-auth-card"><p className="afc-kicker">{registration ? 'Create account' : 'Sign in'}</p><h2>{registration ? 'Join AuraFlow Class' : 'Welcome back'}</h2>{!firebaseConfigured ? <p className="inline-alert error">AFC account services are temporarily unavailable.</p> : null}{error ? <p className="inline-alert error">{error}</p> : null}<Button className="w-full" variant="secondary" onClick={() => void google()} loading={pending === 'google'} disabled={Boolean(pending) || !firebaseConfigured}><FcGoogle size={18} /> Continue with Google</Button><div className="auth-divider">or use your email</div><form className="auth-form" onSubmit={(event) => void submit(event)}>{registration ? <Field label="Full name"><Input name="name" autoComplete="name" required maxLength={120} /></Field> : null}<Field label="Email address"><Input type="email" name="email" autoComplete="username" required maxLength={254} /></Field><Field label="Password"><PasswordInput name="password" autoComplete={registration ? 'new-password' : 'current-password'} required maxLength={128} /></Field>{registration ? <Field label="Confirm password"><PasswordInput name="confirm" autoComplete="new-password" required maxLength={128} /></Field> : <label className="check-label"><input type="checkbox" name="remember" defaultChecked /> Keep me signed in on this device</label>}{registration ? <label className="check-label"><input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} /> I agree to the AFC <Link to="/terms" target="_blank">Terms</Link> and <Link to="/privacy" target="_blank">Privacy Policy</Link>.</label> : <Link className="auth-text-link" to="/forgot-password">Forgot your password?</Link>}<Button type="submit" loading={pending === 'email'} disabled={Boolean(pending) || !firebaseConfigured}>{registration ? 'Create AFC account' : 'Sign in to AFC'} <ArrowRight /></Button></form><p className="auth-switch">{registration ? 'Already have an AFC account?' : 'New to AFC?'} <Link className="auth-text-link" to={registration ? '/afc/login' : '/afc/register'} state={location.state}>{registration ? 'Sign in' : 'Create an account'}</Link></p></section></main></AfcShell>
}

export default function AfcPlatform() {
  return <Routes><Route index element={<Landing />} /><Route path="catalog" element={<Catalog />} /><Route path="course/:slug" element={<CourseDetail />} /><Route path="about" element={<About />} /><Route path="login" element={<AfcAuth mode="login" />} /><Route path="register" element={<AfcAuth mode="register" />} /><Route path="learn" element={<AfcGuard><LearnerHome /></AfcGuard>} /><Route path="learn/:courseId" element={<AfcGuard><CoursePlayer /></AfcGuard>} /><Route path="certificates" element={<AfcGuard><Certificates /></AfcGuard>} /><Route path="teach" element={<AfcGuard><Instructor /></AfcGuard>} /><Route path="*" element={<Navigate to="/afc" replace />} /></Routes>
}
