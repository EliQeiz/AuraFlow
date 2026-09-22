'use client';
import { useState, type ReactNode } from 'react';
import { Plus, Trash2, Check, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { api, upload, type Row, type Snapshot } from './types';

export function Choice({
  value,
  onChange,
  items,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  items: { value: string; label: string }[];
  label: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => v !== null && onChange(v)}
      items={items}
    >
      <SelectTrigger className="choice" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((i) => (
          <SelectItem value={i.value} key={i.value}>
            {i.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Plus size={22} />
      </div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}
export function Modal({
  title,
  description,
  onClose,
  children,
  alert = false,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  alert?: boolean;
}) {
  const Root = alert ? AlertDialog : Dialog;
  const Content = alert ? AlertDialogContent : DialogContent;
  const Title = alert ? AlertDialogTitle : DialogTitle;
  const Description = alert ? AlertDialogDescription : DialogDescription;
  return (
    <Root open onOpenChange={(open) => !open && onClose()}>
      <Content className="tas-modal">
        <Title className="modal-title">{title}</Title>
        <Description>
          {description || 'Manage your teaching workspace.'}
        </Description>
        {children}
      </Content>
    </Root>
  );
}

export function Editor({
  mode,
  context,
  data,
  onClose,
  onSaved,
}: {
  mode: string;
  context?: Row;
  data: Snapshot;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [result, setResult] = useState('');
  const [kind, setKind] = useState(mode === 'assessment' ? 'quiz' : 'note'),
    [courseId, setCourseId] = useState(
      context?.course_id || data.courses[0]?.id || '',
    ),
    [moduleId, setModuleId] = useState(context?.module_id || '');
  const [questions, setQuestions] = useState([
    { prompt: '', options: ['', '', '', ''], correct: 0 },
  ]);
  const titles: Record<string, string> = {
    course: 'Create a classroom',
    module: 'Add a module',
    lesson: 'Add course material',
    assessment: 'Create an assessment',
    enroll: 'Enroll a student',
    staff: 'Invite a lecturer',
    grade: 'Grade submission',
    import: 'Import grades',
    password: 'Change your password',
  };
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries()) as Row;
    try {
      let response: Row = {};
      if (mode === 'course')
        response = await api('courses', { ...values, color: 'blue' });
      if (mode === 'module')
        response = await api(`courses/${context!.id}/modules`, values);
      if (mode === 'lesson') {
        response = await api(`modules/${context!.id}/lessons`, {
          ...values,
          kind,
        });
        const file = (form.elements.namedItem('file') as HTMLInputElement)
          ?.files?.[0];
        if (file) await upload(`lessons/${response.id}/file`, file);
        const captions = (
          form.elements.namedItem('captions') as HTMLInputElement
        )?.files?.[0];
        if (captions) await upload(`lessons/${response.id}/captions`, captions);
      }
      if (mode === 'assessment') {
        if (!moduleId) throw new Error('Choose a module.');
        response = await api(`modules/${moduleId}/assessments`, {
          ...values,
          kind,
          questions,
          dueAt: values.dueAt ? `${values.dueAt}:00Z` : null,
        });
      }
      if (mode === 'enroll') {
        if (!courseId) throw new Error('Create a classroom first.');
        response = await api(`courses/${courseId}/enroll`, values);
      }
      if (mode === 'staff') response = await api('staff', values);
      if (mode === 'grade')
        response = await api(`attempts/${context!.id}/grade`, {
          ...values,
          revision: context!.revision,
        });
      if (mode === 'password') {
        await api('password', values);
        window.location.assign('/');
        return;
      }
      if (mode === 'import') {
        const lines = String(values.csv).trim().split(/\r?\n/);
        if (lines[0]?.toLowerCase().replace(/\s/g, '') !== 'email,score')
          throw new Error('The first line must be email,score.');
        const rows = lines
          .slice(1)
          .filter(Boolean)
          .map((line) => {
            const parts = line.split(',');
            if (parts.length !== 2)
              throw new Error('Use two columns: email and score.');
            if (!parts[1].trim()) throw new Error('Every row needs a score.');
            return { email: parts[0].trim(), score: Number(parts[1]) };
          });
        response = await api(`assessments/${context!.id}/import`, { rows });
      }
      await onSaved();
      if (response.activationPath)
        setResult(
          new URL(response.activationPath, window.location.origin).href,
        );
      else onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const moduleOptions = data.modules.filter((m) => m.course_id === courseId);
  return (
    <Modal
      title={titles[mode] || 'Edit'}
      description={
        mode === 'enroll'
          ? 'Students receive access only to the classroom you select.'
          : 'Changes are saved to your institution’s workspace.'
      }
      onClose={onClose}
    >
      {result ? (
        <div className="invite-result">
          <div className="success-icon">
            <Check />
          </div>
          <h3>Invitation is ready</h3>
          <p>
            Share this private link directly with the intended person. It
            expires in 48 hours and can be used once.
          </p>
          <input
            aria-label="Activation link"
            readOnly
            value={result}
            onFocus={(e) => e.target.select()}
          />
          <button
            className="btn primary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(result);
                setResult(result);
                setError('Link copied.');
              } catch {
                setError('Select and copy the link above.');
              }
            }}
          >
            Copy invitation link
          </button>
          <output>{error}</output>
        </div>
      ) : (
        <form onSubmit={submit} className="editor-form">
          {mode === 'course' && (
            <>
                <Field label="Course title">
                <input
                  name="title"
                  placeholder="e.g. Introduction to Computer Science"
                  required
                  maxLength={300}
                />
              </Field>
              <div className="form-grid">
                <Field label="Course code">
                  <input
                    name="code"
                    placeholder="CS 101"
                    required
                    maxLength={30}
                  />
                </Field>
                <Field label="Learning level">
                  <select name="level" defaultValue="beginner">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </Field>
              </div>
              <Field label="About this course">
                <textarea
                  name="description"
                  placeholder="What will students learn?"
                  required
                  maxLength={3000}
                />
              </Field>
              <div className="form-grid">
                <Field label="Price (GHS)">
                  <input
                    name="priceGhs"
                    type="number"
                    min={0}
                    max={1000000}
                    defaultValue={0}
                  />
                </Field>
                <Field label="YouTube playlist ID (optional)">
                  <input
                    name="youtubePlaylistId"
                    maxLength={100}
                    placeholder="PL..."
                  />
                </Field>
              </div>
              <p className="hint">
                Courses start as drafts. Publish after lessons and assessment settings are ready.
              </p>
            </>
          )}
          {mode === 'module' && (
            <Field label="Module title">
              <input
                name="title"
                placeholder="e.g. Foundations of programming"
                required
              />
            </Field>
          )}
          {(mode === 'enroll' || mode === 'staff') && (
            <>
              <Field label="Full name">
                <input
                  name="name"
                  placeholder="Full name"
                  required
                  autoComplete="name"
                />
              </Field>
              <Field label="Email address">
                <input
                  type="email"
                  name="email"
                  placeholder="name@college.edu.gh"
                  required
                  autoComplete="email"
                />
              </Field>
              {mode === 'enroll' && (
                <Field label="Classroom">
                  <Choice
                    label="Classroom"
                    value={courseId}
                    onChange={setCourseId}
                    items={data.courses.map((c) => ({
                      value: c.id,
                      label: `${c.code} · ${c.title}`,
                    }))}
                  />
                </Field>
              )}
              <div className="notice">
                Access is tied to this account. Students cannot enroll
                themselves or choose a different classroom.
              </div>
            </>
          )}
          {mode === 'lesson' && (
            <>
              <Field label="Material title">
                <input
                  name="title"
                  required
                  placeholder="e.g. Understanding algorithms"
                />
              </Field>
              <Field label="Material type">
                <Choice
                  label="Material type"
                  value={kind}
                  onChange={setKind}
                  items={[
                    { value: 'note', label: 'Reading / notes' },
                    { value: 'video', label: 'Video lesson' },
                    { value: 'slides', label: 'Lecture slides' },
                  ]}
                />
              </Field>
              <Field
                label={kind === 'video' ? 'YouTube video URL or lesson notes' : 'Lesson content / instructions'}
                hint={kind === 'video' ? 'Paste an unlisted or public YouTube URL to embed it in AFC. Add learning outcomes below the link.' : undefined}
              >
                <textarea
                  name="content"
                  rows={6}
                  required
                  placeholder={kind === 'video' ? 'https://www.youtube.com/watch?v=...\n\nWhat should learners take away from this lesson?' : 'Write your lesson notes, learning outcomes, or instructions…'}
                  maxLength={50000}
                />
              </Field>
              <Field
                label="Attach a file"
                hint="PDF, TXT, MP4, WebM, PPTX or DOCX · Up to 20 MB in this pilot"
              >
                <input
                  type="file"
                  name="file"
                  accept=".pdf,.txt,.mp4,.webm,.pptx,.docx"
                />
              </Field>
              {kind === 'video' && (
                <Field
                  label="Video captions"
                  hint="WebVTT (.vtt) · Up to 1 MB. Add captions for spoken content."
                >
                  <input type="file" name="captions" accept=".vtt" />
                </Field>
              )}
            </>
          )}
          {mode === 'assessment' && (
            <>
              <Field label="Assessment title">
                <input
                  name="title"
                  placeholder="e.g. Foundations checkpoint"
                  required
                />
              </Field>
              <div className="form-grid">
                <Field label="Classroom">
                  <Choice
                    label="Classroom"
                    value={courseId}
                    onChange={(v) => {
                      setCourseId(v);
                      setModuleId('');
                    }}
                    items={data.courses.map((c) => ({
                      value: c.id,
                      label: c.code,
                    }))}
                  />
                </Field>
                <Field label="Module">
                  <Choice
                    label="Module"
                    value={moduleId}
                    onChange={setModuleId}
                    items={moduleOptions.map((m) => ({
                      value: m.id,
                      label: m.title,
                    }))}
                  />
                </Field>
              </div>
              <Field label="Assessment type">
                <Choice
                  label="Assessment type"
                  value={kind}
                  onChange={setKind}
                  items={[
                    {
                      value: 'quiz',
                      label: 'Timed quiz · automatically graded',
                    },
                    {
                      value: 'assignment',
                      label: 'Assignment · lecturer graded',
                    },
                    { value: 'project', label: 'Project · lecturer graded' },
                  ]}
                />
              </Field>
              <Field label="Instructions">
                <textarea
                  name="instructions"
                  required
                  placeholder="Tell students what is expected."
                />
              </Field>
              <div className="form-grid three">
                <Field label="Pass mark (%)">
                  <input
                    type="number"
                    name="passMark"
                    defaultValue={70}
                    min={1}
                    max={100}
                    required
                  />
                </Field>
                <Field label="Attempts">
                  <input
                    type="number"
                    name="maxAttempts"
                    defaultValue={2}
                    min={1}
                    max={10}
                    required
                  />
                </Field>
                <Field label="Time (minutes)">
                  <input
                    type="number"
                    name="durationMinutes"
                    defaultValue={30}
                    min={1}
                    max={240}
                    disabled={kind !== 'quiz'}
                  />
                </Field>
              </div>
              <Field label="Due date (Ghana time, optional)">
                <input type="datetime-local" name="dueAt" />
              </Field>
              {kind === 'quiz' && (
                <Field label="Integrity mode">
                  <select name="integrityMode" defaultValue="standard">
                    <option value="standard">Standard: server timing and integrity event log</option>
                    <option value="focused">Focused: request full screen and log context events</option>
                    <option value="review">Review: focused mode plus mandatory instructor review</option>
                  </select>
                </Field>
              )}
              {kind === 'quiz' && (
                <div className="question-editor">
                  <div className="section-heading">
                    <h3>Question bank</h3>
                    <span>{questions.length} questions</span>
                  </div>
                  {questions.map((q, index) => (
                    <div className="question-card" key={index}>
                      <div className="section-heading">
                        <strong>Question {index + 1}</strong>
                        {questions.length > 1 && (
                          <button
                            type="button"
                            className="icon-btn"
                            aria-label={`Remove question ${index + 1}`}
                            onClick={() =>
                              setQuestions(
                                questions.filter((_, i) => i !== index),
                              )
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      <textarea
                        aria-label={`Question ${index + 1}`}
                        value={q.prompt}
                        onChange={(e) =>
                          setQuestions(
                            questions.map((item, i) =>
                              i === index
                                ? { ...item, prompt: e.target.value }
                                : item,
                            ),
                          )
                        }
                        required
                        placeholder="Write a question…"
                      />
                      {q.options.map((option, oi) => (
                        <div className="option-editor" key={oi}>
                          <span>{String.fromCharCode(65 + oi)}</span>
                          <input
                            aria-label={`Question ${index + 1}, option ${oi + 1}`}
                            value={option}
                            onChange={(e) =>
                              setQuestions(
                                questions.map((item, i) =>
                                  i === index
                                    ? {
                                        ...item,
                                        options: item.options.map((v, j) =>
                                          j === oi ? e.target.value : v,
                                        ),
                                      }
                                    : item,
                                ),
                              )
                            }
                            required
                            placeholder={`Answer option ${oi + 1}`}
                          />
                        </div>
                      ))}
                      <Field label="Correct answer">
                        <Choice
                          label={`Correct answer for question ${index + 1}`}
                          value={String(q.correct)}
                          onChange={(v) =>
                            setQuestions(
                              questions.map((item, i) =>
                                i === index
                                  ? { ...item, correct: Number(v) }
                                  : item,
                              ),
                            )
                          }
                          items={q.options.map((_, i) => ({
                            value: String(i),
                            label: `Option ${String.fromCharCode(65 + i)}`,
                          }))}
                        />
                      </Field>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() =>
                      setQuestions([
                        ...questions,
                        { prompt: '', options: ['', '', '', ''], correct: 0 },
                      ])
                    }
                  >
                    <Plus size={16} />
                    Add question
                  </button>
                  <p className="hint">
                    Question and answer order are randomized for each attempt.
                    Correct answers remain on the server.
                  </p>
                </div>
              )}
            </>
          )}
          {mode === 'grade' && (
            <>
              <div className="submission-preview">
                <strong>{context!.student_name}</strong>
                <p>{context!.text_submission || 'No written response.'}</p>
                {context!.file_name && (
                  <a href={`/api/afc/attempts/${context!.id}/file`}>
                    Download {context!.file_name}
                  </a>
                )}
              </div>
              <Field label="Score (%)">
                <input
                  type="number"
                  name="score"
                  defaultValue={context!.score ?? ''}
                  min={0}
                  max={100}
                  required
                />
              </Field>
              <Field label="Feedback">
                <textarea
                  name="feedback"
                  defaultValue={context!.feedback}
                  maxLength={10000}
                  placeholder="Give specific, constructive feedback."
                />
              </Field>
              {context!.score !== null && (
                <Field
                  label="Reason for changing this grade"
                  hint="The reason is saved in the staff grade history."
                >
                  <textarea
                    name="reason"
                    required
                    maxLength={500}
                    placeholder="Explain the correction or review decision."
                  />
                </Field>
              )}
              <p className="hint">
                Save your assessment, then release the grade from the gradebook.
              </p>
            </>
          )}
          {mode === 'import' && (
            <>
              <div className="notice">
                Importing adds an assessed result for each enrolled student.
                Grades stay private until you release them.
              </div>
              <Field
                label="Paste CSV grades"
                hint="Scores must be whole numbers from 0 to 100. All rows are validated before any grades are saved."
              >
                <textarea
                  name="csv"
                  rows={9}
                  required
                  placeholder={'email,score\nstudent@college.edu.gh,85'}
                />
              </Field>
            </>
          )}
          {mode === 'password' && (
            <>
              <Field label="Current password">
                <input
                  name="current"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </Field>
              <Field label="New password">
                <input
                  name="password"
                  type="password"
                  required
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                />
              </Field>
              <p className="hint">
                At least 12 characters. Changing your password signs out all
                sessions.
              </p>
            </>
          )}
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          <div className="form-footer">
            <button className="btn secondary" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="btn primary" disabled={busy}>
              {busy
                ? 'Saving…'
                : mode === 'enroll'
                  ? 'Enroll student'
                  : mode === 'assessment'
                    ? 'Save assessment draft'
                    : mode === 'import'
                      ? 'Import grades'
                      : 'Save changes'}
              {!busy && <ArrowRight size={16} />}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
