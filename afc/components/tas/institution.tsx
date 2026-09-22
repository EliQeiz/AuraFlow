'use client';
import { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  CalendarDays,
  Plus,
  Search,
  Users,
  BookOpen,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { Choice, Empty, Field, Modal } from './forms';
import { api, date, type Row, type Snapshot } from './types';

type Directory = {
  departments: Row[];
  terms: Row[];
  people: Row[];
  peopleTotal: number;
  lecturers: Row[];
  allocations: Row[];
};
export function Institution({
  data,
  refresh,
  invite,
}: {
  data: Snapshot;
  refresh: () => Promise<void>;
  invite: () => void;
}) {
  const [directory, setDirectory] = useState<Directory | null>(null);
  const [page, setPage] = useState(1),
    [query, setQuery] = useState(''),
    [search, setSearch] = useState('');
  const [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState<{ mode: string; record?: Row } | null>(
    null,
  );
  const [invitation, setInvitation] = useState('');
  const load = useCallback(async () => {
    try {
      setDirectory(
        await api<Directory>(
          `institution?q=${encodeURIComponent(query)}&page=${page}`,
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }, [query, page]);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load, data]);
  async function save(path: string, values: unknown) {
    if (busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await api(`institution/${path}`, values);
      if (result.activationPath)
        setInvitation(new URL(result.activationPath, location.origin).href);
      setEditor(null);
      setMessage('Institution records updated.');
      await load();
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="institution-workspace">
      <div className="institution-intro panel">
        <Building2 size={30} />
        <div>
          <span className="eyebrow">ACADEMIC OPERATIONS</span>
          <h2>{data.institution.name}</h2>
          <p>Organize teaching, allocate classrooms, and manage access.</p>
        </div>
        <span className="pill blue">Administrator</span>
      </div>
      {error && (
        <div className="notice" role="alert">
          {error}
          <button
            className="btn secondary small"
            onClick={() => {
              setError('');
              void load();
            }}
          >
            Refresh records
          </button>
        </div>
      )}
      {message && <output className="notice">{message}</output>}
      {!directory ? (
        <output>Loading institution records…</output>
      ) : (
        <Tabs defaultValue="people">
          <TabsList className="institution-tabs">
            <TabsTrigger value="people">
              <Users size={16} /> People
            </TabsTrigger>
            <TabsTrigger value="structure">
              <Building2 size={16} /> Departments & terms
            </TabsTrigger>
            <TabsTrigger value="allocation">
              <BookOpen size={16} /> Classroom allocation
            </TabsTrigger>
          </TabsList>
          <TabsContent value="people">
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Institution directory</h2>
                  <p>{directory.peopleTotal} matching accounts</p>
                </div>
                <button className="btn primary" onClick={invite}>
                  <Plus size={16} /> Invite lecturer
                </button>
              </div>
              <form
                className="directory-search"
                onSubmit={(e) => {
                  e.preventDefault();
                  setQuery(search);
                  setPage(1);
                }}
              >
                <Field label="Find a person">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Name or email address"
                    maxLength={100}
                  />
                </Field>
                <button className="btn secondary">
                  <Search size={16} /> Search
                </button>
              </form>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Person</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {directory.people.map((person) => (
                    <TableRow key={person.id}>
                      <TableCell>
                        <strong>{person.name}</strong>
                        <div className="directory-detail">{person.email}</div>
                      </TableCell>
                      <TableCell>
                        {person.role === 'admin'
                          ? 'Administrator'
                          : person.role === 'teacher'
                            ? 'Lecturer'
                            : 'Student'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`pill ${person.suspended ? 'amber' : person.activated ? 'green' : 'neutral'}`}
                        >
                          {person.suspended
                            ? 'Suspended'
                            : person.activated
                              ? 'Active'
                              : 'Invitation pending'}
                        </span>
                        {!!person.suspended && (
                          <div className="directory-detail">
                            {person.reason}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="directory-actions">
                          {person.role !== 'admin' && (
                            <button
                              className="btn secondary small"
                              disabled={busy}
                              onClick={() =>
                                setEditor({ mode: 'access', record: person })
                              }
                            >
                              {person.suspended ? 'Restore access' : 'Suspend'}
                            </button>
                          )}
                          {!person.activated && !person.suspended && (
                            <button
                              className="btn secondary small"
                              disabled={busy}
                              onClick={() =>
                                setEditor({
                                  mode: 'invitation',
                                  record: person,
                                })
                              }
                            >
                              Replace invitation
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!directory.people.length && (
                <Empty title="No matching accounts">
                  Try another name or email address.
                </Empty>
              )}
              <div className="directory-pagination">
                <button
                  className="btn secondary small"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {page} of{' '}
                  {Math.max(1, Math.ceil(directory.peopleTotal / 50))}
                </span>
                <button
                  className="btn secondary small"
                  disabled={page * 50 >= directory.peopleTotal}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            </section>
          </TabsContent>
          <TabsContent value="structure">
            <div className="institution-columns">
              <section className="panel">
                <div className="panel-heading">
                  <h2>Departments</h2>
                  <button
                    className="btn secondary small"
                    onClick={() => setEditor({ mode: 'departments' })}
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>
                {directory.departments.map((d) => (
                  <div className="institution-record" key={d.id}>
                    <Building2 size={20} />
                    <div>
                      <strong>{d.name}</strong>
                      <p>{d.code}</p>
                    </div>
                  </div>
                ))}
                {!directory.departments.length && (
                  <Empty title="Set up your departments">
                    Create a department, then assign its classrooms in Classroom
                    allocation.
                  </Empty>
                )}
              </section>
              <section className="panel">
                <div className="panel-heading">
                  <h2>Academic terms</h2>
                  <button
                    className="btn secondary small"
                    onClick={() => setEditor({ mode: 'terms' })}
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>
                {directory.terms.map((t) => (
                  <div className="institution-record" key={t.id}>
                    <CalendarDays size={20} />
                    <div>
                      <strong>{t.name}</strong>
                      <p>
                        {date(t.starts_on)} – {date(t.ends_on)}
                      </p>
                    </div>
                  </div>
                ))}
                {!directory.terms.length && (
                  <Empty title="Define the academic calendar">
                    Add semester or term dates for your teaching periods.
                  </Empty>
                )}
              </section>
            </div>
          </TabsContent>
          <TabsContent value="allocation">
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Classroom allocation</h2>
                  <p>
                    Assign a responsible lecturer, department, and academic
                    term.
                  </p>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Classroom</TableHead>
                    <TableHead>Lecturer</TableHead>
                    <TableHead>Department / term</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.courses.map((c) => {
                    const allocation = directory.allocations.find(
                      (a) => a.course_id === c.id,
                    );
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <strong>{c.title}</strong>
                          <div className="directory-detail">{c.code}</div>
                        </TableCell>
                        <TableCell>{c.teacher_name}</TableCell>
                        <TableCell>
                          {directory.departments.find(
                            (d) => d.id === allocation?.department_id,
                          )?.name || 'Unassigned'}
                          <div className="directory-detail">
                            {directory.terms.find(
                              (t) => t.id === allocation?.term_id,
                            )?.name || 'No term assigned'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <button
                            className="btn secondary small"
                            onClick={() =>
                              setEditor({
                                mode: 'allocation',
                                record: { ...c, ...allocation },
                              })
                            }
                          >
                            Manage
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {!data.courses.length && (
                <Empty title="Create your first classroom">
                  Classrooms will appear here for allocation.
                </Empty>
              )}
            </section>
          </TabsContent>
        </Tabs>
      )}
      {editor && directory && (
        <InstitutionEditor
          editor={editor}
          directory={directory}
          busy={busy}
          error={error}
          close={() => !busy && setEditor(null)}
          save={save}
        />
      )}
      {invitation && (
        <Modal
          title="Replacement invitation"
          description="The previous invitation no longer works. Share this new link directly with the intended person. It expires in 48 hours."
          onClose={() => setInvitation('')}
        >
          <Field label="Private activation link">
            <input
              readOnly
              value={invitation}
              onFocus={(e) => e.target.select()}
            />
          </Field>
          <button className="btn primary" onClick={() => setInvitation('')}>
            Done
          </button>
        </Modal>
      )}
    </div>
  );
}
function InstitutionEditor({
  editor,
  directory,
  busy,
  error,
  close,
  save,
}: {
  editor: { mode: string; record?: Row };
  directory: Directory;
  busy: boolean;
  error: string;
  close: () => void;
  save: (path: string, values: unknown) => Promise<void>;
}) {
  const { mode, record } = editor;
  const [teacher, setTeacher] = useState(record?.teacher_id || ''),
    [department, setDepartment] = useState(record?.department_id || 'none'),
    [term, setTerm] = useState(record?.term_id || 'none');
  const titles: Record<string, string> = {
    departments: 'Add department',
    terms: 'Add academic term',
    access: record?.suspended
      ? 'Restore account access'
      : 'Suspend account access',
    invitation: 'Replace invitation',
    allocation: 'Allocate classroom',
  };
  const descriptions: Record<string, string> = {
    access: `${record?.name}: ${record?.suspended ? 'Allow this person to sign in again.' : 'Immediately block new requests across this institution and revoke existing sessions.'} Teaching records and submissions are retained.`,
    invitation: `Replace the unused invitation for ${record?.email}. The old link will stop working.`,
    allocation:
      'Transferring a classroom gives its new lecturer control of materials, enrollments, assessments, and grades. The former lecturer loses access unless they are an administrator.',
    departments: 'Use the official department name and a unique short code.',
    terms:
      'Dates organize classroom records; they do not automatically open or close assessments.',
  };
  return (
    <Modal
      title={titles[mode]}
      description={descriptions[mode]}
      alert={mode === 'access' || mode === 'invitation'}
      onClose={close}
    >
      <form
        className="editor-form"
        onSubmit={(e) => {
          e.preventDefault();
          const values = Object.fromEntries(new FormData(e.currentTarget));
          void save(mode, {
            ...values,
            ...(mode === 'access'
              ? { userId: record!.id, suspended: !record!.suspended }
              : {}),
            ...(mode === 'invitation' ? { userId: record!.id } : {}),
            ...(mode === 'allocation'
              ? {
                  courseId: record!.id,
                  teacherId: teacher,
                  departmentId: department === 'none' ? null : department,
                  termId: term === 'none' ? null : term,
                  revision: record!.revision || 0,
                }
              : {}),
          });
        }}
      >
        {error && (
          <p role="alert" className="notice">
            {error}
          </p>
        )}
        {(mode === 'departments' || mode === 'terms') && (
          <Field label="Name">
            <input
              name="name"
              required
              maxLength={120}
              placeholder={
                mode === 'departments'
                  ? 'Department of Computer Science'
                  : '2026/2027 · Semester 1'
              }
            />
          </Field>
        )}
        {mode === 'departments' && (
          <Field label="Department code">
            <input
              name="code"
              required
              maxLength={20}
              pattern="[A-Za-z0-9_\-]+"
              placeholder="CS"
            />
          </Field>
        )}
        {mode === 'terms' && (
          <>
            <Field label="Starts on">
              <input type="date" name="startsOn" required />
            </Field>
            <Field label="Ends on">
              <input type="date" name="endsOn" required />
            </Field>
          </>
        )}
        {mode === 'access' && (
          <Field label="Reason for this access change">
            <textarea name="reason" required maxLength={500} />
          </Field>
        )}
        {mode === 'allocation' && (
          <>
            <div className="field">
              <span>Responsible lecturer</span>
              <Choice
                label="Responsible lecturer"
                value={teacher}
                onChange={setTeacher}
                items={directory.lecturers.map((l) => ({
                  value: l.id,
                  label: l.name,
                }))}
              />
            </div>
            <div className="field">
              <span>Department</span>
              <Choice
                label="Department"
                value={department}
                onChange={setDepartment}
                items={[
                  { value: 'none', label: 'Unassigned' },
                  ...directory.departments.map((d) => ({
                    value: d.id,
                    label: d.name,
                  })),
                ]}
              />
            </div>
            <div className="field">
              <span>Academic term</span>
              <Choice
                label="Academic term"
                value={term}
                onChange={setTerm}
                items={[
                  { value: 'none', label: 'Unassigned' },
                  ...directory.terms.map((t) => ({
                    value: t.id,
                    label: t.name,
                  })),
                ]}
              />
            </div>
          </>
        )}
        <div className="directory-actions">
          <button
            className="btn secondary"
            type="button"
            disabled={busy}
            onClick={close}
          >
            Cancel
          </button>
          <button className="btn primary" disabled={busy}>
            {busy
              ? 'Saving…'
              : mode === 'invitation'
                ? 'Create replacement link'
                : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
