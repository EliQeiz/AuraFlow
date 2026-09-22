'use client';
import { useEffectEvent, useEffect, useRef, useState } from 'react';
import { Clock3, ShieldCheck, Send, CheckCircle2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { api, upload, type Row } from './types';
import { Modal, Field } from './forms';

export function AssessmentPlayer({
  assessment,
  onClose,
  onSaved,
}: {
  assessment: Row;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [attempt, setAttempt] = useState<Row | null>(null),
    [answers, setAnswers] = useState<Record<string, number>>({}),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [remaining, setRemaining] = useState(0),
    [saved, setSaved] = useState('');
  const offset = useRef(0),
    answerRef = useRef<Record<string, number>>({}),
    queue = useRef(Promise.resolve()),
    submitting = useRef(false),
    timeoutSent = useRef(false),
    integrityQueue = useRef(Promise.resolve()),
    lastIntegrity = useRef<Record<string, number>>({});
  function reportIntegrity(event: string) {
    if (!attempt || attempt.status !== 'in_progress') return;
    const timestamp = Date.now();
    if (timestamp - (lastIntegrity.current[event] || 0) < 5000) return;
    lastIntegrity.current[event] = timestamp;
    integrityQueue.current = integrityQueue.current
      .then(async () => {
        await api(`attempts/${attempt.id}/integrity`, { event });
      })
      .catch(() => {});
  }
  async function start() {
    setBusy(true);
    setError('');
    try {
      if (
        assessment.integrity_mode === 'focused' ||
        assessment.integrity_mode === 'review'
      )
        await document.documentElement.requestFullscreen?.().catch(() => undefined);
      const r = await api(`assessments/${assessment.id}/start`, {});
      offset.current = r.serverTime - Date.now();
      setRemaining(
        Math.max(0, Math.ceil((r.attempt.deadline - r.serverTime) / 1000)),
      );
      setAttempt(r.attempt);
      setAnswers(r.attempt.answers);
      answerRef.current = r.attempt.answers;
      timeoutSent.current = false;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function choose(qid: string, value: number) {
    if (submitting.current) return;
    const next = { ...answerRef.current, [qid]: value };
    answerRef.current = next;
    setAnswers(next);
    setSaved('Saving…');
    queue.current = queue.current.then(async () => {
      try {
        const r = await api(`attempts/${attempt!.id}/save`, { answers: next });
        setSaved('Saved');
        setError('');
        if (r.attempt.status !== 'in_progress') {
          setAttempt(r.attempt);
          await onSaved();
        }
      } catch (e) {
        setSaved('Not saved');
        setError(
          (e as Error).message +
            ' Your selected answers are still on this screen. Retry submitting before time expires.',
        );
      }
    });
  }
  async function submit() {
    if (!attempt || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      await queue.current;
      const r = await api(`attempts/${attempt.id}/submit`, {
        answers: answerRef.current,
      });
      setAttempt(r.attempt);
      await onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      submitting.current = false;
    }
  }
  const expireAttempt = useEffectEvent(() => {
    void submit();
  });
  useEffect(() => {
    if (!attempt || attempt.status !== 'in_progress') return;
    const interval = setInterval(() => {
      const seconds = Math.max(
        0,
        Math.ceil((attempt.deadline - Date.now() - offset.current) / 1000),
      );
      setRemaining(seconds);
      if (seconds === 0 && !timeoutSent.current) {
        timeoutSent.current = true;
        expireAttempt();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [attempt]);
  useEffect(() => {
    if (attempt?.status !== 'in_progress') return;
    reportIntegrity('assessment_opened');
    const visibility = () => {
      if (document.visibilityState === 'hidden') reportIntegrity('visibility_hidden');
    };
    const focus = () => reportIntegrity('focus_lost');
    const fullscreen = () => {
      if (!document.fullscreenElement) reportIntegrity('fullscreen_exit');
    };
    const clipboard = () => reportIntegrity('clipboard_attempt');
    const paste = () => reportIntegrity('paste_attempt');
    const offline = () => reportIntegrity('connection_lost');
    const online = () => reportIntegrity('connection_restored');
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('blur', focus);
    document.addEventListener('fullscreenchange', fullscreen);
    document.addEventListener('copy', clipboard);
    document.addEventListener('cut', clipboard);
    document.addEventListener('paste', paste);
    window.addEventListener('offline', offline);
    window.addEventListener('online', online);
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('blur', focus);
      document.removeEventListener('fullscreenchange', fullscreen);
      document.removeEventListener('copy', clipboard);
      document.removeEventListener('cut', clipboard);
      document.removeEventListener('paste', paste);
      window.removeEventListener('offline', offline);
      window.removeEventListener('online', online);
    };
  }, [attempt]);
  useEffect(() => {
    if (attempt?.status !== 'in_progress') return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [attempt]);
  async function submitWork(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const form = e.currentTarget;
    const values = new FormData(form);
    try {
      const result = await api(`assessments/${assessment.id}/submit-work`, {
        text: values.get('text'),
      });
      const file = (form.elements.namedItem('file') as HTMLInputElement)
        .files?.[0];
      if (file) {
        try {
          await upload(`attempts/${result.id}/file`, file);
        } catch (e) {
          setError(
            `Your written work was submitted, but the attachment failed: ${(e as Error).message}`,
          );
          setAttempt({ status: 'submitted', id: result.id });
          await onSaved();
          return;
        }
      }
      setAttempt({ status: 'submitted' });
      await onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const complete = attempt && attempt.status !== 'in_progress';
  return (
    <Modal
      title={assessment.title}
      description={`${assessment.kind === 'quiz' ? 'Timed quiz' : 'Written submission'} · Pass mark ${assessment.pass_mark}%`}
      onClose={() => {
        if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
        onClose();
      }}
    >
      {complete ? (
        <div className="assessment-result">
          <CheckCircle2 size={44} />
          <h2>
            {assessment.kind === 'quiz'
              ? 'Attempt completed'
              : 'Submission received'}
          </h2>
          <p>
            {assessment.kind === 'quiz'
              ? attempt.passed
                ? 'You reached the pass mark. Continue to your next module.'
                : 'The pass mark has not been reached. Review the material before another attempt.'
              : 'Your lecturer will review your work and release your grade.'}
          </p>
          <p className="hint">
            Your grade appears in your gradebook when your lecturer releases it.
          </p>
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          <button className="btn primary" onClick={onClose}>
            Back to learning
          </button>
        </div>
      ) : assessment.kind !== 'quiz' ? (
        <form className="editor-form" onSubmit={submitWork}>
          <p className="prewrap">{assessment.instructions}</p>
          <Field label="Your submission">
            <textarea
              name="text"
              rows={9}
              maxLength={50000}
              required
              placeholder="Write your response or describe the attached project."
            />
          </Field>
          <Field
            label="Supporting file (optional)"
            hint="Up to 20 MB · PDF, TXT, DOCX, PPTX, MP4 or WebM"
          >
            <input
              type="file"
              name="file"
              accept=".pdf,.txt,.docx,.pptx,.mp4,.webm"
            />
          </Field>
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          <button className="btn primary" disabled={busy}>
            <Send size={16} />
            {busy ? 'Submitting…' : 'Submit work'}
          </button>
        </form>
      ) : !attempt ? (
        <div className="quiz-intro">
          <p className="prewrap">{assessment.instructions}</p>
          <div className="quiz-facts">
            <div>
              <Clock3 />
              <strong>{assessment.duration_minutes} min</strong>
              <span>Time limit</span>
            </div>
            <div>
              <ShieldCheck />
              <strong>{assessment.max_attempts} attempts</strong>
              <span>Maximum allowed</span>
            </div>
          </div>
          <div className="notice">
            Complete this module’s lessons before starting. The timer continues
            if you close the page. Answers save as you work; only answers saved
            before the deadline count after time expires.
          </div>
          <div className="notice">
            <ShieldCheck size={16} /> {assessment.integrity_mode === 'standard'
              ? 'Standard integrity records assessment timing and selected assessment-context events. It does not record your webcam, microphone, or keystrokes.'
              : 'Focused integrity requests full screen and records assessment-context events for instructor review. It does not record your webcam, microphone, or keystrokes.'}
          </div>
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          <button className="btn primary" disabled={busy} onClick={start}>
            {busy ? 'Opening attempt…' : 'Start / resume quiz'}
            <Arrow />
          </button>
        </div>
      ) : (
        <div className="quiz-player">
          <div className="timer-row">
            <span>
              {Object.keys(answers).length} of {attempt.questions.length}{' '}
              answered · {saved}
            </span>
            <strong className={remaining < 60 ? 'urgent' : ''}>
              <Clock3 size={17} />
              {Math.floor(remaining / 60)}:
              {String(remaining % 60).padStart(2, '0')}
            </strong>
          </div>
          <Progress
            value={
              (Object.keys(answers).length / attempt.questions.length) * 100
            }
          />
          {attempt.questions.map((q: Row, i: number) => (
            <fieldset className="quiz-question" key={q.id}>
              <legend>
                <span>{i + 1}</span>
                {q.prompt}
              </legend>
              <RadioGroup
                value={answers[q.id] === undefined ? '' : String(answers[q.id])}
                onValueChange={(v) => choose(q.id, Number(v))}
                disabled={busy || remaining === 0}
              >
                {q.options.map((option: string, j: number) => (
                  <label
                    className={`quiz-option ${answers[q.id] === j ? 'selected' : ''}`}
                    key={j}
                  >
                    <RadioGroupItem value={String(j)} />
                    <span>{option}</span>
                  </label>
                ))}
              </RadioGroup>
            </fieldset>
          ))}
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          <button className="btn primary" disabled={busy} onClick={submit}>
            <Send size={16} />
            {busy ? 'Submitting…' : 'Submit answers'}
          </button>
          <p className="hint">
            Submission is final for this attempt. Unanswered questions receive
            no marks.
          </p>
        </div>
      )}
    </Modal>
  );
}
function Arrow() {
  return <span aria-hidden>→</span>;
}
