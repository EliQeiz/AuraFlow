'use client';
import { useCallback, useEffect, useState } from 'react';
import { Monitor, ShieldCheck } from 'lucide-react';
import { api, type Row } from './types';
import { Modal } from './forms';

const timestamp = (value: number) =>
  new Date(value).toLocaleString('en-GH', { timeZone: 'Africa/Accra' });
export function SessionSecurity() {
  const [sessions, setSessions] = useState<Row[]>([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [loaded, setLoaded] = useState(false),
    [notice, setNotice] = useState('');
  const [confirm, setConfirm] = useState<Row | null>(null);
  const load = useCallback(async () => {
    try {
      const result = await api('security');
      setSessions(result.sessions);
      setLoaded(true);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);
  async function revoke() {
    setBusy(true);
    setError('');
    try {
      await api(confirm?.all ? 'security/revoke-others' : 'security/revoke', {
        id: confirm?.id,
      });
      setConfirm(null);
      await load();
      setNotice('Selected sessions have been signed out.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel settings-panel session-panel">
      <div className="panel-heading">
        <h2>
          <ShieldCheck size={20} /> Active sessions
        </h2>
        <button
          className="btn secondary small"
          disabled={!loaded || busy || !sessions.some((s) => !s.current)}
          onClick={() => setConfirm({ all: true })}
        >
          Sign out other sessions
        </button>
      </div>
      <p>
        Review where you are signed in. Device descriptions are supplied by the
        browser and may not identify a physical device uniquely.
      </p>
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
      {notice && <output>{notice}</output>}
      {!loaded && (
        <button className="btn secondary small" onClick={load}>
          Load sessions
        </button>
      )}
      {sessions.map((s, i) => (
        <div className="session-record" key={s.id || i}>
          <Monitor size={20} />
          <div>
            <strong>{s.current ? 'This session' : 'Another session'}</strong>
            <p className="session-device">
              {s.device || 'Earlier session · device details unavailable'}
            </p>
            <span>
              {s.created_at ? `Signed in ${timestamp(s.created_at)} · ` : ''}
              Expires {timestamp(s.expires_at)} GMT
            </span>
          </div>
          {s.id && !s.current && (
            <button
              className="btn secondary small"
              onClick={() => setConfirm(s)}
              disabled={busy}
            >
              Sign out
            </button>
          )}
        </div>
      ))}
      {confirm && (
        <Modal
          title="Sign out sessions?"
          description="These sessions will lose access immediately. Your current session stays signed in."
          alert
          onClose={() => !busy && setConfirm(null)}
        >
          {error && <p role="alert">{error}</p>}
          <div className="directory-actions">
            <button
              className="btn secondary"
              disabled={busy}
              onClick={() => setConfirm(null)}
            >
              Cancel
            </button>
            <button className="btn primary" disabled={busy} onClick={revoke}>
              {busy ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
export function GradeHistory({
  attempt,
  close,
}: {
  attempt: Row;
  close: () => void;
}) {
  const [history, setHistory] = useState<Row[] | null>(null),
    [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      setHistory((await api(`attempts/${attempt.id}/history`)).history);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [attempt.id]);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);
  return (
    <Modal
      title="Grade change history"
      description={`${attempt.student_name || 'Student'} · Records include scoring, feedback changes, and grade publication.`}
      onClose={close}
    >
      {error && (
        <div role="alert">
          {error}
          <button className="btn secondary" onClick={load}>
            Retry
          </button>
        </div>
      )}
      <div className="grade-history">
        {history === null && !error && <p>Loading history…</p>}
        {history?.length === 0 && (
          <p>
            No changes recorded since grade history was introduced. Earlier
            edits are not reconstructed.
          </p>
        )}
        {history?.map((h) => (
          <article key={h.id}>
            <div className="history-heading">
              <strong>Revision {h.revision}</strong>
              <span>{timestamp(h.created_at)} GMT</span>
            </div>
            <p>
              {h.old_score ?? 'Ungraded'} → {h.new_score ?? 'Ungraded'}% ·{' '}
              {h.new_released ? 'Released' : 'Withheld'}
            </p>
            <p>
              <strong>{h.actor_name || 'Assessment system'}</strong> ·{' '}
              {h.reason}
            </p>
            {h.old_feedback !== h.new_feedback && (
              <details>
                <summary>Feedback change</summary>
                <p>Previous: {h.old_feedback || 'None'}</p>
                <p>Updated: {h.new_feedback || 'None'}</p>
              </details>
            )}
          </article>
        ))}
      </div>
      {history?.length === 200 && <p>Showing the latest 200 revisions.</p>}
      <button className="btn secondary" onClick={close}>
        Close
      </button>
    </Modal>
  );
}
