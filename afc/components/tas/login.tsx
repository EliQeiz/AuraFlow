'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { api } from './types';
import { Field } from './forms';

export function Login({ onLogin }: { onLogin: () => Promise<void> }) {
  const [status, setStatus] = useState<{
      configured: boolean;
      local: boolean;
    } | null>(null),
    [invite, setInvite] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [activated, setActivated] = useState(false);
  useEffect(() => {
    api<{ configured: boolean; local: boolean }>('status')
      .then((result) => {
        setStatus(result);
        setInvite(
          new URLSearchParams(window.location.search).get('invite') || '',
        );
      })
      .catch((e) => setError(e.message));
  }, []);
  async function login(email: string, password: string) {
    setBusy(true);
    setError('');
    try {
      await api('login', { email, password });
      await onLogin();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const b = Object.fromEntries(new FormData(event.currentTarget));
    if (!invite && status?.configured)
      return login(
        typeof b.email === 'string' ? b.email : '',
        typeof b.password === 'string' ? b.password : '',
      );
    setBusy(true);
    setError('');
    try {
      if (invite) {
        await api('activate', { token: invite, password: b.password });
        setInvite('');
        setActivated(true);
        history.replaceState({}, '', '/');
      } else {
        await api('setup', b);
        await onLogin();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-story">
        <Link className="brand" href="/">
          <span className="brand-mark">
            <GraduationCap />
          </span>
          <strong>
            AFC<span>AuraFlow Class</span>
          </strong>
        </Link>
        <div className="login-message">
          <span className="eyebrow">PRACTICAL TECHNOLOGY EDUCATION</span>
          <h1>
            Build skills that
            <br />
            <em>move your work forward.</em>
          </h1>
          <p>
            Courses, practice, assessments, and professional certificates.
            <br />
            One focused learning space from AuraFlow.
          </p>
          <div className="login-feature">
            <BookOpen />
            <div>
              <strong>Learn by building</strong>
              <span>Follow guided paths in AI, data, web, mobile, and software development.</span>
            </div>
          </div>
          <div className="login-feature">
            <Users />
            <div>
              <strong>Learn at your pace</strong>
              <span>Video-led lessons, notes, assignments, feedback, and visible progress.</span>
            </div>
          </div>
          <div className="login-feature">
            <ShieldCheck />
            <div>
              <strong>Earn with integrity</strong>
              <span>Server-timed assessments, randomized questions, and reviewable integrity signals.</span>
            </div>
          </div>
        </div>
        <div className="login-foot">
          <span className="ghana-mark">
            <i />
            <i />
            <i />
          </span>
          Built in Ghana for Africa and the world
        </div>
      </section>
      <section className="login-form-side">
        <div className="login-form-wrap">
          <span className="pill amber">AURAFLOW CLASS</span>
          <h2>
            {invite
              ? 'You’re invited.'
              : status && !status.configured
                ? 'Set up AuraFlow Class.'
                : 'Welcome to AFC.'}
          </h2>
          <p>
            {invite
              ? 'Create a password to activate your AFC account.'
              : status && !status.configured
                ? 'Create the first AFC owner account.'
                : 'Sign in to your learning or instructor workspace.'}
          </p>
          {activated && (
            <div className="notice">
              <CheckCircle2 size={16} /> Account activated. You can now sign in.
            </div>
          )}
          <form onSubmit={submit} className="editor-form">
            {status && !status.configured && !invite && (
              <>
                <Field label="Setup token">
                  <input name="token" type="password" required />
                </Field>
                <Field label="Academy name">
                  <input name="institution" defaultValue="AuraFlow Class" required />
                </Field>
                <Field label="Learning period label">
                  <input
                    name="semester"
                    defaultValue="2026/2027 · Semester 1"
                    required
                  />
                </Field>
                <Field label="AFC owner name">
                  <input name="name" required />
                </Field>
              </>
            )}
            {!invite && (
              <Field label="Email address">
                <input
                  name="email"
                  type="email"
                  autoComplete="username"
                  placeholder="you@example.com"
                  required
                />
              </Field>
            )}
            <Field
              label={invite ? 'Create password' : 'Password'}
              hint={invite ? 'Use at least 12 characters.' : undefined}
            >
              <input
                name="password"
                type="password"
                autoComplete={invite ? 'new-password' : 'current-password'}
                minLength={invite || !status?.configured ? 12 : undefined}
                maxLength={128}
                required
                placeholder="Enter your password"
              />
            </Field>
            {error && (
              <div className="error" role="alert">
                {error}
              </div>
            )}
            <button className="btn primary wide" disabled={busy || !status}>
              {busy
                ? 'Please wait…'
                : invite
                  ? 'Activate account'
                  : status?.configured
                    ? 'Sign in'
                    : 'Create AFC'}
              <ArrowRight size={18} />
            </button>
          </form>
          {status?.configured && !invite && (
            <p className="login-help">
              New learner? Use the private invitation from your instructor.
              <br />
              For account assistance, contact the AFC team.
            </p>
          )}
          {status?.local && status.configured && !invite && (
            <div className="demo-access">
              <strong>Explore the local AFC build</strong>
              <p>
                Fictional records only. Choose a workspace to try the learning workflow.
              </p>
              <div className="button-row">
                <button
                  className="btn secondary"
                  disabled={busy}
                  onClick={() =>
                    login('lecturer@tas.local', 'TAS-local-pilot-2026!')
                  }
                >
                  Instructor workspace
                </button>
                <button
                  className="btn secondary"
                  disabled={busy}
                  onClick={() =>
                    login('student@tas.local', 'TAS-local-pilot-2026!')
                  }
                >
                  Learner workspace
                </button>
              </div>
            </div>
          )}
          <div className="login-bottom">
            <ShieldCheck size={15} /> Access and protected learning records are controlled by AFC.
          </div>
        </div>
      </section>
    </main>
  );
}
