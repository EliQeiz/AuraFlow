import {
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  GraduationCap,
  LibraryBig,
  MessageSquare,
  Plus,
  ShieldCheck,
  Sparkles,
  Upload,
  UsersRound,
} from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { StatePanel } from '../../components/ui/StatePanel'
import { useAuth } from '../../context/AuthContext'
import { displayDate } from '../../domain/projects'
import {
  createAfcStarterCourses,
  decideAfcEnrollmentRequest,
  issueAfcCertificate,
  requestAfcEnrollment,
  reviewAfcSubmission,
  saveAfcCourse,
  submitAfcAssignment,
  toggleAfcLesson,
} from '../../lib/afc'
import { asErrorMessage } from '../../lib/utils'
import { uploadPrivateMedia } from '../../lib/media'
import {
  useAfcAllEnrollmentRequests,
  useAfcAllSubmissions,
  useAfcCertificates,
  useAfcCourses,
  useAfcEnrollments,
  useAfcEnrollmentRequests,
  useAfcSubmissions,
} from '../../hooks/useFirebase'
import type { AfcCourse, AfcCourseLevel, AfcSubmission } from '../../types'

type View = 'discover' | 'learning' | 'assignments' | 'certificates' | 'instructor'

const tabs: Array<{ id: View; label: string; Icon: typeof Compass }> = [
  { id: 'discover', label: 'Discover', Icon: Compass },
  { id: 'learning', label: 'My learning', Icon: BookOpen },
  { id: 'assignments', label: 'Assignments', Icon: ClipboardCheck },
  { id: 'certificates', label: 'Certificates', Icon: Award },
]

function courseValue(course: AfcCourse) {
  return course.priceGhs === 0 ? 'Free' : `GHS ${course.priceGhs}`
}

function CourseBuilder({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Software development')
  const [level, setLevel] = useState<AfcCourseLevel>('Beginner')
  const [price, setPrice] = useState('0')
  const [summary, setSummary] = useState('')
  const [outcomes, setOutcomes] = useState('')
  const [lessons, setLessons] = useState('')

  async function save(event: FormEvent) {
    event.preventDefault()
    const lessonItems = lessons
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
    const slug = title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    if (!lessonItems.length) {
      toast.error('Add at least one lesson.')
      return
    }
    setBusy(true)
    try {
      await saveAfcCourse({
        title,
        slug,
        category,
        level,
        priceGhs: Number(price),
        summary,
        instructorName: 'AuraFlow Class',
        coverImage:
          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&q=85',
        published: true,
        estimatedHours: Math.max(1, Math.ceil(lessonItems.length * 0.75)),
        outcomes: outcomes
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 8),
        lessons: lessonItems.slice(0, 50).map((item, index) => ({
          id: `lesson-${index + 1}`,
          title: item,
          summary: 'Lesson details will be added by the instructor.',
          durationMinutes: 45,
        })),
      })
      toast.success('Course published to the AFC catalog.')
      onSaved()
      onClose()
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="afc-form-grid">
      <label>
        Course title
        <Input value={title} onChange={(event) => setTitle(event.target.value)} required />
      </label>
      <label>
        Learning level
        <Select value={level} onChange={(event) => setLevel(event.target.value as AfcCourseLevel)}>
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
        </Select>
      </label>
      <label>
        Category
        <Input value={category} onChange={(event) => setCategory(event.target.value)} required />
      </label>
      <label>
        Price in GHS
        <Input type="number" min="0" max="100000" value={price} onChange={(event) => setPrice(event.target.value)} required />
      </label>
      <label className="afc-form-grid__wide">
        What will learners be able to do?
        <Textarea value={summary} onChange={(event) => setSummary(event.target.value)} minLength={20} maxLength={2400} required />
      </label>
      <label>
        Outcomes, one per line
        <Textarea value={outcomes} onChange={(event) => setOutcomes(event.target.value)} placeholder="Build responsive interfaces&#10;Review accessibility" />
      </label>
      <label>
        Lesson titles, one per line
        <Textarea value={lessons} onChange={(event) => setLessons(event.target.value)} placeholder="Design foundations&#10;React component patterns" required />
      </label>
      <div className="afc-form-grid__wide flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={busy}><Upload /> Publish course</Button>
      </div>
    </form>
  )
}

function SubmissionReview({
  submission,
  onDone,
}: {
  submission: AfcSubmission
  onDone: () => void
}) {
  const [score, setScore] = useState(String(submission.score ?? 70))
  const [note, setNote] = useState(submission.reviewerNote ?? '')
  const [busy, setBusy] = useState(false)
  async function review(status: 'reviewed' | 'returned') {
    setBusy(true)
    try {
      await reviewAfcSubmission(submission.id, { status, score: Number(score), reviewerNote: note })
      toast.success(status === 'reviewed' ? 'Feedback released to learner.' : 'Submission returned for revision.')
      onDone()
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="afc-review-form">
      <Input type="number" min="0" max="100" value={score} onChange={(event) => setScore(event.target.value)} aria-label="Score" />
      <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Write clear, constructive feedback." />
      <div className="flex flex-wrap gap-2">
        <Button loading={busy} onClick={() => void review('reviewed')}>Release feedback</Button>
        <Button disabled={busy} variant="secondary" onClick={() => void review('returned')}>Request revision</Button>
      </div>
    </div>
  )
}

export default function AfcWorkspace() {
  const { admin, user } = useAuth()
  const [view, setView] = useState<View>('discover')
  const [courseBuilderOpen, setCourseBuilderOpen] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [assignmentCourseId, setAssignmentCourseId] = useState('')
  const [assignmentTitle, setAssignmentTitle] = useState('')
  const [assignmentResponse, setAssignmentResponse] = useState('')
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const coursesQuery = useAfcCourses(admin)
  const enrolmentsQuery = useAfcEnrollments(user?.uid)
  const submissionsQuery = useAfcSubmissions(user?.uid)
  const certificatesQuery = useAfcCertificates(user?.uid)
  const requestsQuery = useAfcEnrollmentRequests(user?.uid)
  const adminSubmissions = useAfcAllSubmissions(admin)
  const adminRequests = useAfcAllEnrollmentRequests(admin)
  const courses = coursesQuery.data
  const courseById = useMemo(
    () => new Map(courses.map((course) => [course.id, course])),
    [courses],
  )
  const activeEnrolments = enrolmentsQuery.data.filter((item) => item.status === 'active')
  const selectedCourse = courseById.get(selectedCourseId || '')
  const selectedEnrollment = activeEnrolments.find((item) => item.courseId === selectedCourse?.id)

  async function provisionStarterCourses() {
    setBusy(true)
    try {
      await createAfcStarterCourses()
      toast.success('Starter AFC curriculum is ready for learners.')
      await coursesQuery.refetch()
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  async function enrol(course: AfcCourse) {
    setBusy(true)
    try {
      const result = await requestAfcEnrollment(course)
      toast.success(result === 'enrolled' ? 'Course added to My learning.' : 'Your enrolment request was sent to AuraFlow.')
      await Promise.all([enrolmentsQuery.refetch(), requestsQuery.refetch()])
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  async function submitAssignment(event: FormEvent) {
    event.preventDefault()
    if (!assignmentCourseId) {
      toast.error('Choose a course before sending your work.')
      return
    }
    setBusy(true)
    try {
      const attachmentPath = assignmentFile
        ? await uploadPrivateMedia(
            `afc/submissions/${user!.uid}/${assignmentCourseId}/${crypto.randomUUID()}-${assignmentFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
            assignmentFile,
          )
        : undefined
      await submitAfcAssignment({
        courseId: assignmentCourseId,
        title: assignmentTitle,
        response: assignmentResponse,
        attachmentPath,
      })
      setAssignmentTitle('')
      setAssignmentResponse('')
      setAssignmentFile(null)
      toast.success('Assignment submitted for review.')
      await submissionsQuery.refetch()
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="afc-workspace">
      <section className="afc-workspace__hero">
        <div>
          <p className="eyebrow"><GraduationCap size={14} /> AuraFlow Class</p>
          <h1>Learn the work behind great digital products.</h1>
          <p>Courses, practical submissions, feedback, and progress records live in the same AuraFlow account you use to build with us.</p>
        </div>
        <div className="afc-workspace__hero-metrics">
          <span><strong>{courses.length}</strong> published courses</span>
          <span><strong>{activeEnrolments.length}</strong> active learning paths</span>
          <span><strong>{certificatesQuery.data.length}</strong> certificates earned</span>
        </div>
      </section>

      <nav className="afc-tabs" aria-label="AuraFlow Class navigation">
        {tabs.map(({ id, label, Icon }) => (
          <button key={id} aria-current={view === id ? 'page' : undefined} onClick={() => setView(id)}>
            <Icon size={15} /> {label}
          </button>
        ))}
        {admin && (
          <button aria-current={view === 'instructor' ? 'page' : undefined} onClick={() => setView('instructor')}>
            <ShieldCheck size={15} /> Instructor studio
          </button>
        )}
      </nav>

      {coursesQuery.isPending ? <StatePanel loading /> : null}
      {coursesQuery.error ? <StatePanel error={coursesQuery.error} retry={() => void coursesQuery.refetch()} /> : null}

      {!coursesQuery.isPending && !coursesQuery.error && view === 'discover' && (
        <section>
          <div className="afc-section-heading">
            <div><p className="eyebrow">Course catalog</p><h2>Build capability that travels with you.</h2></div>
            {admin && <Button loading={busy} variant="secondary" onClick={() => void provisionStarterCourses()}><Sparkles /> Provision starter curriculum</Button>}
          </div>
          {courses.length ? (
            <div className="afc-course-grid">
              {courses.filter((course) => course.published || admin).map((course) => {
                const enrollment = activeEnrolments.find((item) => item.courseId === course.id)
                const requested = requestsQuery.data.some((item) => item.courseId === course.id && item.status === 'submitted')
                return <article className="afc-course-card" key={course.id}>
                  <img src={course.coverImage} alt="" loading="lazy" />
                  <div className="afc-course-card__body">
                    <div className="afc-course-card__meta"><span>{course.category}</span><span>{course.level}</span></div>
                    <h3>{course.title}</h3>
                    <p>{course.summary}</p>
                    <div className="afc-course-card__footer"><span>{course.lessons.length} lessons · {course.estimatedHours} hrs</span><strong>{courseValue(course)}</strong></div>
                    {enrollment ? <Button variant="secondary" onClick={() => { setSelectedCourseId(course.id); setView('learning') }}><BookOpen /> Continue learning</Button>
                      : <Button loading={busy} disabled={requested} onClick={() => void enrol(course)}>{requested ? 'Request received' : course.priceGhs === 0 ? 'Start free course' : 'Request enrolment'}</Button>}
                  </div>
                </article>
              })}
            </div>
          ) : <StatePanel title="The AFC catalog is being prepared" description={admin ? 'Provision the starter curriculum or create a course to open AFC to learners.' : 'Our first AFC learning paths will appear here once the instructor team publishes them.'} action={admin ? <Button onClick={() => void provisionStarterCourses()}><Plus /> Add starter courses</Button> : <ButtonLink to="/dashboard/messages" variant="secondary"><MessageSquare /> Ask about AFC</ButtonLink>} />}
        </section>
      )}

      {view === 'learning' && (
        <section>
          <div className="afc-section-heading"><div><p className="eyebrow">Your learning</p><h2>Keep the next useful step in view.</h2></div></div>
          {activeEnrolments.length ? <div className="afc-learning-layout">
            <aside className="afc-learning-list">
              {activeEnrolments.map((enrollment) => {
                const course = courseById.get(enrollment.courseId)
                if (!course) return null
                return <button key={enrollment.id} onClick={() => setSelectedCourseId(course.id)} aria-pressed={selectedCourseId === course.id}>
                  <span>{course.title}</span><small>{enrollment.progress}% complete</small>
                </button>
              })}
            </aside>
            <div className="afc-learning-detail">
              {selectedCourse && selectedEnrollment ? <>
                <div className="afc-learning-detail__header"><div><p className="eyebrow">{selectedCourse.category}</p><h3>{selectedCourse.title}</h3><p>{selectedCourse.summary}</p></div><div className="afc-progress"><strong>{selectedEnrollment.progress}%</strong><span>Progress</span></div></div>
                <div className="afc-lesson-list">{selectedCourse.lessons.map((lesson, index) => {
                  const complete = selectedEnrollment.completedLessonIds.includes(lesson.id)
                  return <article key={lesson.id}><button className="afc-lesson-toggle" aria-pressed={complete} onClick={() => void toggleAfcLesson(selectedEnrollment, selectedCourse, lesson.id).catch((error) => toast.error(asErrorMessage(error)))}><CheckCircle2 /></button><div><span>Lesson {index + 1} · {lesson.durationMinutes} min</span><h4>{lesson.title}</h4><p>{lesson.summary}</p></div>{lesson.videoUrl ? <a href={lesson.videoUrl} target="_blank" rel="noreferrer">Watch</a> : null}</article>
                })}</div>
              </> : <StatePanel title="Choose a course" description="Select a course to continue your learning path." />}
            </div>
          </div> : <StatePanel title="No courses in progress yet" description="Browse the AFC catalog and start with a course that fits your next goal." action={<Button onClick={() => setView('discover')}>Browse courses</Button>} />}
        </section>
      )}

      {view === 'assignments' && (
        <section className="afc-assignment-layout">
          <div><p className="eyebrow">Practical work</p><h2>Submit work. Get useful feedback.</h2><p className="text-aura-muted text-sm leading-7">Send written work for a course you are actively taking. Your response stays visible only to you and the AuraFlow instructor team.</p>
            <form className="afc-assignment-form" onSubmit={submitAssignment}>
              <label>Course<Select value={assignmentCourseId} onChange={(event) => setAssignmentCourseId(event.target.value)} required><option value="">Choose a course</option>{activeEnrolments.map((item) => <option key={item.id} value={item.courseId}>{courseById.get(item.courseId)?.title ?? item.courseId}</option>)}</Select></label>
              <label>Assignment title<Input value={assignmentTitle} onChange={(event) => setAssignmentTitle(event.target.value)} required /></label>
              <label>Response<Textarea value={assignmentResponse} onChange={(event) => setAssignmentResponse(event.target.value)} minLength={20} required /></label>
              <label>Supporting file (optional)<Input type="file" accept="image/*,video/mp4,video/webm,application/pdf,text/plain,text/csv,application/json,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip" onChange={(event) => setAssignmentFile(event.target.files?.[0] ?? null)} /></label>
              <Button type="submit" loading={busy}><Upload /> Submit for review</Button>
            </form>
          </div>
          <div className="afc-submission-list"><h3>Your submissions</h3>{submissionsQuery.data.length ? submissionsQuery.data.map((submission) => <article key={submission.id}><div><strong>{submission.title}</strong><span>{courseById.get(submission.courseId)?.title ?? 'AFC course'} · {displayDate(submission.updatedAt)}</span></div><span className="status" data-status={submission.status}>{submission.status}</span>{typeof submission.score === 'number' ? <b>{submission.score}%</b> : null}{submission.reviewerNote ? <p>{submission.reviewerNote}</p> : null}</article>) : <p className="text-aura-muted text-sm">No submissions yet.</p>}</div>
        </section>
      )}

      {view === 'certificates' && (
        <section><div className="afc-section-heading"><div><p className="eyebrow">Verified completion</p><h2>Your AFC certificates.</h2></div></div>
          {certificatesQuery.data.length ? <div className="afc-certificate-grid">{certificatesQuery.data.map((certificate) => <article key={certificate.id}><Award /><p>Completed course</p><h3>{courseById.get(certificate.courseId)?.title ?? 'AuraFlow Class course'}</h3><strong>{certificate.certificateCode}</strong><span>Issued {displayDate(certificate.issuedAt)}</span></article>)}</div> : <StatePanel title="Certificates are issued after instructor review" description="Complete your learning path and practical work. An AFC instructor verifies completion before a certificate is issued." action={<Button onClick={() => setView('learning')} variant="secondary">View learning</Button>} />}
        </section>
      )}

      {admin && view === 'instructor' && (
        <section><div className="afc-section-heading"><div><p className="eyebrow">Instructor studio</p><h2>Run AFC without leaving AuraFlow.</h2></div><Button onClick={() => setCourseBuilderOpen(true)}><Plus /> New course</Button></div>
          <div className="afc-instructor-summary"><article><LibraryBig /><strong>{courses.length}</strong><span>Courses</span></article><article><UsersRound /><strong>{adminRequests.data.filter((item) => item.status === 'submitted').length}</strong><span>Enrolment requests</span></article><article><ClipboardCheck /><strong>{adminSubmissions.data.filter((item) => item.status === 'submitted').length}</strong><span>Submissions to review</span></article></div>
          <div className="afc-instructor-grid"><div><h3>Enrolment decisions</h3>{adminRequests.data.filter((item) => item.status === 'submitted').length ? adminRequests.data.filter((item) => item.status === 'submitted').map((request) => <article className="afc-admin-row" key={request.id}><div><strong>{courseById.get(request.courseId)?.title ?? request.courseId}</strong><span>Learner {request.userId.slice(0, 10)} · {request.note || 'No note provided'}</span></div><div><Button loading={busy} onClick={() => void decideAfcEnrollmentRequest(request, 'approved').then(() => toast.success('Learner enrolled.')).catch((error) => toast.error(asErrorMessage(error)))}>Approve</Button><Button variant="ghost" disabled={busy} onClick={() => void decideAfcEnrollmentRequest(request, 'declined').then(() => toast.success('Request declined.')).catch((error) => toast.error(asErrorMessage(error)))}>Decline</Button></div></article>) : <p className="text-aura-muted text-sm">No enrolment requests waiting.</p>}</div>
            <div><h3>Submission review</h3>{adminSubmissions.data.length ? adminSubmissions.data.slice(0, 12).map((submission) => <article className="afc-admin-submission" key={submission.id}><div><strong>{submission.title}</strong><span>{courseById.get(submission.courseId)?.title ?? submission.courseId} · learner {submission.userId.slice(0, 10)}</span><p>{submission.response}</p></div><SubmissionReview submission={submission} onDone={() => void adminSubmissions.refetch()} />{submission.status === 'reviewed' && (submission.score ?? 0) >= 70 ? <Button variant="secondary" onClick={() => void issueAfcCertificate({ userId: submission.userId, courseId: submission.courseId }).then(() => toast.success('Certificate issued.')).catch((error) => toast.error(asErrorMessage(error)))}><Award /> Issue certificate</Button> : null}</article>) : <p className="text-aura-muted text-sm">No learner submissions yet.</p>}</div></div>
        </section>
      )}

      <Modal open={courseBuilderOpen} onOpenChange={setCourseBuilderOpen} title="Publish an AFC course" description="Create a structured course record for the AuraFlow Class catalog."><CourseBuilder onClose={() => setCourseBuilderOpen(false)} onSaved={() => void coursesQuery.refetch()} /></Modal>
    </div>
  )
}
