'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  ChartNoAxesCombined,
  Users,
  Wallet,
  Settings,
  ShieldCheck,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Search,
  ChevronRight,
  CalendarDays,
  FileText,
  Video,
  Presentation,
  LockKeyhole,
  CheckCircle2,
  Download,
  LogOut,
  Activity,
  ArrowLeft,
  RefreshCw,
  Compass,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { api, date, initials, type Row, type Snapshot } from './types';
import { Editor, Empty, Field, Modal } from './forms';
import { Login } from './login';
import { AssessmentPlayer } from './assessment-player';
import { GradeHistory, SessionSecurity } from './security';

const nav = [
  { id: 'overview', name: 'Overview', icon: LayoutDashboard },
  { id: 'discover', name: 'Discover courses', icon: Compass },
  { id: 'classrooms', name: 'My courses', icon: BookOpen },
  { id: 'assessments', name: 'Assessments', icon: ClipboardList },
  { id: 'gradebook', name: 'Gradebook', icon: ChartNoAxesCombined },
  { id: 'students', name: 'Learners', icon: Users },
];
export default function TasApp() {
  const [gradeHistory, setGradeHistory] = useState<Row | null>(null);
  const [data, setData] = useState<Snapshot | null>(null),
    [loading, setLoading] = useState(true),
    [view, setView] = useState('overview'),
    [selectedCourse, setSelectedCourse] = useState<string | null>(null),
    [catalog, setCatalog] = useState<Row[]>([]),
    [search, setSearch] = useState(''),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState<{ mode: string; context?: Row } | null>(
      null,
    ),
    [lesson, setLesson] = useState<Row | null>(null),
    [assessment, setAssessment] = useState<Row | null>(null);
  const refresh = useCallback(async () => {
    try {
      const result = await api<Snapshot>('snapshot');
      setData(result);
      setError('');
    } catch (e) {
      if (
        (e as Error).message.includes('sign in') ||
        (e as Error).message.includes('session')
      )
        setData(null);
      else setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);
  useEffect(() => {
    if (view !== 'discover') return;
    void api<{ courses: Row[] }>('catalog')
      .then((result) => setCatalog(result.courses))
      .catch((e: Error) => setError(e.message));
  }, [view]);
  const signedInUserId = data?.user.id;
  useEffect(() => {
    if (!signedInUserId) return;
    const p = new URLSearchParams(location.search);
    const reference = p.get('reference');
    if (p.get('course-payment') === 'verify' && reference) {
      history.replaceState({}, '', '/');
      void Promise.resolve().then(async () => {
        setView('discover');
        try {
          await api('course-orders/verify', { reference });
          await refresh();
          setMessage('Payment verified. Your course is now available in My courses.');
        } catch (e) {
          setError((e as Error).message);
        }
      });
      return;
    }
    if (p.get('billing') === 'verify' && reference) {
      history.replaceState({}, '', '/');
      void Promise.resolve().then(async () => {
        setView('billing');
        try {
          await api('billing/verify', { reference });
          await refresh();
          setMessage('Payment verified. Your plan is active.');
        } catch (e) {
          setError((e as Error).message);
        }
      });
    }
  }, [signedInUserId, refresh]);
  async function act(
    path: string,
    values: unknown,
    success = 'Changes saved.',
  ) {
    if (busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api(path, values);
      await refresh();
      setMessage(success);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function checkout(course: Row) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await api<{ enrolled?: boolean; url?: string }>(
        `courses/${course.id}/checkout`,
        {},
      );
      if (result.url) {
        location.assign(result.url);
        return;
      }
      await refresh();
      navigate('classrooms');
      setMessage('You are enrolled. Your course is ready.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function navigate(next: string) {
    setView(next);
    setSelectedCourse(null);
    setSearch('');
    setMessage('');
    setError('');
  }
  if (loading)
    return (
      <div className="loading-screen">
        <GraduationCap size={40} />
        <h2>Opening your workspace…</h2>
      </div>
    );
  if (!data)
    return (
      <>
        <Login onLogin={refresh} />
        {error && (
          <div className="connection-error" role="alert">
            {error}
            <button onClick={refresh}>Retry connection</button>
          </div>
        )}
      </>
    );
  const student = data.user.role === 'student';
  const admin = data.user.role === 'admin';
  const course = data.courses.find((c) => c.id === selectedCourse);
  const title =
    course?.title ||
    nav.find((n) => n.id === view)?.name ||
    (
      {
        billing: 'Plans & billing',
        discover: 'Discover courses',
        settings: 'AFC settings',
        activity: 'Activity log',
      } as Row
    )[view];
  const matchingCourses = data.courses.filter((c) =>
    `${c.title} ${c.code}`.toLowerCase().includes(search.toLowerCase()),
  );
  const matchingAssessments = data.assessments.filter((a) =>
    `${a.title} ${data.courses.find((c) => c.id === a.course_id)?.code}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const pending = data.attempts.filter((a) => a.status === 'submitted'),
    graded = data.attempts.filter((a) => a.score !== null),
    average = graded.length
      ? Math.round(graded.reduce((s, a) => s + a.score, 0) / graded.length)
      : null;
  const students = [
    ...new Map(
      data.enrollments.filter((e) => e.active).map((e) => [e.user_id, e]),
    ).values(),
  ];
  function openCourse(c: Row) {
    setSelectedCourse(c.id);
    setView('classrooms');
    setSearch('');
  }
  function courseCard(c: Row) {
    if (!data) return null;
    const ms = data.modules.filter((m) => m.course_id === c.id);
    const ls = data.lessons.filter((l) => ms.some((m) => m.id === l.module_id));
    const count = data.enrollments.filter(
      (e) => e.course_id === c.id && e.active,
    ).length;
    const done = ls.filter((l) => data.completion.includes(l.id)).length;
    return (
      <button
        className={`course-card ${c.color}`}
        key={c.id}
        onClick={() => openCourse(c)}
      >
        <div className="course-banner">
          <span className="course-code">{c.code}</span>
          <BookOpen size={45} strokeWidth={1.1} />
          <span className={`pill ${c.published ? 'green' : 'neutral'}`}>
            {c.published ? 'Published' : 'Draft'}
          </span>
        </div>
        <div className="course-body">
          <span className="course-semester">
            AFC learning path · {c.level || 'beginner'}
          </span>
          <h3>{c.title}</h3>
          <p>{c.description}</p>
          <div className="course-meta">
            <span>
              <Users size={15} />
              {student ? c.teacher_name : `${count} learners`}
            </span>
            <span>
              <BookOpen size={15} />
              {ms.length} modules
            </span>
          </div>
          {student && (
            <Progress value={ls.length ? (done / ls.length) * 100 : 0} />
          )}
          <div className="course-footer">
            <span>
              {student ? `${done} lessons completed` : 'Open classroom'}
            </span>
            <ArrowUpRight size={18} />
          </div>
        </div>
      </button>
    );
  }
  function assessmentRows(items: Row[]) {
    if (!data) return null;
    return items.map((a) => {
      const c = data.courses.find((c) => c.id === a.course_id);
      const attempts = data.attempts.filter((t) => t.assessment_id === a.id);
      return (
        <div className="assessment-row" key={a.id}>
          <span
            className={`item-icon ${a.kind === 'quiz' ? 'blue' : 'orange'}`}
          >
            <ClipboardList size={19} />
          </span>
          <div className="row-content">
            <strong>{a.title}</strong>
            <span>
              {c?.code} · {a.kind} · {a.pass_mark}% to pass
            </span>
          </div>
          <div className="row-deadline">
            <strong>{date(a.due_at)}</strong>
            <span>
              {a.kind === 'quiz' ? `${a.duration_minutes} min · ` : ''}
              {student
                ? `${attempts.length}/${a.max_attempts} attempts`
                : `${attempts.length} submissions`}
            </span>
          </div>
          {student ? (
            <button
              className="btn secondary small"
              onClick={() => setAssessment(a)}
            >
              Open
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              className={`btn small ${a.published ? 'secondary' : 'primary'}`}
              disabled={busy}
              onClick={() =>
                act(
                  `assessments/${a.id}/publish`,
                  { published: !a.published },
                  a.published
                    ? 'Assessment unpublished.'
                    : 'Assessment published.',
                )
              }
            >
              {a.published ? 'Unpublish' : 'Publish'}
            </button>
          )}
        </div>
      );
    });
  }
  return (
    <SidebarProvider
      style={{ '--sidebar-width': '15.5rem' } as React.CSSProperties}
    >
      <Sidebar className="tas-sidebar">
        <SidebarHeader className="side-brand">
          <Link
            className="brand"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('overview');
            }}
          >
            <span className="brand-mark">
              <GraduationCap size={25} />
            </span>
            <strong>
              AFC<span>AuraFlow Class</span>
            </strong>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <div className="institution">
            <span className="institution-icon">
              <GraduationCap size={20} />
            </span>
            <div>
              <strong>AuraFlow Class</strong>
              <span>Technology learning platform</span>
            </div>
          </div>
          <p className="side-label">WORKSPACE</p>
          <SidebarMenu className="navigation">
            {nav
              .filter((n) => !student || n.id !== 'students')
              .map((n) => (
                <SidebarMenuItem key={n.id}>
                  <SidebarMenuButton
                    isActive={view === n.id}
                    onClick={() => navigate(n.id)}
                    className="nav-button"
                  >
                    <n.icon size={19} />
                    <span>{n.name}</span>
                    {n.id === 'classrooms' && (
                      <span className="nav-count">{data.courses.length}</span>
                    )}
                    {n.id === 'gradebook' && pending.length > 0 && !student && (
                      <span className="nav-count highlight">
                        {pending.length}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
          </SidebarMenu>
          <p className="side-label">MANAGEMENT</p>
          <SidebarMenu className="navigation">
            {!student && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="nav-button"
                  isActive={view === 'activity'}
                  onClick={() => navigate('activity')}
                >
                  <ShieldCheck size={19} />
                  <span>Activity log</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {admin && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="nav-button"
                  isActive={view === 'billing'}
                  onClick={() => navigate('billing')}
                >
                  <Wallet size={19} />
                  <span>Plans & billing</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton
                className="nav-button"
                isActive={view === 'settings'}
                onClick={() => navigate('settings')}
              >
                <Settings size={19} />
                <span>
                  {admin ? 'AFC settings' : 'Account settings'}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="workspace-note">
            <span className="live-dot" />
            <strong>AFC learning platform</strong>
            <p>
              Practical technology education.
              <br />
              Ghana · Africa/Accra
            </p>
          </div>
          <div className="side-user">
            <span className="avatar">{initials(data.user.name)}</span>
            <div>
              <strong>{data.user.name}</strong>
              <span>
                {student
                    ? 'Learner'
                  : admin
                    ? 'AFC owner'
                    : 'Instructor'}
              </span>
            </div>
            <button
              className="icon-btn"
              title="Sign out"
              aria-label="Sign out"
              onClick={async () => {
                await api('logout', {});
                setData(null);
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <div className="app-main">
        <header className="topbar">
          <div className="breadcrumb">
            <SidebarTrigger />
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{course ? 'Classroom' : title}</strong>
          </div>
          <div className="topbar-right">
            <span className="semester-label">
              <CalendarDays size={15} />
              AFC learning workspace
            </span>
            <button
              className="icon-btn"
              aria-label="Refresh workspace"
              disabled={busy}
              onClick={refresh}
            >
              <RefreshCw size={18} />
            </button>
            <span className="avatar light">{initials(data.user.name)}</span>
          </div>
        </header>
        <main className="workspace">
          <div className="page-heading">
            <div>
              {course ? (
                <button
                  className="back-link"
                  onClick={() => setSelectedCourse(null)}
                >
                  <ArrowLeft size={14} />
                  All courses
                </button>
              ) : (
                <span className="eyebrow">
                  {view === 'overview'
                    ? new Date().toLocaleDateString('en-GH', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        timeZone: 'Africa/Accra',
                      })
                    : 'AURAFLOW CLASS'}
                </span>
              )}
              <h1>
                {view === 'overview'
                  ? `Welcome back, ${data.user.name.split(' ')[0]}.`
                  : title}
              </h1>
              <p>
                {course
                  ? course.description
                  : view === 'overview'
                    ? student
                      ? 'Your next learning milestone starts here.'
                      : 'A clear view of your courses and what needs your attention.'
                    : view === 'discover'
                      ? 'Explore practical technology courses built for ambitious learners.'
                    : view === 'classrooms'
                      ? 'Every course, one connected teaching space.'
                      : view === 'assessments'
                        ? 'Create meaningful checkpoints. Keep learning moving.'
                        : view === 'gradebook'
                          ? 'Review submissions, give feedback, and release results.'
                          : view === 'students'
                            ? 'The people at the heart of your classroom.'
                            : view === 'billing'
                              ? 'Manage access for your teaching community.'
                              : 'Manage your workspace with confidence.'}
              </p>
            </div>
            {!student &&
              ['overview', 'classrooms'].includes(view) &&
              !course && (
                <button
                  className="btn primary"
                  onClick={() => setEditor({ mode: 'course' })}
                >
                  <Plus size={18} />
                  Create course
                </button>
              )}
            {view === 'assessments' && !student && (
              <button
                className="btn primary"
                onClick={() => setEditor({ mode: 'assessment' })}
              >
                <Plus size={18} />
                Create assessment
              </button>
            )}
            {view === 'students' && !student && (
              <button
                className="btn primary"
                onClick={() => setEditor({ mode: 'enroll' })}
              >
                <Plus size={18} />
                Enroll learner
              </button>
            )}
          </div>
          {(message || error) && (
            <div
              className={error ? 'error' : 'notice'}
              role={error ? 'alert' : 'status'}
            >
              {error || message}
              <button
                className="dismiss"
                aria-label="Dismiss message"
                onClick={() => {
                  setError('');
                  setMessage('');
                }}
              >
                ×
              </button>
            </div>
          )}
          {view === 'overview' && (
            <>
              <div className="stats-grid">
                <Stat
                  title="My classrooms"
                  value={data.courses.length}
                  detail={`${data.courses.filter((c) => c.published).length} published this semester`}
                  icon={BookOpen}
                  color="blue"
                />
                <Stat
                  title={student ? 'Completed lessons' : 'Enrolled students'}
                  value={student ? data.completion.length : students.length}
                  detail={
                    student
                      ? 'Keep building your knowledge'
                      : 'Across your active classrooms'
                  }
                  icon={student ? CheckCircle2 : Users}
                  color="teal"
                />
                <Stat
                  title={student ? 'My submissions' : 'To grade'}
                  value={student ? data.attempts.length : pending.length}
                  detail={
                    student
                      ? 'Quiz and assignment attempts'
                      : pending.length
                        ? 'Submissions awaiting feedback'
                        : 'You’re up to date'
                  }
                  icon={ClipboardList}
                  color="orange"
                />
                <Stat
                  title={
                    student
                      ? 'Released grade average'
                      : 'Assessed grade average'
                  }
                  value={average === null ? '—' : `${average}%`}
                  detail={
                    graded.length
                      ? `Across ${graded.length} graded attempts`
                      : 'No graded attempts yet'
                  }
                  icon={ChartNoAxesCombined}
                  color="purple"
                />
              </div>
              <div className="dashboard-grid">
                <div className="dashboard-primary">
                  <section>
                    <div className="section-heading">
                      <h2>
                        My classrooms{' '}
                        <span className="count">{data.courses.length}</span>
                      </h2>
                      <button
                        className="text-button"
                        onClick={() => navigate('classrooms')}
                      >
                        View all
                        <ArrowRight size={15} />
                      </button>
                    </div>
                    <div className="course-grid">
                      {data.courses.slice(0, 3).map(courseCard)}
                    </div>
                    {!data.courses.length && (
                      <Empty
                        title={
                          student
                            ? 'Your classroom is on its way'
                            : 'Your first classroom starts here'
                        }
                      >
                        {student
                          ? 'Your lecturer will enroll you when the course is ready.'
                          : 'Create a classroom, organize your modules, and invite your students.'}
                      </Empty>
                    )}
                  </section>
                  <section className="panel">
                    <div className="section-heading panel-heading">
                      <div>
                        <h2>
                          {student ? 'Your assessments' : 'Assessment overview'}
                        </h2>
                        <p>Keep track of your next checkpoints.</p>
                      </div>
                      <button
                        className="text-button"
                        onClick={() => navigate('assessments')}
                      >
                        View all
                        <ArrowRight size={15} />
                      </button>
                    </div>
                    {assessmentRows(data.assessments.slice(0, 4))}
                    {!data.assessments.length && (
                      <Empty title="No assessments yet">
                        Assessments appear here when they are available.
                      </Empty>
                    )}
                  </section>
                </div>
                <aside className="dashboard-aside">
                  <section className="focus-panel">
                    <span className="pill dark">YOUR NEXT STEP</span>
                    <div className="focus-icon">
                      <GraduationCap size={31} />
                    </div>
                    <h2>
                      {student
                        ? 'A little progress. Every day.'
                        : pending.length
                          ? 'Good feedback makes a difference.'
                          : 'Build a classroom that moves learning forward.'}
                    </h2>
                    <p>
                      {student
                        ? 'Read your lessons, test your understanding, and unlock your next module.'
                        : pending.length
                          ? `${pending.length} submissions are ready for your review.`
                          : 'Bring your materials and assessments together, one module at a time.'}
                    </p>
                    <button
                      className="btn white"
                      onClick={() =>
                        navigate(
                          student
                            ? 'classrooms'
                            : pending.length
                              ? 'gradebook'
                              : 'classrooms',
                        )
                      }
                    >
                      {student
                        ? 'Continue learning'
                        : pending.length
                          ? 'Review submissions'
                          : 'Open classrooms'}
                      <ArrowRight size={16} />
                    </button>
                  </section>
                  <section className="panel progress-panel">
                    <div className="section-heading">
                      <h3>Teaching at a glance</h3>
                      <Activity size={17} />
                    </div>
                    <Metric
                      label="Published modules"
                      value={data.modules.filter((m) => m.published).length}
                      total={data.modules.length}
                    />
                    <Metric
                      label="Published assessments"
                      value={data.assessments.filter((a) => a.published).length}
                      total={data.assessments.length}
                    />
                    <Metric
                      label="Released grades"
                      value={data.attempts.filter((a) => a.released).length}
                      total={
                        data.attempts.filter((a) => a.status === 'graded')
                          .length
                      }
                    />
                    <div className="secure-note">
                      <ShieldCheck size={18} />
                      <span>
                        Enrollment and progression checks are enforced on the
                        server.
                      </span>
                    </div>
                  </section>
                </aside>
              </div>
            </>
          )}
          {view === 'discover' && (
            <>
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search published AFC courses…"
              />
              <div className="course-grid full">
                {catalog
                  .filter((item) =>
                    `${item.title} ${item.code} ${item.description}`
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  )
                  .map((item) => (
                    <section className={`course-card ${item.color || 'blue'}`} key={item.id}>
                      <div className="course-banner">
                        <span className="course-code">{item.code}</span>
                        <Compass size={45} strokeWidth={1.1} />
                        <span className="pill green">Published</span>
                      </div>
                      <div className="course-body">
                        <span className="course-semester">
                          {item.level || 'beginner'} · {item.instructor_name}
                        </span>
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                        <div className="course-meta">
                          <span><Video size={15} /> YouTube-led lessons</span>
                          <span><ShieldCheck size={15} /> Certificate path</span>
                        </div>
                        <div className="course-footer">
                          <strong>{Number(item.price_ghs) > 0 ? `GH₵ ${Number(item.price_ghs).toLocaleString()}` : 'Free'}</strong>
                          {student ? (
                            <button className="btn primary small" disabled={busy} onClick={() => void checkout(item)}>
                              {Number(item.price_ghs) > 0 ? 'Enroll securely' : 'Join course'}
                              <ArrowRight size={14} />
                            </button>
                          ) : (
                            <span className="muted">Learner enrollment only</span>
                          )}
                        </div>
                      </div>
                    </section>
                  ))}
              </div>
              {!catalog.length && <Empty title="No published courses yet">AFC instructors can publish the first learning path from their course workspace.</Empty>}
            </>
          )}
          {view === 'classrooms' && !course && (
            <>
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search by course title or course code…"
              />
              <div className="course-grid full">
                {matchingCourses.map(courseCard)}
              </div>
              {!matchingCourses.length && (
                <Empty title="No courses found">
                  Try another search or create your first course.
                </Empty>
              )}
            </>
          )}
          {course && (
            <>
              <div className="classroom-toolbar">
                <div className="button-row">
                  <span
                    className={`pill ${course.published ? 'green' : 'neutral'}`}
                  >
                    {course.published ? 'Published' : 'Draft'}
                  </span>
                  <span className="course-code plain">{course.code}</span>
                  <span className="muted">{course.teacher_name}</span>
                </div>
                {!student && (
                  <div className="button-row">
                    <button
                      className="btn secondary"
                      onClick={() =>
                        setEditor({
                          mode: 'enroll',
                          context: { course_id: course.id },
                        })
                      }
                    >
                      <Users size={16} />
                      Enroll learners
                    </button>
                    <button
                      className="btn primary"
                      disabled={busy}
                      onClick={() =>
                        act(`courses/${course.id}/publish`, {
                          published: !course.published,
                        })
                      }
                    >
                      {course.published
                        ? 'Unpublish course'
                        : 'Publish course'}
                    </button>
                  </div>
                )}
                {student && course.certificate_enabled && (
                  <button
                    className="btn secondary"
                    disabled={busy}
                    onClick={() =>
                      act(
                        `certificates/${course.id}/claim`,
                        {},
                        'Certificate issued. You can find its verification code in your learning record.',
                      )
                    }
                  >
                    <ShieldCheck size={16} /> Claim certificate
                  </button>
                )}
              </div>
              <Tabs defaultValue="modules" className="classroom-tabs">
                <TabsList variant="line">
                  <TabsTrigger value="modules">Course modules</TabsTrigger>
                  <TabsTrigger value="assessments">Assessments</TabsTrigger>
                  {!student && (
                    <TabsTrigger value="roster">Class roster</TabsTrigger>
                  )}
                </TabsList>
                <TabsContent value="modules">
                  <div className="section-heading">
                    <h2>Learning path</h2>
                    {!student && (
                      <button
                        className="btn secondary"
                        onClick={() =>
                          setEditor({ mode: 'module', context: course })
                        }
                      >
                        <Plus size={16} />
                        Add module
                      </button>
                    )}
                  </div>
                  <div className="learning-path">
                    {data.modules
                      .filter((m) => m.course_id === course.id)
                      .map((m, i) => (
                        <section
                          className={`module-card ${m.locked ? 'locked' : ''}`}
                          key={m.id}
                        >
                          <div className="module-heading">
                            <span className="module-number">
                              {m.locked ? (
                                <LockKeyhole size={19} />
                              ) : (
                                String(i + 1).padStart(2, '0')
                              )}
                            </span>
                            <div>
                              <span className="eyebrow">MODULE {i + 1}</span>
                              <h3>{m.title}</h3>
                            </div>
                            {m.locked ? (
                              <span className="pill neutral">
                                Pass previous modules to unlock
                              </span>
                            ) : !student ? (
                              <div className="button-row">
                                <span
                                  className={`pill ${m.published ? 'green' : 'neutral'}`}
                                >
                                  {m.published ? 'Published' : 'Draft'}
                                </span>
                                <button
                                  className="text-button"
                                  disabled={busy}
                                  onClick={() =>
                                    act(`modules/${m.id}/publish`, {
                                      published: !m.published,
                                    })
                                  }
                                >
                                  {m.published ? 'Unpublish' : 'Publish'}
                                </button>
                              </div>
                            ) : (
                              <span className="pill green">Available</span>
                            )}
                          </div>
                          {!m.locked && (
                            <div className="module-content">
                              {data.lessons
                                .filter((l) => l.module_id === m.id)
                                .map((l) => {
                                  const Icon =
                                    l.kind === 'video'
                                      ? Video
                                      : l.kind === 'slides'
                                        ? Presentation
                                        : FileText;
                                  return (
                                    <button
                                      className="lesson-row"
                                      key={l.id}
                                      onClick={() => setLesson(l)}
                                    >
                                      <span
                                        className={`item-icon ${data.completion.includes(l.id) ? 'teal' : 'blue'}`}
                                      >
                                        {data.completion.includes(l.id) ? (
                                          <CheckCircle2 size={18} />
                                        ) : (
                                          <Icon size={18} />
                                        )}
                                      </span>
                                      <div>
                                        <strong>{l.title}</strong>
                                        <span>
                                          {l.kind === 'note'
                                            ? 'Reading'
                                            : l.kind === 'video'
                                              ? 'Video lesson'
                                              : 'Lecture slides'}
                                          {l.file_name
                                            ? ' · File attached'
                                            : ''}
                                        </span>
                                      </div>
                                      <ChevronRight size={17} />
                                    </button>
                                  );
                                })}
                              {data.assessments
                                .filter((a) => a.module_id === m.id)
                                .map((a) => (
                                  <div
                                    className="lesson-row assessment-lesson"
                                    key={a.id}
                                  >
                                    <span className="item-icon orange">
                                      <ClipboardList size={18} />
                                    </span>
                                    <div>
                                      <strong>{a.title}</strong>
                                      <span>
                                        {a.kind} · {a.pass_mark}% pass mark
                                        {a.kind === 'quiz'
                                          ? ` · ${a.duration_minutes} minutes`
                                          : ''}
                                      </span>
                                    </div>
                                    {student ? (
                                      <button
                                        className="btn secondary small"
                                        onClick={() => setAssessment(a)}
                                      >
                                        Open
                                      </button>
                                    ) : (
                                      <span
                                        className={`pill ${a.published ? 'green' : 'neutral'}`}
                                      >
                                        {a.published ? 'Published' : 'Draft'}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              {!student && (
                                <div className="module-actions">
                                  <button
                                    className="text-button"
                                    onClick={() =>
                                      setEditor({ mode: 'lesson', context: m })
                                    }
                                  >
                                    <Plus size={15} />
                                    Add material
                                  </button>
                                  <button
                                    className="text-button"
                                    onClick={() =>
                                      setEditor({
                                        mode: 'assessment',
                                        context: {
                                          module_id: m.id,
                                          course_id: course.id,
                                        },
                                      })
                                    }
                                  >
                                    <Plus size={15} />
                                    Add assessment
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </section>
                      ))}
                  </div>
                  {!data.modules.some((m) => m.course_id === course.id) && (
                    <Empty title="Build your learning path">
                      Add modules, then fill them with lessons and assessments.
                    </Empty>
                  )}
                </TabsContent>
                <TabsContent value="assessments">
                  <section className="panel">
                    {assessmentRows(
                      data.assessments.filter((a) => a.course_id === course.id),
                    )}
                  </section>
                </TabsContent>
                <TabsContent value="roster">
                  <Roster
                    items={data.enrollments.filter(
                      (e) => e.course_id === course.id,
                    )}
                    courses={data.courses}
                    busy={busy}
                    revoke={(e) =>
                      act(
                        `courses/${e.course_id}/revoke`,
                        { userId: e.user_id },
                        'Enrollment revoked.',
                      )
                    }
                  />
                </TabsContent>
              </Tabs>
            </>
          )}
          {view === 'assessments' && (
            <>
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search assessments…"
              />
              <section className="panel">
                {assessmentRows(matchingAssessments)}
                {!matchingAssessments.length && (
                  <Empty title="No assessments found">
                    Add a quiz, assignment, or project from a classroom module.
                  </Empty>
                )}
              </section>
              {!student && (
                <section className="info-strip">
                  <ShieldCheck size={24} />
                  <div>
                    <strong>Progress follows understanding.</strong>
                    <p>
                      Students complete the module’s lessons before assessment.
                      Passing earlier modules unlocks later materials.
                    </p>
                  </div>
                </section>
              )}
            </>
          )}
          {view === 'students' && (
            <>
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search students by name or email…"
              />
              <Roster
                items={data.enrollments.filter((e) =>
                  `${e.name} ${e.email}`
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                )}
                courses={data.courses}
                busy={busy}
                revoke={(e) =>
                  act(
                    `courses/${e.course_id}/revoke`,
                    { userId: e.user_id },
                    'Enrollment revoked.',
                  )
                }
              />
            </>
          )}
          {view === 'gradebook' && (
            <>
              <div className="gradebook-tools">
                <SearchBar
                  value={search}
                  onChange={setSearch}
                  placeholder="Search student or assessment…"
                />
                <button
                  className="btn secondary"
                  onClick={() => exportGrades(data)}
                >
                  <Download size={16} />
                  Export CSV
                </button>
              </div>
              {!student && data.assessments.some((a) => a.kind !== 'quiz') && (
                <div className="import-row">
                  <span>Have results from an external assessment?</span>
                  {data.assessments
                    .filter((a) => a.kind !== 'quiz')
                    .map((a) => (
                      <button
                        className="text-button"
                        key={a.id}
                        onClick={() =>
                          setEditor({ mode: 'import', context: a })
                        }
                      >
                        Import · {a.title}
                      </button>
                    ))}
                </div>
              )}
              <section className="panel grade-table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {!student && <TableHead>Student</TableHead>}
                      <TableHead>Assessment</TableHead>
                      <TableHead>Attempt</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>{student ? 'Feedback' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.attempts
                      .filter((t) =>
                        `${t.student_name} ${data.assessments.find((a) => a.id === t.assessment_id)?.title}`
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                      )
                      .map((t) => (
                        <TableRow key={t.id}>
                          {!student && (
                            <TableCell>
                              <div className="table-person">
                                <span className="avatar light small-avatar">
                                  {initials(t.student_name)}
                                </span>
                                <div>
                                  <strong>{t.student_name}</strong>
                                  <span>{t.student_email}</span>
                                </div>
                              </div>
                            </TableCell>
                          )}
                          <TableCell>
                            <strong>
                              {
                                data.assessments.find(
                                  (a) => a.id === t.assessment_id,
                                )?.title
                              }
                            </strong>
                            <small>{date(t.submitted_at)}</small>
                          </TableCell>
                          <TableCell>#{t.number}</TableCell>
                          <TableCell>
                            <strong className="score">
                              {t.score === null ? '—' : `${t.score}%`}
                            </strong>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`pill ${t.released ? 'green' : t.status === 'submitted' ? 'amber' : 'neutral'}`}
                            >
                              {t.released
                                ? 'Released'
                                : t.status === 'graded'
                                  ? 'Awaiting release'
                                  : t.status === 'submitted'
                                    ? 'Needs grading'
                                    : 'In progress'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {student ? (
                              <span className="feedback-text">
                                {t.feedback || '—'}
                              </span>
                            ) : (
                              <div className="button-row">
                                {data.assessments.find(
                                  (a) => a.id === t.assessment_id,
                                )?.kind !== 'quiz' && (
                                  <button
                                    className="text-button"
                                    onClick={() =>
                                      setEditor({ mode: 'grade', context: t })
                                    }
                                  >
                                    {t.status === 'graded' ? 'Review' : 'Grade'}
                                  </button>
                                )}
                                {t.status === 'graded' && (
                                  <button
                                    className="btn small secondary"
                                    disabled={busy}
                                    onClick={() =>
                                      act(
                                        `attempts/${t.id}/release`,
                                        {
                                          released: !t.released,
                                          revision: t.revision,
                                        },
                                        t.released
                                          ? 'Grade withheld.'
                                          : 'Grade released to the student.',
                                      )
                                    }
                                  >
                                    {t.released ? 'Withhold' : 'Release'}
                                  </button>
                                )}
                                <button
                                  className="btn secondary small"
                                  onClick={() => setGradeHistory(t)}
                                >
                                  History
                                </button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                {!data.attempts.length && (
                  <Empty title="Your gradebook is ready">
                    Quiz results and submitted work will appear here.
                  </Empty>
                )}
              </section>
              {!student && (
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Assessment integrity review</h2>
                      <p>Context events support review; they do not automatically determine misconduct.</p>
                    </div>
                  </div>
                  {data.integrity.slice(0, 20).map((event, index) => (
                    <div className="event-row" key={`${event.attempt_id}-${event.created_at}-${index}`}>
                      <span className="item-icon orange"><ShieldCheck size={18} /></span>
                      <div>
                        <strong>{event.learner_name}</strong>
                        <p>{String(event.event_type).replaceAll('_', ' ')}</p>
                        <span>{new Date(event.created_at).toLocaleString('en-GH', { timeZone: 'Africa/Accra' })}</span>
                      </div>
                    </div>
                  ))}
                  {!data.integrity.length && <Empty title="No integrity events recorded" />}
                </section>
              )}
            </>
          )}
          {gradeHistory && (
            <GradeHistory
              attempt={gradeHistory}
              close={() => setGradeHistory(null)}
            />
          )}
          {view === 'activity' && (
            <section className="panel">
              <div className="panel-heading">
                <h2>Recent activity</h2>
                <p>Recorded actions within your permitted workspace.</p>
              </div>
              {data.events.map((e) => (
                <div className="event-row" key={e.id}>
                  <span className="item-icon teal">
                    <ShieldCheck size={18} />
                  </span>
                  <div>
                    <strong>{e.action}</strong>
                    <p>{e.detail}</p>
                    <span>
                      {e.name} ·{' '}
                      {new Date(e.created_at).toLocaleString('en-GH', {
                        timeZone: 'Africa/Accra',
                      })}
                    </span>
                  </div>
                </div>
              ))}
              {!data.events.length && <Empty title="No activity yet" />}
            </section>
          )}
          {view === 'settings' && (
            <div className="settings-grid">
              <SessionSecurity />
              <section className="panel settings-panel">
                <h2>{admin ? 'AFC academy profile' : 'Your account'}</h2>
                {admin ? (
                  <form
                    className="editor-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void act(
                        'settings',
                        Object.fromEntries(new FormData(e.currentTarget)),
                        'AFC settings updated.',
                      );
                    }}
                  >
                    <Field label="Academy name">
                      <input
                        name="name"
                        defaultValue={data.institution.name}
                        required
                      />
                    </Field>
                    <Field label="Learning period label">
                      <input
                        name="semester"
                        defaultValue={data.institution.semester}
                        required
                      />
                    </Field>
                    <Field label="Timezone">
                      <input readOnly value="Africa/Accra · Ghana (GMT)" />
                    </Field>
                    <button className="btn primary" disabled={busy}>
                      Save settings
                    </button>
                  </form>
                ) : (
                  <>
                    <p>{data.user.name}</p>
                    <p>{data.user.email}</p>
                    <p>{data.institution.name}</p>
                  </>
                )}
              </section>
              <section className="panel settings-panel">
                <h2>Account & access</h2>
                <p>{data.user.email}</p>
                <button
                  className="btn secondary"
                  onClick={() => setEditor({ mode: 'password' })}
                >
                  Change password
                </button>
                {admin && (
                  <>
                    <hr />
                    <h3>Teaching staff</h3>
                    <p>
                      Invite an instructor to create and manage AFC courses.
                    </p>
                    <button
                      className="btn secondary"
                      onClick={() => setEditor({ mode: 'staff' })}
                    >
                      <Plus size={16} />
                      Invite instructor
                    </button>
                  </>
                )}
              </section>
            </div>
          )}
          {view === 'billing' && (
            <>
              <div className="billing-summary panel">
                <div>
                  <span className="eyebrow">CURRENT PLAN</span>
                  <h2>
                    {data.institution.plan === 'pilot'
                      ? 'College pilot'
                      : data.institution.plan === 'college'
                        ? 'College'
                        : 'Individual lecturer'}
                  </h2>
                  <p>
                    {data.institution.paid_until
                      ? `Paid access through ${date(data.institution.paid_until)}`
                      : 'Your workspace is in the pilot phase.'}
                  </p>
                </div>
                <span className="pill amber">
                  {data.billingReady
                    ? 'Payments connected'
                    : 'Payments not connected'}
                </span>
              </div>
              <div className="pricing-grid">
                {data.plans.map((plan) => (
                  <section
                    className={`panel price-card ${plan.id === 'college' ? 'featured' : ''}`}
                    key={plan.id}
                  >
                    <span className="eyebrow">
                      {plan.id === 'college'
                        ? 'FOR YOUR INSTITUTION'
                        : 'FOR YOUR CLASSROOM'}
                    </span>
                    <h2>{plan.name}</h2>
                    <div className="price">
                      {plan.amount
                        ? `GH₵ ${Number(plan.amount).toLocaleString()}`
                        : 'Pricing to be set'}
                      {plan.amount && <small> / 30 days</small>}
                    </div>
                    <p>
                      {plan.id === 'college'
                        ? 'A shared institutional workspace with administrator and lecturer roles.'
                        : 'A dedicated teaching workspace for an individual lecturer.'}
                    </p>
                    <ul>
                      <li>
                        <CheckCircle2 size={17} />
                        Modules and course materials
                      </li>
                      <li>
                        <CheckCircle2 size={17} />
                        Timed assessments and gradebook
                      </li>
                      <li>
                        <CheckCircle2 size={17} />
                        Lecturer-managed student enrollment
                      </li>
                    </ul>
                    <button
                      className={`btn wide ${plan.id === 'college' ? 'primary' : 'secondary'}`}
                      disabled={!data.billingReady || !plan.amount || busy}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          const r = await api('billing', { plan: plan.id });
                          location.assign(r.url);
                        } catch (e) {
                          setError((e as Error).message);
                          setBusy(false);
                        }
                      }}
                    >
                      {data.billingReady && plan.amount
                        ? 'Continue to payment'
                        : 'Awaiting billing setup'}
                      <ArrowRight size={16} />
                    </button>
                  </section>
                ))}
              </div>
              <div className="notice">
                GHS checkout supports card and Mobile Money when the merchant
                account is configured. Prices are set by TAS administrators; no
                charges are enabled in this unconfigured pilot.
              </div>
              {data.payments.length > 0 && (
                <section className="panel">
                  <div className="panel-heading">
                    <h2>Payment history</h2>
                  </div>
                  {data.payments.map((p) => (
                    <div className="assessment-row" key={p.reference}>
                      <Wallet size={19} />
                      <div className="row-content">
                        <strong>GH₵ {(p.amount / 100).toFixed(2)}</strong>
                        <span>
                          {date(p.created_at)} · {p.reference}
                        </span>
                      </div>
                      <span
                        className={`pill ${p.status === 'paid' ? 'green' : 'amber'}`}
                      >
                        {p.status}
                      </span>
                    </div>
                  ))}
                </section>
              )}
            </>
          )}
          <footer className="workspace-footer">
            <span>AFC · AuraFlow Class</span>
            <span>
              Technology learning platform <span className="live-dot" />
            </span>
          </footer>
        </main>
      </div>
      {editor && (
        <Editor
          mode={editor.mode}
          context={editor.context}
          data={data}
          onClose={() => setEditor(null)}
          onSaved={refresh}
        />
      )}
      {lesson && (
        <Modal
          title={lesson.title}
          description={
            lesson.kind === 'video' ? 'Video lesson' : 'Course material'
          }
          onClose={() => setLesson(null)}
        >
          {lesson.kind === 'video' &&
            lesson.file_name &&
            lesson.captions_name &&
            /\.(mp4|webm)$/i.test(lesson.file_name) && (
              <video
                className="lesson-video"
                controls
                preload="metadata"
                src={`/api/afc/lessons/${lesson.id}/file`}
              >
                <track
                  kind="captions"
                  src={`/api/afc/lessons/${lesson.id}/captions`}
                  srcLang="en"
                  label="English"
                  default
                />
              </video>
            )}
          {lesson.kind === 'video' && <YouTubeEmbed content={lesson.content} />}
          <article className="lesson-content">{lesson.content}</article>
          {lesson.file_name && (
            <a
              className="btn secondary"
              href={`/api/afc/lessons/${lesson.id}/file`}
            >
              <Download size={16} />
              {lesson.file_name}
            </a>
          )}
          {student && (
            <button
              className="btn primary"
              disabled={busy || data.completion.includes(lesson.id)}
              onClick={async () => {
                await act(
                  `lessons/${lesson.id}/complete`,
                  {},
                  'Lesson completed.',
                );
                setLesson(null);
              }}
            >
              <CheckCircle2 size={16} />
              {data.completion.includes(lesson.id)
                ? 'Completed'
                : 'Mark lesson complete'}
            </button>
          )}
        </Modal>
      )}
      {assessment && (
        <AssessmentPlayer
          assessment={assessment}
          onClose={() => setAssessment(null)}
          onSaved={refresh}
        />
      )}
    </SidebarProvider>
  );
}

function YouTubeEmbed({ content }: { content: string }) {
  const candidate = content.trim().split(/\r?\n/)[0] || '';
  let videoId = '';
  try {
    const url = new URL(candidate);
    if (url.hostname === 'youtu.be') videoId = url.pathname.slice(1);
    if (url.hostname.includes('youtube.com'))
      videoId = url.searchParams.get('v') || url.pathname.split('/').at(-1) || '';
  } catch {
    videoId = /^[\w-]{11}$/.test(candidate) ? candidate : '';
  }
  if (!/^[\w-]{11}$/.test(videoId)) return null;
  const origin = typeof window === 'undefined' ? '' : `&origin=${encodeURIComponent(window.location.origin)}`;
  return (
    <iframe
      className="lesson-video"
      title="AFC lesson video"
      src={`https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1${origin}`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  );
}
function Stat({
  title,
  value,
  detail,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  detail: string;
  icon: typeof BookOpen;
  color: string;
}) {
  return (
    <section className="stat">
      <div>
        <span>{title}</span>
        <span className={`stat-icon ${color}`}>
          <Icon size={20} />
        </span>
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </section>
  );
}
function Metric({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  return (
    <div className="metric">
      <div>
        <span>{label}</span>
        <strong>
          {value}
          <span> / {total}</span>
        </strong>
      </div>
      <Progress value={total ? (value / total) * 100 : 0} />
    </div>
  );
}
function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="search-bar">
      <Search size={18} />
      <input
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
function Roster({
  items,
  courses,
  busy,
  revoke,
}: {
  items: Row[];
  courses: Row[];
  busy: boolean;
  revoke: (e: Row) => void;
}) {
  const [confirm, setConfirm] = useState<Row | null>(null);
  return (
    <section className="panel">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Classroom</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Enrollment</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((e) => (
            <TableRow key={e.id}>
              <TableCell>
                <div className="table-person">
                  <span className="avatar light">{initials(e.name)}</span>
                  <div>
                    <strong>{e.name}</strong>
                    <span>{e.email}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {courses.find((c) => c.id === e.course_id)?.code}
              </TableCell>
              <TableCell>
                {e.activated ? 'Activated' : 'Invitation pending'}
              </TableCell>
              <TableCell>
                <span className={`pill ${e.active ? 'green' : 'neutral'}`}>
                  {e.active ? 'Enrolled' : 'Revoked'}
                </span>
              </TableCell>
              <TableCell>
                {e.active ? (
                  <button
                    className="text-button danger"
                    disabled={busy}
                    onClick={() => setConfirm(e)}
                  >
                    Revoke access
                  </button>
                ) : (
                  '—'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!items.length && (
        <Empty title="No students here yet">
          Enroll students to give them access to your classroom.
        </Empty>
      )}
      {confirm && (
        <Modal
          title="Revoke classroom access?"
          alert
          description={`${confirm.name} will lose access to this classroom. Their submitted work and grades remain in the institution’s records.`}
          onClose={() => setConfirm(null)}
        >
          <div className="button-row">
            <button className="btn secondary" onClick={() => setConfirm(null)}>
              Cancel
            </button>
            <button
              className="btn primary"
              onClick={() => {
                revoke(confirm);
                setConfirm(null);
              }}
            >
              Revoke access
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
function exportGrades(data: Snapshot) {
  const cell = (value: string | number | null | undefined) => {
    let text = String(value ?? '');
    if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const rows = [
    ['student', 'email', 'assessment', 'attempt', 'score', 'status'],
    ...data.attempts.map((a) => [
      a.student_name,
      a.student_email,
      data.assessments.find((item) => item.id === a.assessment_id)?.title,
      a.number,
      a.score,
      a.released ? 'released' : a.status,
    ]),
  ];
  const url = URL.createObjectURL(
    new Blob([rows.map((row) => row.map(cell).join(',')).join('\r\n')], {
      type: 'text/csv;charset=utf-8;',
    }),
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'tas-gradebook.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}
