import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
const base = process.env.TAS_TEST_URL || 'http://localhost:3000';
const origin = new URL(base).origin;
if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname))
  throw new Error('Integration tests must run against a local pilot.');
let checks = 0;
function check(name, fn) {
  fn();
  checks++;
  console.log(`PASS ${name}`);
}
function client() {
  let cookie = '';
  return {
    async request(path, data, extra = {}) {
      const response = await fetch(`${base}/api/tas/${path}`, {
        method: data === undefined ? 'GET' : 'POST',
        headers: {
          ...(cookie ? { Cookie: cookie } : {}),
          ...(data !== undefined
            ? { 'Content-Type': 'application/json', Origin: origin }
            : {}),
          ...extra,
        },
        body: data === undefined ? undefined : JSON.stringify(data),
      });
      const set = response.headers.get('set-cookie');
      if (set) cookie = set.split(';')[0];
      const text = await response.text();
      let content;
      try {
        content = JSON.parse(text);
      } catch {
        content = { error: text };
      }
      return { status: response.status, data: content };
    },
    async login(email) {
      const result = await this.request('login', {
        email,
        password: 'TAS-local-pilot-2026!',
      });
      assert.equal(result.status, 200, JSON.stringify(result));
    },
    get cookie() {
      return cookie;
    },
  };
}
async function ok(c, path, data) {
  const result = await c.request(path, data);
  assert.equal(result.status, 200, `${path}: ${JSON.stringify(result)}`);
  return result.data;
}
function sql(command) {
  const directory = resolve('.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
  const files = readdirSync(directory).filter((name) =>
    /^[a-f0-9]+\.sqlite$/.test(name),
  );
  assert.equal(files.length, 1, 'Expected exactly one local pilot database.');
  const database = new DatabaseSync(resolve(directory, files[0]));
  try {
    database.exec('PRAGMA busy_timeout=5000;');
    database.exec(command);
  } finally {
    database.close();
  }
}
const admin = client(),
  student = client(),
  other = client(),
  lecturer = client(),
  anonymous = client();
const runId = Date.now().toString(36);
sql(
  "UPDATE users SET institution_id='pilot' WHERE id='teacher2' AND email='yaw@tas.local';",
);
await admin.login('lecturer@tas.local');
await student.login('student@tas.local');
await other.login('abena@tas.local');
await lecturer.login('yaw@tas.local');
check('anonymous API denied', () => {});
assert.equal((await anonymous.request('snapshot')).status, 401);
check('cross-origin mutation rejected', () => {});
assert.equal(
  (
    await admin.request(
      'courses',
      { title: 'Rejected' },
      { Origin: 'https://untrusted.example' },
    )
  ).status,
  403,
);
const course = await ok(admin, 'courses', {
  title: `Verification ${runId}`,
  code: `QA-${runId}`,
  description: 'Integration verification fixture',
  color: 'teal',
});
const paidCourse = await ok(admin, 'courses', {
  title: `Paid course ${runId}`,
  code: `PAY-${runId}`,
  description: 'Course payment verification fixture',
  color: 'purple',
  priceGhs: 199,
});
await ok(admin, `courses/${paidCourse.id}/publish`, { published: true });
assert.equal(
  (await student.request(`courses/${paidCourse.id}/checkout`, {})).status,
  503,
);
check('paid course checkout stays closed until the server payment provider is configured', () => {});
check('students cannot create classes', () => {});
assert.equal(
  (
    await student.request('courses', {
      title: 'Forbidden',
      code: 'X',
      description: 'X',
    })
  ).status,
  403,
);
check('another lecturer cannot administer the classroom', () => {});
assert.equal(
  (await lecturer.request(`courses/${course.id}/publish`, { published: true }))
    .status,
  403,
);
const m1 = await ok(admin, `courses/${course.id}/modules`, {
  title: 'First module',
});
const m2 = await ok(admin, `courses/${course.id}/modules`, {
  title: 'Locked next module',
});
const lesson = await ok(admin, `modules/${m1.id}/lessons`, {
  title: 'Read this first',
  kind: 'note',
  content: 'Understand the first concept.',
});
const hidden = await ok(admin, `modules/${m2.id}/lessons`, {
  title: 'Protected lesson',
  kind: 'note',
  content: `protected-content-${runId}`,
});
const fixtureFile = new FormData();
fixtureFile.set(
  'file',
  new File(['Private course notes.'], 'notes.txt', { type: 'text/plain' }),
);
const uploaded = await fetch(`${base}/api/tas/lessons/${hidden.id}/file`, {
  method: 'POST',
  headers: { Origin: origin, Cookie: admin.cookie },
  body: fixtureFile,
});
assert.equal(uploaded.status, 200);
check('lecturer can upload private course materials', () => {});
const rejectedFile = new FormData();
rejectedFile.set(
  'file',
  new File(['not a PDF'], 'forged.pdf', { type: 'application/pdf' }),
);
assert.equal(
  (
    await fetch(`${base}/api/tas/lessons/${hidden.id}/file`, {
      method: 'POST',
      headers: { Origin: origin, Cookie: admin.cookie },
      body: rejectedFile,
    })
  ).status,
  400,
);
check('file signature mismatch is rejected', () => {});
const a = await ok(admin, `modules/${m1.id}/assessments`, {
  title: 'Security checkpoint',
  kind: 'quiz',
  instructions: 'Select the correct answer.',
  durationMinutes: 1,
  passMark: 70,
  maxAttempts: 2,
  questions: [
    {
      prompt: 'Which number is even?',
      options: ['2', '3', '5', '7'],
      correct: 0,
    },
    {
      prompt: 'Which number is larger?',
      options: ['100', '10', '1', '0'],
      correct: 0,
    },
  ],
});
await ok(admin, `courses/${course.id}/publish`, { published: true });
await ok(admin, `modules/${m1.id}/publish`, { published: true });
await ok(admin, `modules/${m2.id}/publish`, { published: true });
await ok(admin, `assessments/${a.id}/publish`, { published: true });
assert.equal(
  (await student.request(`assessments/${a.id}/start`, {})).status,
  403,
);
check('unenrolled student cannot start a published quiz', () => {});
await ok(admin, `courses/${course.id}/enroll`, {
  name: 'Kofi Asante',
  email: 'student@tas.local',
});
let snap = await ok(student, 'snapshot');
check('locked lesson content is not in the student response', () => {
  assert.equal(
    snap.lessons.some((l) => l.id === hidden.id),
    false,
  );
  assert.equal(snap.modules.find((m) => m.id === m2.id).locked, true);
  assert.equal(
    JSON.stringify(snap).includes(`protected-content-${runId}`),
    false,
  );
});
assert.equal(
  (await student.request(`lessons/${hidden.id}/complete`, {})).status,
  403,
);
assert.equal((await student.request(`lessons/${hidden.id}/file`)).status, 403);
check('locked completion and download URLs reject direct access', () => {});
assert.equal(
  (await student.request(`assessments/${a.id}/start`, {})).status,
  403,
);
check('quiz requires current module lesson completion', () => {});
await ok(student, `lessons/${lesson.id}/complete`, {});
const concurrent = await Promise.all([
  student.request(`assessments/${a.id}/start`, {}),
  student.request(`assessments/${a.id}/start`, {}),
]);
assert.ok(
  concurrent.every((r) => [200, 409].includes(r.status)),
  JSON.stringify(concurrent),
);
const started = concurrent.find((r) => r.status === 200).data;
check('concurrent starts do not allocate extra attempts', () => {
  assert.equal(started.attempt.number, 1);
});
const catalog = await anonymous.request('catalog');
assert.equal(catalog.status, 200);
assert.ok(Array.isArray(catalog.data.courses));
await ok(student, `attempts/${started.attempt.id}/integrity`, {
  event: 'focus_lost',
});
assert.equal(
  (
    await student.request(`attempts/${started.attempt.id}/integrity`, {
      event: 'screen_capture',
    })
  ).status,
  400,
);
assert.equal(
  (
    await other.request(`attempts/${started.attempt.id}/integrity`, {
      event: 'focus_lost',
    })
  ).status,
  404,
);
const integrity = await ok(admin, `attempts/${started.attempt.id}/integrity`);
assert.equal(integrity.events[0].event_type, 'focus_lost');
assert.equal(integrity.risk.level, 'clear');
check('catalog is public while assessment integrity evidence stays learner-private and staff-reviewable', () => {});
const resumed = await ok(student, `assessments/${a.id}/start`, {});
assert.equal(resumed.attempt.id, started.attempt.id);
check('resume keeps the original attempt and deadline', () => {
  assert.equal(resumed.attempt.deadline, started.attempt.deadline);
  assert.ok(started.attempt.questions.every((q) => !('correct' in q)));
});
assert.equal(
  (await other.request(`attempts/${started.attempt.id}`)).status,
  404,
);
check('another student cannot read the attempt', () => {});
assert.equal(
  (
    await student.request(`attempts/${started.attempt.id}/save`, {
      answers: { forged: 1 },
    })
  ).status,
  400,
);
check('unknown question IDs rejected', () => {});
await ok(student, `attempts/${started.attempt.id}/save`, { answers: {} });
const fail = await ok(student, `attempts/${started.attempt.id}/submit`, {
  answers: {},
  score: 100,
  passed: 1,
});
check('forged scores are ignored and numeric grades remain private', () => {
  assert.equal(fail.attempt.passed, 0);
  assert.equal(fail.attempt.score, null);
});
const staffFail = await ok(admin, `attempts/${started.attempt.id}`);
assert.equal(staffFail.attempt.score, 0);
const retry = await ok(student, `assessments/${a.id}/start`, {});
const answers = Object.fromEntries(
  retry.attempt.questions.map((q) => [
    q.id,
    q.options.indexOf(q.prompt.includes('even') ? '2' : '100'),
  ]),
);
await ok(student, `attempts/${retry.attempt.id}/save`, { answers });
const passed = await ok(student, `attempts/${retry.attempt.id}/submit`, {
  answers,
});
assert.equal(passed.attempt.passed, 1);
assert.equal(passed.attempt.score, null);
check('server grading passes the correct responses', () => {});
snap = await ok(student, 'snapshot');
check('passing unlocks the next module', () => {
  assert.equal(snap.modules.find((m) => m.id === m2.id).locked, false);
  assert.ok(snap.lessons.some((l) => l.id === hidden.id));
});
const permittedFile = await fetch(`${base}/api/tas/lessons/${hidden.id}/file`, {
  headers: { Cookie: student.cookie },
});
assert.equal(permittedFile.status, 200);
assert.equal(await permittedFile.text(), 'Private course notes.');
assert.equal(
  (
    await fetch(`${base}/api/tas/lessons/${hidden.id}/file`, {
      headers: { Cookie: other.cookie },
    })
  ).status,
  403,
);
check('authorized file access works while another student is denied', () => {});
assert.equal(
  (await student.request(`assessments/${a.id}/start`, {})).status,
  409,
);
check('attempt limit is enforced', () => {});
const unchanged = await ok(student, `attempts/${retry.attempt.id}/submit`, {
  answers: {},
});
assert.equal(unchanged.attempt.passed, 1);
check('submitted attempt cannot be overwritten', () => {});
await ok(admin, `attempts/${retry.attempt.id}/release`, {
  released: true,
  revision: (await ok(admin, `attempts/${retry.attempt.id}`)).attempt.revision,
});
const released = await ok(student, `attempts/${retry.attempt.id}`);
assert.equal(released.attempt.score, 100);
check('lecturer release makes the score visible', () => {});
const assignment = await ok(admin, `modules/${m2.id}/assessments`, {
  title: 'Writing project',
  kind: 'assignment',
  instructions: 'Submit your work.',
  passMark: 60,
  maxAttempts: 2,
  durationMinutes: 30,
});
await ok(admin, `assessments/${assignment.id}/publish`, { published: true });
await ok(student, `lessons/${hidden.id}/complete`, {});
const work = await ok(student, `assessments/${assignment.id}/submit-work`, {
  text: 'A thoughtful project response.',
});
await ok(admin, `attempts/${work.id}/grade`, {
  score: 85,
  feedback: 'Well reasoned.',
  revision: 0,
});
const before = await ok(student, `attempts/${work.id}`);
assert.equal(before.attempt.score, null);
assert.equal(before.attempt.feedback, '');
await ok(admin, `attempts/${work.id}/release`, {
  released: true,
  revision: (await ok(admin, `attempts/${work.id}`)).attempt.revision,
});
const after = await ok(student, `attempts/${work.id}`);
assert.equal(after.attempt.score, 85);
assert.equal(after.attempt.feedback, 'Well reasoned.');
check('assignment grading and feedback follow explicit release', () => {});
await ok(admin, `attempts/${work.id}/grade`, {
  score: 80,
  feedback: 'Revised after review.',
  reason: 'Corrected after moderation.',
  revision: (await ok(admin, `attempts/${work.id}`)).attempt.revision,
});
assert.equal((await ok(student, `attempts/${work.id}`)).attempt.score, null);
check('regrading withdraws the result pending release', () => {});
const invite = await ok(admin, `courses/${course.id}/enroll`, {
  name: 'Invited student',
  email: `invite-${runId}@tas.local`,
});
const activation = new URL(invite.activationPath, origin).searchParams.get(
  'invite',
);
const fresh = client();
await ok(fresh, 'activate', {
  token: activation,
  password: 'Unique-activation-2026!',
});
assert.equal(
  (
    await fresh.request('activate', {
      token: activation,
      password: 'Changed-activation-2026!',
    })
  ).status,
  400,
);
check('invitation token is single-use', () => {});
const studentSnapshot = await ok(student, 'snapshot');
assert.equal(
  studentSnapshot.courses.filter((c) => c.id === course.id).length,
  1,
);
await ok(admin, `courses/${course.id}/revoke`, { userId: 'student' });
assert.equal(
  (await student.request(`attempts/${retry.attempt.id}`)).status,
  403,
);
check('revocation also blocks previously permitted attempt access', () => {});
await ok(admin, `courses/${course.id}/enroll`, {
  name: 'Kofi Asante',
  email: 'student@tas.local',
});
const timed = await ok(admin, `modules/${m2.id}/assessments`, {
  title: 'Expired attempt check',
  kind: 'quiz',
  instructions: 'Timing verification.',
  durationMinutes: 1,
  passMark: 50,
  maxAttempts: 1,
  questions: [{ prompt: 'One plus one?', options: ['2', '3'], correct: 0 }],
});
await ok(admin, `assessments/${timed.id}/publish`, { published: true });
const clockAttempt = await ok(student, `assessments/${timed.id}/start`, {});
sql(
  `UPDATE attempts SET deadline=${Date.now() - 1000} WHERE id='${clockAttempt.attempt.id}'; INSERT INTO institutions(id,name,semester) VALUES ('tenant-${runId}','Isolated fixture','Test'); UPDATE users SET institution_id='tenant-${runId}' WHERE id='teacher2';`,
);
const late = await ok(student, `attempts/${clockAttempt.attempt.id}/submit`, {
  answers: {
    [clockAttempt.attempt.questions[0].id]:
      clockAttempt.attempt.questions[0].options.indexOf('2'),
  },
});
assert.equal(late.attempt.passed, 0);
assert.equal(
  (await ok(admin, `attempts/${clockAttempt.attempt.id}`)).attempt.score,
  0,
);
check('answers arriving after the deadline do not earn marks', () => {});
try {
  assert.equal(
    (
      await lecturer.request(`courses/${course.id}/publish`, {
        published: false,
      })
    ).status,
    404,
  );
  check('cross-institution classroom access is denied', () => {});
} finally {
  sql("UPDATE users SET institution_id='pilot' WHERE id='teacher2';");
}
assert.equal((await admin.request('billing', { plan: 'college' })).status, 503);
check('unconfigured billing cannot create a successful payment', () => {});
const beforeImport = (await ok(admin, 'snapshot')).attempts.filter(
  (t) => t.assessment_id === assignment.id,
).length;
assert.equal(
  (
    await admin.request(`assessments/${assignment.id}/import`, {
      rows: [
        { email: 'student@tas.local', score: 90 },
        { email: 'not-enrolled@tas.local', score: 80 },
      ],
    })
  ).status,
  400,
);
assert.equal(
  (await ok(admin, 'snapshot')).attempts.filter(
    (t) => t.assessment_id === assignment.id,
  ).length,
  beforeImport,
);
await ok(admin, `assessments/${assignment.id}/import`, {
  rows: [{ email: 'student@tas.local', score: 90 }],
});
check('grade import validates the whole batch before saving', () => {});
const captioned = await ok(admin, `modules/${m2.id}/lessons`, {
  title: 'Captioned lecture fixture',
  kind: 'video',
  content: 'A text transcript accompanies this lecture.',
});
const captions = new FormData();
captions.set(
  'file',
  new File(
    ['WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nWelcome to class.\n'],
    'captions.vtt',
    { type: 'text/vtt' },
  ),
);
assert.equal(
  (
    await fetch(`${base}/api/tas/lessons/${captioned.id}/captions`, {
      method: 'POST',
      headers: { Origin: origin, Cookie: admin.cookie },
      body: captions,
    })
  ).status,
  200,
);
const captionResponse = await fetch(
  `${base}/api/tas/lessons/${captioned.id}/captions`,
  { headers: { Cookie: student.cookie } },
);
assert.equal(captionResponse.status, 200);
assert.ok((await captionResponse.text()).startsWith('WEBVTT'));
assert.equal(
  (
    await fetch(`${base}/api/tas/lessons/${captioned.id}/captions`, {
      headers: { Cookie: other.cookie },
    })
  ).status,
  403,
);
check(
  'caption tracks use the same enrollment protection as course files',
  () => {},
);
assert.equal((await student.request('institution')).status, 403);
assert.equal((await lecturer.request('institution')).status, 403);
check('institution directory requires an administrator', () => {});
const department = await ok(admin, 'institution/departments', {
  name: `QA department ${runId}`,
  code: `QA-${runId}`,
});
assert.equal(
  (await admin.request('institution/departments', null)).status,
  400,
);
assert.equal(
  (
    await admin.request('institution/departments', {
      name: 'Duplicate',
      code: `qa-${runId}`,
    })
  ).status,
  409,
);
check('department codes are unique within an institution', () => {});
assert.equal(
  (
    await admin.request('institution/terms', {
      name: 'Invalid',
      startsOn: '2026-02-30',
      endsOn: '2026-04-01',
    })
  ).status,
  400,
);
assert.equal(
  (
    await admin.request('institution/terms', {
      name: 'Invalid',
      startsOn: '2026-04-01',
      endsOn: '2026-03-01',
    })
  ).status,
  400,
);
const term = await ok(admin, 'institution/terms', {
  name: `QA term ${runId}`,
  startsOn: '2026-09-01',
  endsOn: '2027-01-31',
});
check('academic terms reject impossible and reversed dates', () => {});
const directory = await ok(admin, 'institution?q=yaw%40tas.local');
assert.equal(directory.people.length, 1);
assert.equal(directory.peopleTotal, 1);
assert.equal(directory.people[0].password_hash, undefined);
assert.equal(directory.people[0].role, 'teacher');
check('searchable directory excludes password data', () => {});
await ok(admin, 'institution/allocation', {
  courseId: course.id,
  teacherId: 'teacher2',
  departmentId: department.id,
  termId: term.id,
  revision: 0,
});
await ok(lecturer, `courses/${course.id}/publish`, { published: true });
assert.equal(
  (await ok(student, 'snapshot')).courses.find((c) => c.id === course.id)
    .term_name,
  `QA term ${runId}`,
);
assert.ok(
  (await ok(lecturer, 'snapshot')).courses.some((c) => c.id === course.id),
);
assert.equal(
  (
    await admin.request('institution/allocation', {
      courseId: course.id,
      teacherId: 'student',
      revision: 1,
    })
  ).status,
  400,
);
assert.equal(
  (
    await admin.request('institution/allocation', {
      courseId: course.id,
      teacherId: 'lecturer',
      departmentId: department.id,
      termId: term.id,
      revision: 0,
    })
  ).status,
  409,
);
assert.equal(
  (await ok(admin, 'snapshot')).courses.find((c) => c.id === course.id)
    .teacher_id,
  'teacher2',
);
check(
  'allocation transfers ownership and rejects stale or student assignments',
  () => {},
);
const allocations = await Promise.all([
  admin.request('institution/allocation', {
    courseId: course.id,
    teacherId: 'lecturer',
    revision: 1,
  }),
  admin.request('institution/allocation', {
    courseId: course.id,
    teacherId: 'teacher2',
    revision: 1,
  }),
]);
assert.deepEqual(
  allocations.map((r) => r.status).sort((a, b) => a - b),
  [200, 409],
);
assert.equal(
  (await ok(admin, 'snapshot')).courses.find((c) => c.id === course.id)
    .teacher_id,
  allocations[0].status === 200 ? 'lecturer' : 'teacher2',
);
await ok(admin, 'institution/allocation', {
  courseId: course.id,
  teacherId: 'lecturer',
  revision: 2,
});
assert.equal(
  (await lecturer.request(`courses/${course.id}/publish`, { published: true }))
    .status,
  403,
);
check(
  'concurrent classroom allocation has one winner and revokes previous ownership',
  () => {},
);
sql(
  `INSERT INTO departments VALUES ('foreign-${runId}','tenant-${runId}','Foreign department','FD'); UPDATE users SET institution_id='tenant-${runId}',role='admin' WHERE id='teacher2';`,
);
try {
  assert.equal(
    (
      await admin.request('institution/allocation', {
        courseId: course.id,
        teacherId: 'lecturer',
        departmentId: `foreign-${runId}`,
        revision: 3,
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await lecturer.request('institution/access', {
        userId: 'student',
        suspended: true,
        reason: 'Forbidden',
      })
    ).status,
    404,
  );
  assert.equal(
    (await lecturer.request(`attempts/${work.id}/history`)).status,
    404,
  );
  assert.equal(
    (await ok(lecturer, 'institution')).people.some((p) => p.id === 'student'),
    false,
  );
  check(
    'administration and grade history remain isolated between institutions',
    () => {},
  );
} finally {
  sql(
    "UPDATE users SET institution_id='pilot',role='teacher' WHERE id='teacher2';",
  );
}
assert.equal(
  (
    await admin.request('institution/access', {
      userId: 'lecturer',
      suspended: true,
      reason: 'Self lockout',
    })
  ).status,
  403,
);
assert.equal(
  (
    await lecturer.request('institution/access', {
      userId: 'student',
      suspended: true,
      reason: 'No authority',
    })
  ).status,
  403,
);
check(
  'administrator lockout and lecturer access escalation are denied',
  () => {},
);
await ok(admin, 'institution/access', {
  userId: 'teacher2',
  suspended: true,
  reason: 'QA security investigation',
});
assert.equal((await lecturer.request('snapshot')).status, 401);
assert.equal(
  (
    await lecturer.request('login', {
      email: 'yaw@tas.local',
      password: 'TAS-local-pilot-2026!',
    })
  ).status,
  401,
);
await ok(admin, 'institution/access', {
  userId: 'teacher2',
  suspended: false,
  reason: 'QA review complete',
});
await lecturer.login('yaw@tas.local');
check(
  'suspension revokes sessions and blocks login until restoration',
  () => {},
);
const second = client();
await second.login('student@tas.local');
const ownSessions = await ok(student, 'security');
assert.ok(ownSessions.sessions.some((s) => s.current));
assert.ok(ownSessions.sessions.every((s) => !('token_hash' in s)));
const foreignSession = (await ok(admin, 'security')).sessions.find((s) => s.id);
assert.equal(
  (await student.request('security/revoke', { id: foreignSession.id })).status,
  404,
);
const secondId = (await ok(second, 'security')).sessions.find(
  (s) => s.current,
).id;
await ok(student, 'security/revoke', { id: secondId });
assert.equal((await second.request('snapshot')).status, 401);
await second.login('student@tas.local');
await ok(student, 'security/revoke-others', {});
assert.equal((await second.request('snapshot')).status, 401);
assert.equal((await student.request('snapshot')).status, 200);
check(
  'users can revoke their own sessions without exposing tokens or revoking others',
  () => {},
);
const invitePerson = await ok(admin, `courses/${course.id}/enroll`, {
  name: 'Invited student',
  email: `invite-replace-${runId}@tas.local`,
});
const pendingPerson = (
  await ok(
    admin,
    `institution?q=${encodeURIComponent(`invite-replace-${runId}@tas.local`)}`,
  )
).people[0];
const replacement = await ok(admin, 'institution/invitation', {
  userId: pendingPerson.id,
});
const inviteToken = (path) => new URL(path, origin).searchParams.get('invite');
assert.equal(
  (
    await fresh.request('activate', {
      token: inviteToken(invitePerson.activationPath),
      password: 'Replacement-valid-2026!',
    })
  ).status,
  400,
);
await ok(admin, 'institution/access', {
  userId: pendingPerson.id,
  suspended: true,
  reason: 'Withdraw admission',
});
assert.equal(
  (
    await fresh.request('activate', {
      token: inviteToken(replacement.activationPath),
      password: 'Replacement-valid-2026!',
    })
  ).status,
  400,
);
await ok(admin, 'institution/access', {
  userId: pendingPerson.id,
  suspended: false,
  reason: 'Admission restored',
});
const restored = await ok(admin, 'institution/invitation', {
  userId: pendingPerson.id,
});
await ok(fresh, 'activate', {
  token: inviteToken(restored.activationPath),
  password: 'Replacement-valid-2026!',
});
assert.equal(
  (await admin.request('institution/invitation', { userId: pendingPerson.id }))
    .status,
  409,
);
check(
  'replacing and revoking invitations invalidates old links and preserves single-use activation',
  () => {},
);
assert.equal(
  (await student.request(`attempts/${work.id}/history`)).status,
  403,
);
const gradeBefore = (await ok(admin, `attempts/${work.id}`)).attempt;
assert.equal(
  (
    await admin.request(`attempts/${work.id}/grade`, {
      score: 75,
      feedback: 'Changed',
      revision: gradeBefore.revision,
    })
  ).status,
  400,
);
const outcomes = await Promise.all([
  admin.request(`attempts/${work.id}/grade`, {
    score: 77,
    feedback: 'Review A',
    reason: 'Moderation A',
    revision: gradeBefore.revision,
  }),
  admin.request(`attempts/${work.id}/grade`, {
    score: 78,
    feedback: 'Review B',
    reason: 'Moderation B',
    revision: gradeBefore.revision,
  }),
]);
assert.deepEqual(
  outcomes.map((r) => r.status).sort((a, b) => a - b),
  [200, 409],
);
assert.equal(
  (
    await admin.request(`attempts/${work.id}/release`, {
      released: true,
      revision: gradeBefore.revision,
    })
  ).status,
  409,
);
check(
  'regrading requires a reason and stale concurrent grade/release writes are rejected',
  () => {},
);
const ledger = (await ok(admin, `attempts/${work.id}/history`)).history;
assert.equal(ledger[0].old_score, 80);
assert.equal(ledger[0].new_score, outcomes[0].status === 200 ? 77 : 78);
assert.equal(ledger[0].actor_id, 'lecturer');
assert.equal(ledger[0].revision, gradeBefore.revision + 1);
assert.equal(ledger.filter((h) => h.reason.startsWith('Moderation')).length, 1);
assert.ok(ledger.some((h) => h.new_released === 1));
assert.ok(
  (await ok(admin, `attempts/${retry.attempt.id}/history`)).history.some(
    (h) => h.new_score === 100,
  ),
);
const imported = (await ok(admin, 'snapshot')).attempts.find(
  (a) => a.assessment_id === assignment.id && a.feedback === 'Imported grade',
);
assert.equal(
  (await ok(admin, `attempts/${imported.id}/history`)).history[0].actor_id,
  'lecturer',
);
check(
  'grade ledger preserves before/after values, actor, release events and automatic/imported scores',
  () => {},
);
console.log(`\n${checks} integration checks passed.`);
