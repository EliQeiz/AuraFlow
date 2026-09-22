import { env } from 'cloudflare:workers';
import {
  digest,
  token,
  hashPassword,
  verifyPassword,
  passwordValid,
  safeEqual,
} from './auth';
import {
  grade,
  publicQuestions,
  shuffleQuestions,
  validateQuestions,
  type Question,
} from './assessment';
import {
  validWebhookSignature,
  paymentMatches,
  coursePaymentMatches,
} from './payment';
import {
  integrityRisk,
  isIntegrityEventType,
  type IntegrityEventType,
} from './integrity';

// D1 rows are validated by each domain operation before use.
// eslint-disable-next-line typescript/no-explicit-any
type Row = Record<string, any>;
type User = {
  id: string;
  institution_id: string;
  name: string;
  email: string;
  role: string;
};
const runtime = env as unknown as {
  DB: D1Database;
  FILES: R2Bucket;
  AFC_SETUP_TOKEN?: string;
  TAS_SETUP_TOKEN?: string;
  PAYSTACK_SECRET_KEY?: string;
  TAS_COLLEGE_AMOUNT_GHS?: string;
  TAS_TEACHER_AMOUNT_GHS?: string;
};
const db = () => runtime.DB;
const stmt = (sql: string, ...values: unknown[]) =>
  db()
    .prepare(sql)
    .bind(...values);
const one = (sql: string, ...values: unknown[]) =>
  stmt(sql, ...values).first<Row>();
const all = async (sql: string, ...values: unknown[]) =>
  (await stmt(sql, ...values).all<Row>()).results;
const run = (sql: string, ...values: unknown[]) => stmt(sql, ...values).run();
const now = () => Date.now();
const id = () => crypto.randomUUID();
const setupToken = () => runtime.AFC_SETUP_TOKEN || runtime.TAS_SETUP_TOKEN;
class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
function requireValue(
  test: unknown,
  message: string,
  status = 400,
): asserts test {
  if (!test) throw new HttpError(status, message);
}
const str = (value: unknown, max = 300) => {
  requireValue(
    typeof value === 'string' && value.trim().length > 0 && value.length <= max,
    `Enter a value between 1 and ${max} characters.`,
  );
  return value.trim();
};
const integer = (value: unknown, min: number, max: number) => {
  const n = Number(value);
  requireValue(
    Number.isInteger(n) && n >= min && n <= max,
    `Enter a whole number from ${min} to ${max}.`,
  );
  return n;
};
function email(value: unknown) {
  const result = str(value, 254).toLowerCase();
  requireValue(
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result),
    'Enter a valid email address.',
  );
  return result;
}
function courseLevel(value: unknown) {
  return ['beginner', 'intermediate', 'advanced'].includes(String(value))
    ? String(value)
    : 'beginner';
}
function integrityMode(value: unknown) {
  return ['standard', 'focused', 'review'].includes(String(value))
    ? String(value)
    : 'standard';
}
function staff(user: User) {
  requireValue(
    user.role === 'teacher' || user.role === 'admin',
    'Lecturer access required.',
    403,
  );
}
function administrator(user: User) {
  requireValue(
    user.role === 'admin',
    'Institution administrator access required.',
    403,
  );
}
async function audit(user: User, action: string, detail: string) {
  await run(
    'INSERT INTO audit VALUES (?,?,?,?,?,?)',
    id(),
    user.institution_id,
    user.id,
    action,
    detail.slice(0, 1000),
    now(),
  );
}
function json(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      ...headers,
    },
  });
}
function cookie(value: string, req: Request, age = 28800) {
  return `afc_session=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${new URL(req.url).protocol === 'https:' ? '; Secure' : ''}`;
}
async function session(req: Request) {
  const raw = req.headers
    .get('cookie')
    ?.match(/(?:^|;\s*)afc_session=([a-f0-9]{64})(?:;|$)/)?.[1];
  requireValue(raw, 'Please sign in to continue.', 401);
  const user = await one(
    'SELECT u.id,u.institution_id,u.name,u.email,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND NOT EXISTS(SELECT 1 FROM account_controls ac WHERE ac.user_id=u.id AND ac.suspended=1)',
    await digest(raw),
    now(),
  );
  requireValue(user, 'Your session has expired. Please sign in again.', 401);
  return user as User;
}
async function newSession(user: Row, req: Request) {
  const raw = token();
  const hash = await digest(raw);
  const results = await db().batch([
    stmt(
      'DELETE FROM sessions WHERE user_id=? AND expires_at<=?',
      user.id,
      now(),
    ),
    stmt(
      'INSERT INTO sessions SELECT ?,?,? WHERE NOT EXISTS(SELECT 1 FROM account_controls WHERE user_id=? AND suspended=1)',
      hash,
      user.id,
      now() + 28800000,
      user.id,
    ),
    stmt(
      'INSERT INTO session_details SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM sessions WHERE token_hash=?)',
      id(),
      hash,
      now(),
      (req.headers.get('user-agent') || 'Unknown device').slice(0, 300),
      hash,
    ),
  ]);
  requireValue(
    results[1].meta.changes === 1,
    'Unable to sign in. Contact your administrator.',
    401,
  );
  return json({ ok: true }, 200, { 'Set-Cookie': cookie(raw, req) });
}
async function rate(key: string, limit = 15) {
  const time = now();
  const result = await one(
    'INSERT INTO rate_limits VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN reset_at<? THEN 1 ELSE count+1 END,reset_at=CASE WHEN reset_at<? THEN ? ELSE reset_at END RETURNING count',
    key,
    time + 900000,
    time,
    time,
    time + 900000,
  );
  requireValue(
    result && result.count <= limit,
    'Too many attempts. Please try again in 15 minutes.',
    429,
  );
}
async function courseAccess(user: User, courseId: string, write = false) {
  const course = await one(
    'SELECT * FROM courses WHERE id=? AND institution_id=?',
    courseId,
    user.institution_id,
  );
  requireValue(course, 'Classroom not found.', 404);
  if (user.role === 'student') {
    requireValue(
      !write && course.published,
      'This classroom is unavailable.',
      403,
    );
    requireValue(
      await one(
        'SELECT id FROM enrollments WHERE course_id=? AND user_id=? AND active=1',
        courseId,
        user.id,
      ),
      'You are not enrolled in this classroom.',
      403,
    );
  } else {
    staff(user);
    requireValue(
      user.role === 'admin' || course.teacher_id === user.id,
      'This classroom belongs to another lecturer.',
      403,
    );
  }
  return course;
}
async function moduleAccess(user: User, moduleId: string, write = false) {
  const courseModule = await one('SELECT * FROM modules WHERE id=?', moduleId);
  requireValue(courseModule, 'Module not found.', 404);
  await courseAccess(user, courseModule.course_id, write);
  if (user.role === 'student') {
    requireValue(courseModule.published, 'This module is not published.', 403);
    const previous = await all(
      'SELECT id FROM modules WHERE course_id=? AND position<? AND published=1',
      courseModule.course_id,
      courseModule.position,
    );
    for (const prior of previous) {
      const missing = await one(
        'SELECT l.id FROM lessons l WHERE l.module_id=? AND NOT EXISTS(SELECT 1 FROM completions c WHERE c.lesson_id=l.id AND c.user_id=?) LIMIT 1',
        prior.id,
        user.id,
      );
      requireValue(
        !missing,
        'Complete the lessons in the previous modules first.',
        403,
      );
      const unpassed = await one(
        'SELECT a.id FROM assessments a WHERE a.module_id=? AND a.published=1 AND NOT EXISTS(SELECT 1 FROM attempts t WHERE t.assessment_id=a.id AND t.user_id=? AND t.passed=1) LIMIT 1',
        prior.id,
        user.id,
      );
      requireValue(
        !unpassed,
        'Pass the assessments in the previous modules to unlock this module.',
        403,
      );
    }
  }
  return courseModule;
}
async function assessmentAccess(
  user: User,
  assessmentId: string,
  write = false,
) {
  const a = await one('SELECT * FROM assessments WHERE id=?', assessmentId);
  requireValue(a, 'Assessment not found.', 404);
  await moduleAccess(user, a.module_id, write);
  if (user.role === 'student') {
    requireValue(a.published, 'This assessment is not published.', 403);
    const missing = await one(
      'SELECT l.id FROM lessons l WHERE l.module_id=? AND NOT EXISTS(SELECT 1 FROM completions c WHERE c.lesson_id=l.id AND c.user_id=?) LIMIT 1',
      a.module_id,
      user.id,
    );
    requireValue(
      !missing,
      'Complete this module’s lessons before starting its assessment.',
      403,
    );
  }
  return a;
}
async function expire(attempt: Row, assessment: Row) {
  if (attempt.status === 'in_progress' && attempt.deadline <= now()) {
    const score = grade(
      JSON.parse(attempt.questions),
      JSON.parse(attempt.answers),
    );
    await run(
      "UPDATE attempts SET status='graded',submitted_at=deadline,score=?,passed=? WHERE id=? AND status='in_progress' AND deadline<=?",
      score,
      Number(score >= assessment.pass_mark),
      attempt.id,
      now(),
    );
    return (await one('SELECT * FROM attempts WHERE id=?', attempt.id))!;
  }
  return attempt;
}
function studentAttempt(attempt: Row) {
  return {
    ...attempt,
    questions: publicQuestions(JSON.parse(attempt.questions)),
    answers: JSON.parse(attempt.answers),
    score: attempt.released ? attempt.score : null,
    feedback: attempt.released ? attempt.feedback : '',
    file_key: undefined,
    change_actor: undefined,
    change_reason: undefined,
  };
}
async function snapshot(user: User) {
  const institution = await one(
    'SELECT * FROM institutions WHERE id=?',
    user.institution_id,
  );
  const courses =
    user.role === 'student'
      ? await all(
          'SELECT c.*,u.name teacher_name,term.name term_name,d.name department_name FROM courses c JOIN users u ON u.id=c.teacher_id JOIN enrollments e ON e.course_id=c.id LEFT JOIN course_allocations ca ON ca.course_id=c.id LEFT JOIN academic_terms term ON term.id=ca.term_id LEFT JOIN departments d ON d.id=ca.department_id WHERE c.institution_id=? AND e.user_id=? AND e.active=1 AND c.published=1',
          user.institution_id,
          user.id,
        )
      : await all(
          "SELECT c.*,u.name teacher_name,term.name term_name,d.name department_name FROM courses c JOIN users u ON u.id=c.teacher_id LEFT JOIN course_allocations ca ON ca.course_id=c.id LEFT JOIN academic_terms term ON term.id=ca.term_id LEFT JOIN departments d ON d.id=ca.department_id WHERE c.institution_id=? AND (?='admin' OR c.teacher_id=?) ORDER BY c.created_at",
          user.institution_id,
          user.role,
          user.id,
        );
  const modules: Row[] = [],
    lessons: Row[] = [],
    assessments: Row[] = [],
    enrollments: Row[] = [],
    attempts: Row[] = [];
  for (const c of courses) {
    const ms = await all(
      'SELECT * FROM modules WHERE course_id=? ORDER BY position',
      c.id,
    );
    for (const m of ms) {
      if (user.role === 'student' && !m.published) continue;
      let locked = false;
      try {
        await moduleAccess(user, m.id);
      } catch {
        locked = true;
      }
      modules.push({ ...m, locked });
      if (!locked) {
        lessons.push(
          ...(await all(
            'SELECT id,module_id,title,kind,content,file_name,captions_name,position FROM lessons WHERE module_id=? ORDER BY position',
            m.id,
          )),
        );
        const items = await all(
          'SELECT * FROM assessments WHERE module_id=?',
          m.id,
        );
        for (const a of items) {
          if (user.role === 'student' && !a.published) continue;
          const qs = JSON.parse(a.questions);
          assessments.push({
            ...a,
            questions: user.role === 'student' ? undefined : qs,
            question_count: qs.length,
            course_id: c.id,
          });
          const ts = await all(
            "SELECT t.*,u.name student_name,u.email student_email FROM attempts t JOIN users u ON u.id=t.user_id WHERE assessment_id=? AND (?<>'student' OR t.user_id=?)",
            a.id,
            user.role,
            user.id,
          );
          for (let t of ts) {
            t = { ...t, ...(await expire(t, a)) };
            attempts.push(
              user.role === 'student'
                ? studentAttempt(t)
                : {
                    ...t,
                    questions: undefined,
                    answers: undefined,
                    file_key: undefined,
                  },
            );
          }
        }
      }
    }
    if (user.role !== 'student')
      enrollments.push(
        ...(await all(
          'SELECT e.*,u.name,u.email,(u.password_hash IS NOT NULL) activated FROM enrollments e JOIN users u ON u.id=e.user_id WHERE e.course_id=?',
          c.id,
        )),
      );
  }
  const completion = await all(
    'SELECT lesson_id FROM completions WHERE user_id=?',
    user.id,
  );
  const events =
    user.role === 'admin'
      ? await all(
          'SELECT a.*,u.name FROM audit a JOIN users u ON u.id=a.user_id WHERE a.institution_id=? ORDER BY created_at DESC LIMIT 30',
          user.institution_id,
        )
      : await all(
          'SELECT a.*,u.name FROM audit a JOIN users u ON u.id=a.user_id WHERE a.user_id=? ORDER BY created_at DESC LIMIT 20',
          user.id,
        );
  const payments =
    user.role === 'admin'
      ? await all(
          'SELECT * FROM payments WHERE institution_id=? ORDER BY created_at DESC LIMIT 30',
          user.institution_id,
        )
      : [];
  const integrity =
    user.role === 'student'
      ? []
      : await all(
          'SELECT e.attempt_id,e.event_type,e.created_at,u.name learner_name FROM assessment_integrity_events e JOIN attempts t ON t.id=e.attempt_id JOIN users u ON u.id=t.user_id JOIN assessments a ON a.id=t.assessment_id JOIN modules m ON m.id=a.module_id JOIN courses c ON c.id=m.course_id WHERE c.institution_id=? AND (?=\'admin\' OR c.teacher_id=?) ORDER BY e.created_at DESC LIMIT 200',
          user.institution_id,
          user.role,
          user.id,
        );
  const certificates = await all(
    'SELECT cc.*,c.title course_title,c.code course_code FROM course_certificates cc JOIN courses c ON c.id=cc.course_id WHERE cc.user_id=? ORDER BY cc.issued_at DESC',
    user.id,
  );
  return {
    user,
    institution,
    courses,
    modules,
    lessons,
    assessments,
    enrollments,
    attempts,
    completion: completion.map((c) => c.lesson_id),
    events,
    payments,
    integrity,
    certificates,
    billingReady: !!runtime.PAYSTACK_SECRET_KEY,
    plans: [
      {
        id: 'teacher',
        name: 'Individual lecturer',
        amount: Number(runtime.TAS_TEACHER_AMOUNT_GHS) || null,
      },
      {
        id: 'college',
        name: 'College',
        amount: Number(runtime.TAS_COLLEGE_AMOUNT_GHS) || null,
      },
    ],
    serverTime: now(),
  };
}
async function readBounded(req: Request, limit: number) {
  const reader = req.body?.getReader();
  requireValue(reader, 'A request body is required.');
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      length += part.value.length;
      if (length > limit) {
        await reader.cancel();
        throw new HttpError(413, 'Request too large.');
      }
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}
async function body(req: Request) {
  requireValue(
    Number(req.headers.get('content-length') || 0) <= 524288,
    'Request too large.',
    413,
  );
  const raw = new TextDecoder().decode(await readBounded(req, 524288));
  requireValue(raw.length <= 524288, 'Request too large.', 413);
  try {
    const result = JSON.parse(raw);
    requireValue(
      result && typeof result === 'object' && !Array.isArray(result),
      'A JSON object is required.',
    );
    return result;
  } catch {
    throw new HttpError(400, 'Invalid request.');
  }
}
async function storeFile(req: Request, captions = false) {
  requireValue(
    Number(req.headers.get('content-length') || 0) <= 21 * 1024 * 1024,
    'Files must be 20 MB or smaller.',
    413,
  );
  const bytesBody = await readBounded(req, 21 * 1024 * 1024);
  const form = await new Response(bytesBody, {
    headers: { 'Content-Type': req.headers.get('content-type') || '' },
  }).formData();
  const file = form.get('file');
  requireValue(
    file instanceof File && file.size > 0 && file.size <= 20 * 1024 * 1024,
    'Choose a file up to 20 MB.',
  );
  const ext = file.name.split('.').pop()?.toLowerCase();
  requireValue(
    ext &&
      (captions
        ? ext === 'vtt' && file.size <= 1024 * 1024
        : ['pdf', 'txt', 'mp4', 'webm', 'pptx', 'docx'].includes(ext)),
    captions
      ? 'Upload a WebVTT caption file up to 1 MB.'
      : 'Allowed files: PDF, TXT, MP4, WebM, PPTX, DOCX.',
  );
  const bytes = new Uint8Array(await file.arrayBuffer());
  const magic = String.fromCharCode(...bytes.slice(0, 12));
  requireValue(
    ext === 'txt' ||
      (ext === 'vtt' && magic.startsWith('WEBVTT')) ||
      (ext === 'pdf' && magic.startsWith('%PDF-')) ||
      (['pptx', 'docx'].includes(ext) && magic.startsWith('PK')) ||
      (ext === 'mp4' && magic.slice(4, 8) === 'ftyp') ||
      (ext === 'webm' &&
        bytes[0] === 0x1a &&
        bytes[1] === 0x45 &&
        bytes[2] === 0xdf &&
        bytes[3] === 0xa3),
    'The file content does not match its extension.',
  );
  const key = id();
  await runtime.FILES.put(key, bytes, {
    httpMetadata: {
      contentType:
        ext === 'vtt'
          ? 'text/vtt; charset=utf-8'
          : ext === 'mp4'
            ? 'video/mp4'
            : ext === 'webm'
              ? 'video/webm'
              : 'application/octet-stream',
    },
  });
  return {
    key,
    name: file.name.replace(/[^a-zA-Z0-9 ._-]/g, '_').slice(0, 160),
  };
}
async function deliverFile(key: string, name: string) {
  const file = await runtime.FILES.get(key);
  requireValue(file, 'File not found.', 404);
  return new Response(file.body, {
    headers: {
      'Content-Type':
        file.httpMetadata?.contentType || 'application/octet-stream',
      'Content-Disposition': `${/\.(mp4|webm)$/i.test(name) ? 'inline' : 'attachment'}; filename="${name.replace(/[^a-zA-Z0-9 ._-]/g, '_')}"`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  });
}
async function verifyPayment(reference: string) {
  requireValue(/^[a-zA-Z0-9_-]{1,100}$/.test(reference), 'Invalid reference.');
  if (await one('SELECT reference FROM course_orders WHERE reference=?', reference))
    return verifyCourseOrder(reference);
  const payment = await one(
    'SELECT * FROM payments WHERE reference=?',
    reference,
  );
  requireValue(payment, 'Payment not found.', 404);
  requireValue(
    runtime.PAYSTACK_SECRET_KEY,
    'Payments are not configured.',
    503,
  );
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${runtime.PAYSTACK_SECRET_KEY}` } },
  );
  const result = (await response.json()) as Row;
  requireValue(
    response.ok && result.status,
    'Payment verification is unavailable.',
    502,
  );
  const p = result.data;
  requireValue(
    paymentMatches(
      {
        reference: payment.reference,
        amount: payment.amount,
        institution_id: payment.institution_id,
      },
      p,
    ),
    'Payment is pending or could not be verified.',
    409,
  );
  const duration = 30 * 86400000;
  await db().batch([
    stmt(
      "UPDATE institutions SET plan=?,paid_until=MAX(paid_until,?)+? WHERE id=? AND EXISTS(SELECT 1 FROM payments WHERE reference=? AND status='pending')",
      payment.plan,
      now(),
      duration,
      payment.institution_id,
      reference,
    ),
    stmt(
      "UPDATE payments SET status='paid' WHERE reference=? AND status='pending'",
      reference,
    ),
  ]);
  return { ok: true };
}
async function verifyCourseOrder(reference: string) {
  requireValue(/^[a-zA-Z0-9_-]{1,100}$/.test(reference), 'Invalid reference.');
  const order = await one('SELECT * FROM course_orders WHERE reference=?', reference);
  requireValue(order, 'Course order not found.', 404);
  const course = await one('SELECT * FROM courses WHERE id=?', order.course_id);
  requireValue(course, 'Course is unavailable.', 404);
  requireValue(runtime.PAYSTACK_SECRET_KEY, 'Payments are not configured.', 503);
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${runtime.PAYSTACK_SECRET_KEY}` } },
  );
  const result = (await response.json()) as Row;
  requireValue(
    response.ok && result.status,
    'Payment verification is unavailable.',
    502,
  );
  requireValue(
    coursePaymentMatches(
      {
        reference: order.reference,
        amount: order.amount,
        course_id: order.course_id,
        user_id: order.user_id,
      },
      result.data,
    ),
    'Payment is pending or could not be verified.',
    409,
  );
  const paidAt = now();
  const changes = await db().batch([
    stmt(
      "UPDATE course_orders SET status='paid',paid_at=? WHERE reference=? AND status='pending' RETURNING reference",
      paidAt,
      reference,
    ),
    stmt(
      "INSERT INTO enrollments(id,course_id,user_id,active) SELECT ?,course_id,user_id,1 FROM course_orders WHERE reference=? AND status='paid' ON CONFLICT(course_id,user_id) DO UPDATE SET active=1",
      id(),
      reference,
    ),
  ]);
  if (changes[0].results.length) {
    const learner = await one('SELECT id,institution_id,name,email,role FROM users WHERE id=?', order.user_id);
    if (learner)
      await audit(
        learner as User,
        'Purchased course access',
        `${course.code} · ${reference}`,
      );
  }
  return { ok: true, courseId: order.course_id };
}

export async function handle(req: Request) {
  try {
    const path = new URL(req.url).pathname
      .replace(/^\/api\/(?:tas|afc)\//, '')
      .split('/');
    const [resource, key, action] = path;
    const post = req.method === 'POST';
    if (resource === 'webhook' && post) {
      requireValue(
        runtime.PAYSTACK_SECRET_KEY,
        'Payments are not configured.',
        503,
      );
      const raw = new TextDecoder().decode(await readBounded(req, 524288));
      requireValue(
        await validWebhookSignature(
          raw,
          runtime.PAYSTACK_SECRET_KEY,
          req.headers.get('x-paystack-signature') || '',
        ),
        'Invalid signature.',
        401,
      );
      const event = JSON.parse(raw);
      if (event.event === 'charge.success')
        await verifyPayment(event.data.reference);
      return json({ ok: true });
    }
    if (post) {
      requireValue(
        req.headers.get('origin') === new URL(req.url).origin,
        'Request origin rejected.',
        403,
      );
    }
    if (resource === 'status' && !post) {
      return json({
        configured: !!(await one('SELECT id FROM institutions LIMIT 1')),
        local: import.meta.env.DEV,
      });
    }
    if (resource === 'catalog' && !post) {
      return json({
        courses: await all(
          'SELECT c.id,c.title,c.code,c.description,c.color,c.level,c.price_ghs,c.youtube_playlist_id,c.certificate_enabled,u.name instructor_name FROM courses c JOIN users u ON u.id=c.teacher_id WHERE c.published=1 ORDER BY c.created_at DESC LIMIT 100',
        ),
      });
    }
    if (resource === 'setup' && post) {
      requireValue(
        setupToken(),
        'Initial setup is not enabled.',
        503,
      );
      const b = await body(req);
      requireValue(
        safeEqual(String(b.token || ''), setupToken() || ''),
        'Invalid setup token.',
        403,
      );
      requireValue(
        !(await one('SELECT id FROM institutions LIMIT 1')),
        'TAS has already been set up.',
        409,
      );
      requireValue(
        passwordValid(b.password),
        'Use a password with 12–128 characters.',
      );
      const institutionId = 'primary';
      const userId = id();
      const name = str(b.name);
      const address = email(b.email);
      const hash = await hashPassword(b.password);
      await db().batch([
        stmt(
          'INSERT INTO institutions(id,name,semester) VALUES (?,?,?)',
          institutionId,
          str(b.institution),
          str(b.semester),
        ),
        stmt(
          'INSERT INTO users VALUES (?,?,?,?,?,?,?)',
          userId,
          institutionId,
          name,
          address,
          'admin',
          hash,
          now(),
        ),
      ]);
      return newSession({ id: userId }, req);
    }
    if (resource === 'login' && post) {
      const b = await body(req);
      const address = email(b.email);
      await rate('login:' + (await digest(address)));
      await rate(
        'ip:' + (await digest(req.headers.get('cf-connecting-ip') || 'local')),
        60,
      );
      requireValue(
        typeof b.password === 'string' && b.password.length <= 128,
        'Invalid email or password.',
        401,
      );
      const user = await one('SELECT * FROM users WHERE email=?', address);
      const fallback =
        'pbkdf2:100000:0000000000000000000000000000000000000000000000000000000000000000:0000000000000000000000000000000000000000000000000000000000000000';
      const valid = await verifyPassword(
        b.password,
        user?.password_hash || fallback,
      );
      requireValue(
        user?.password_hash &&
          valid &&
          !(await one(
            'SELECT user_id FROM account_controls WHERE user_id=? AND suspended=1',
            user.id,
          )),
        'Invalid email or password.',
        401,
      );
      await audit(user as User, 'Signed in', 'Account sign-in');
      return newSession(user, req);
    }
    if (resource === 'activate' && post) {
      const b = await body(req);
      requireValue(
        passwordValid(b.password),
        'Use a password with 12–128 characters.',
      );
      const hash = await digest(str(b.token, 100));
      const invitation = await one(
        'SELECT * FROM invitations WHERE token_hash=? AND used_at IS NULL AND expires_at>?',
        hash,
        now(),
      );
      requireValue(
        invitation,
        'This invitation has expired or has already been used.',
        400,
      );
      const password = await hashPassword(b.password);
      const time = now();
      const results = await db().batch([
        stmt(
          'UPDATE invitations SET used_at=? WHERE token_hash=? AND used_at IS NULL AND expires_at>?',
          time,
          hash,
          time,
        ),
        stmt(
          'UPDATE users SET password_hash=? WHERE id=? AND password_hash IS NULL AND changes()=1 AND NOT EXISTS(SELECT 1 FROM account_controls WHERE user_id=users.id AND suspended=1)',
          password,
          invitation.user_id,
        ),
      ]);
      requireValue(
        results[1].meta.changes === 1,
        'Account already activated or invitation used.',
        409,
      );
      return json({ ok: true });
    }
    const user = await session(req);
    if (resource === 'logout' && post) {
      const raw =
        req.headers.get('cookie')?.match(/afc_session=([a-f0-9]{64})/)?.[1] ||
        '';
      await run('DELETE FROM sessions WHERE token_hash=?', await digest(raw));
      return json({ ok: true }, 200, { 'Set-Cookie': cookie('', req, 0) });
    }
    if (resource === 'snapshot' && !post) return json(await snapshot(user));
    if (resource === 'security') {
      const currentHash = await digest(
        req.headers
          .get('cookie')
          ?.match(/(?:^|;\s*)afc_session=([a-f0-9]{64})(?:;|$)/)?.[1] || '',
      );
      if (!post)
        return json({
          sessions: await all(
            'SELECT d.id,d.device,d.created_at,s.expires_at,(s.token_hash=?) current FROM sessions s LEFT JOIN session_details d ON d.token_hash=s.token_hash WHERE s.user_id=? AND s.expires_at>? ORDER BY s.expires_at DESC',
            currentHash,
            user.id,
            now(),
          ),
        });
      const b = await body(req);
      await rate('security:' + user.id, 30);
      if (key === 'revoke-others') {
        await db().batch([
          stmt(
            'DELETE FROM sessions WHERE user_id=? AND token_hash<>?',
            user.id,
            currentHash,
          ),
          stmt(
            'INSERT INTO audit VALUES (?,?,?,?,?,?)',
            id(),
            user.institution_id,
            user.id,
            'Revoked other sessions',
            'Account security',
            now(),
          ),
        ]);
      } else if (key === 'revoke') {
        const target = await one(
          'SELECT s.token_hash FROM sessions s JOIN session_details d ON d.token_hash=s.token_hash WHERE d.id=? AND s.user_id=?',
          str(b.id),
          user.id,
        );
        requireValue(target, 'Session not found.', 404);
        requireValue(
          target.token_hash !== currentHash,
          'Use Sign out to close your current session.',
        );
        await db().batch([
          stmt(
            'DELETE FROM sessions WHERE token_hash=? AND user_id=?',
            target.token_hash,
            user.id,
          ),
          stmt(
            'INSERT INTO audit VALUES (?,?,?,?,?,?)',
            id(),
            user.institution_id,
            user.id,
            'Revoked session',
            'Account security',
            now(),
          ),
        ]);
      } else throw new HttpError(404, 'Security action not found.');
      return json({ ok: true });
    }
    if (resource === 'institution') {
      administrator(user);
      if (!post) {
        const params = new URL(req.url).searchParams;
        const query = (params.get('q') || '').slice(0, 100);
        const page = integer(params.get('page') || 1, 1, 100000);
        return json({
          departments: await all(
            'SELECT * FROM departments WHERE institution_id=? ORDER BY name',
            user.institution_id,
          ),
          terms: await all(
            'SELECT * FROM academic_terms WHERE institution_id=? ORDER BY starts_on DESC',
            user.institution_id,
          ),
          people: await all(
            'SELECT u.id,u.name,u.email,u.role,(u.password_hash IS NOT NULL) activated,COALESCE(ac.suspended,0) suspended,ac.reason,ac.updated_at FROM users u LEFT JOIN account_controls ac ON ac.user_id=u.id WHERE u.institution_id=? AND (instr(lower(u.name),lower(?))>0 OR instr(lower(u.email),lower(?))>0) ORDER BY u.role,u.name,u.id LIMIT 50 OFFSET ?',
            user.institution_id,
            query,
            query,
            (page - 1) * 50,
          ),
          peopleTotal: (await one(
            'SELECT COUNT(*) count FROM users WHERE institution_id=? AND (instr(lower(name),lower(?))>0 OR instr(lower(email),lower(?))>0)',
            user.institution_id,
            query,
            query,
          ))!.count,
          lecturers: await all(
            "SELECT id,name FROM users WHERE institution_id=? AND role IN ('admin','teacher') AND password_hash IS NOT NULL AND NOT EXISTS(SELECT 1 FROM account_controls WHERE user_id=users.id AND suspended=1) ORDER BY name",
            user.institution_id,
          ),
          allocations: await all(
            'SELECT ca.* FROM course_allocations ca JOIN courses c ON c.id=ca.course_id WHERE c.institution_id=?',
            user.institution_id,
          ),
        });
      }
      const b = await body(req);
      if (key === 'departments' || key === 'terms') {
        const name = str(b.name, 120);
        const recordId = id();
        let command: D1PreparedStatement;
        if (key === 'departments') {
          const code = str(b.code, 20).toUpperCase();
          requireValue(
            /^[A-Z0-9_-]+$/.test(code),
            'Use letters, numbers, hyphens or underscores for the code.',
          );
          command = stmt(
            'INSERT OR IGNORE INTO departments VALUES (?,?,?,?)',
            recordId,
            user.institution_id,
            name,
            code,
          );
        } else {
          const start = str(b.startsOn, 10),
            end = str(b.endsOn, 10);
          const validDay = (v: string) =>
            /^\d{4}-\d{2}-\d{2}$/.test(v) &&
            Number.isFinite(Date.parse(v)) &&
            new Date(v).toISOString().slice(0, 10) === v;
          requireValue(
            validDay(start) && validDay(end) && start <= end,
            'Enter valid dates with the end on or after the start.',
          );
          command = stmt(
            'INSERT OR IGNORE INTO academic_terms VALUES (?,?,?,?,?)',
            recordId,
            user.institution_id,
            name,
            start,
            end,
          );
        }
        const results = await db().batch([
          command,
          stmt(
            'INSERT INTO audit SELECT ?,?,?,?,?,? WHERE changes()=1',
            id(),
            user.institution_id,
            user.id,
            key === 'departments'
              ? 'Created department'
              : 'Created academic term',
            name,
            now(),
          ),
        ]);
        requireValue(
          results[0].meta.changes === 1,
          'This department code or academic term already exists.',
          409,
        );
        return json({ id: recordId });
      }
      if (key === 'access') {
        const target = await one(
          'SELECT id,role,email FROM users WHERE id=? AND institution_id=?',
          str(b.userId),
          user.institution_id,
        );
        requireValue(target, 'Account not found.', 404);
        requireValue(
          target.role !== 'admin',
          'Administrator accounts cannot be suspended here.',
          403,
        );
        requireValue(
          typeof b.suspended === 'boolean',
          'Choose suspend or restore.',
        );
        const reason = str(b.reason, 500);
        await db().batch([
          stmt(
            'INSERT INTO account_controls VALUES (?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET suspended=excluded.suspended,reason=excluded.reason,updated_by=excluded.updated_by,updated_at=excluded.updated_at',
            target.id,
            Number(b.suspended),
            reason,
            user.id,
            now(),
          ),
          stmt('DELETE FROM sessions WHERE user_id=?', target.id),
          stmt('DELETE FROM invitations WHERE user_id=?', target.id),
          stmt(
            'INSERT INTO audit VALUES (?,?,?,?,?,?)',
            id(),
            user.institution_id,
            user.id,
            b.suspended ? 'Suspended account' : 'Restored account',
            `${target.email} · ${reason}`,
            now(),
          ),
        ]);
        return json({ ok: true });
      }
      if (key === 'invitation') {
        const target = await one(
          'SELECT id,email FROM users WHERE id=? AND institution_id=? AND password_hash IS NULL AND NOT EXISTS(SELECT 1 FROM account_controls WHERE user_id=users.id AND suspended=1)',
          str(b.userId),
          user.institution_id,
        );
        requireValue(
          target,
          'Only an active, unactivated account can receive a replacement invitation.',
          409,
        );
        const raw = token();
        await db().batch([
          stmt('DELETE FROM invitations WHERE user_id=?', target.id),
          stmt(
            'INSERT INTO invitations VALUES (?,?,?,NULL)',
            await digest(raw),
            target.id,
            now() + 48 * 3600000,
          ),
          stmt(
            'INSERT INTO audit VALUES (?,?,?,?,?,?)',
            id(),
            user.institution_id,
            user.id,
            'Replaced invitation',
            target.email,
            now(),
          ),
        ]);
        return json({ activationPath: `/?invite=${raw}` });
      }
      if (key === 'allocation') {
        const course = await courseAccess(user, str(b.courseId), true);
        const teacherId = str(b.teacherId);
        requireValue(
          await one(
            "SELECT id FROM users WHERE id=? AND institution_id=? AND role IN ('teacher','admin') AND password_hash IS NOT NULL AND NOT EXISTS(SELECT 1 FROM account_controls WHERE user_id=users.id AND suspended=1)",
            teacherId,
            user.institution_id,
          ),
          'Choose an active lecturer in this institution.',
        );
        const departmentId = b.departmentId ? str(b.departmentId) : null;
        const termId = b.termId ? str(b.termId) : null;
        if (departmentId)
          requireValue(
            await one(
              'SELECT id FROM departments WHERE id=? AND institution_id=?',
              departmentId,
              user.institution_id,
            ),
            'Department not found.',
            404,
          );
        if (termId)
          requireValue(
            await one(
              'SELECT id FROM academic_terms WHERE id=? AND institution_id=?',
              termId,
              user.institution_id,
            ),
            'Academic term not found.',
            404,
          );
        const revision = integer(b.revision, 0, 1000000);
        const results = await db().batch([
          stmt(
            'INSERT INTO course_allocations SELECT ?,?,?,1 WHERE ?=0 OR EXISTS(SELECT 1 FROM course_allocations WHERE course_id=? AND revision=?) ON CONFLICT(course_id) DO UPDATE SET department_id=excluded.department_id,term_id=excluded.term_id,revision=course_allocations.revision+1 WHERE course_allocations.revision=?',
            course.id,
            departmentId,
            termId,
            revision,
            course.id,
            revision,
            revision,
          ),
          stmt(
            'UPDATE courses SET teacher_id=? WHERE id=? AND changes()=1',
            teacherId,
            course.id,
          ),
          stmt(
            'INSERT INTO audit SELECT ?,?,?,?,?,? WHERE changes()=1',
            id(),
            user.institution_id,
            user.id,
            'Updated classroom allocation',
            `${course.code} · Lecturer ${teacherId} · Department ${departmentId || 'none'} · Term ${termId || 'none'}`,
            now(),
          ),
        ]);
        requireValue(
          results[0].meta.changes === 1,
          'This allocation changed. Refresh and try again.',
          409,
        );
        return json({ ok: true });
      }
      throw new HttpError(404, 'Institution action not found.');
    }
    if (resource === 'courses' && key && action === 'checkout' && post) {
      requireValue(user.role === 'student', 'Learner access required.', 403);
      const course = await one(
        'SELECT * FROM courses WHERE id=? AND institution_id=? AND published=1',
        key,
        user.institution_id,
      );
      requireValue(course, 'This course is unavailable.', 404);
      const enrolled = await one(
        'SELECT id FROM enrollments WHERE course_id=? AND user_id=? AND active=1',
        key,
        user.id,
      );
      if (enrolled) return json({ enrolled: true });
      const amount = Number(course.price_ghs) * 100;
      requireValue(
        Number.isSafeInteger(amount) && amount >= 0,
        'This course price is invalid.',
        503,
      );
      if (amount === 0) {
        await run(
          'INSERT INTO enrollments(id,course_id,user_id,active) VALUES (?,?,?,1) ON CONFLICT(course_id,user_id) DO UPDATE SET active=1',
          id(),
          key,
          user.id,
        );
        await audit(user, 'Joined free course', course.code);
        return json({ enrolled: true });
      }
      requireValue(
        runtime.PAYSTACK_SECRET_KEY,
        'Course payments are not configured yet.',
        503,
      );
      const reference = 'afc_course_' + id().replaceAll('-', '');
      await run(
        "INSERT INTO course_orders(reference,course_id,user_id,amount,status,created_at) VALUES (?,?,?,?, 'pending',?)",
        reference,
        key,
        user.id,
        amount,
        now(),
      );
      const response = await fetch(
        'https://api.paystack.co/transaction/initialize',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${runtime.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            amount,
            currency: 'GHS',
            reference,
            callback_url: new URL(
              `/?course-payment=verify&reference=${encodeURIComponent(reference)}`,
              req.url,
            ).href,
            metadata: { course_id: key, user_id: user.id },
            channels: ['card', 'mobile_money'],
          }),
        },
      );
      const result = (await response.json()) as Row;
      requireValue(
        response.ok && result.status,
        'Unable to start course payment. Please try again.',
        502,
      );
      requireValue(
        typeof result.data?.authorization_url === 'string' &&
          new URL(result.data.authorization_url).hostname ===
            'checkout.paystack.com',
        'Payment provider returned an invalid checkout URL.',
        502,
      );
      return json({ url: result.data.authorization_url });
    }
    if (resource === 'courses' && post && !key) {
      staff(user);
      const b = await body(req);
      const courseId = id();
      await run(
        'INSERT INTO courses(id,institution_id,teacher_id,title,code,description,color,published,created_at,level,price_ghs,youtube_playlist_id,certificate_enabled) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
        courseId,
        user.institution_id,
        user.id,
        str(b.title),
        str(b.code, 30),
        str(b.description, 3000),
        ['blue', 'orange', 'purple', 'teal'].includes(b.color)
          ? b.color
          : 'blue',
        0,
        now(),
        courseLevel(b.level),
        integer(b.priceGhs ?? 0, 0, 1000000),
        typeof b.youtubePlaylistId === 'string' && b.youtubePlaylistId.trim()
          ? str(b.youtubePlaylistId, 100)
          : null,
        Number(b.certificateEnabled !== false),
      );
      await audit(user, 'Created classroom', b.title);
      return json({ id: courseId });
    }
    if (resource === 'courses' && key && post) {
      const course = await courseAccess(user, key, true);
      const b = await body(req);
      if (action === 'publish') {
        await run(
          'UPDATE courses SET published=? WHERE id=?',
          Number(!!b.published),
          key,
        );
        await audit(
          user,
          b.published ? 'Published classroom' : 'Unpublished classroom',
          course.title,
        );
        return json({ ok: true });
      }
      if (action === 'enroll') {
        const address = email(b.email);
        const name = str(b.name);
        const student = await one('SELECT * FROM users WHERE email=?', address);
        if (student)
          requireValue(
            student.institution_id === user.institution_id &&
              student.role === 'student',
            'This email cannot be enrolled in this institution.',
            409,
          );
        let activation: string | null = null;
        const studentId = student?.id || id();
        const commands = [];
        if (!student)
          commands.push(
            stmt(
              'INSERT INTO users VALUES (?,?,?,?,?,NULL,?)',
              studentId,
              user.institution_id,
              name,
              address,
              'student',
              now(),
            ),
          );
        commands.push(
          stmt(
            'INSERT INTO enrollments VALUES (?,?,?,1) ON CONFLICT(course_id,user_id) DO UPDATE SET active=1',
            id(),
            key,
            studentId,
          ),
        );
        if (!student?.password_hash) {
          activation = token();
          commands.push(
            stmt(
              'INSERT INTO invitations VALUES (?,?,?,NULL)',
              await digest(activation),
              studentId,
              now() + 48 * 3600000,
            ),
          );
        }
        await db().batch(commands);
        await audit(user, 'Enrolled student', `${address} · ${course.code}`);
        return json({
          ok: true,
          activationPath: activation ? `/?invite=${activation}` : null,
        });
      }
      if (action === 'revoke') {
        const studentId = str(b.userId);
        await run(
          'UPDATE enrollments SET active=0 WHERE course_id=? AND user_id=?',
          key,
          studentId,
        );
        await audit(
          user,
          'Revoked enrollment',
          `${studentId} · ${course.code}`,
        );
        return json({ ok: true });
      }
      if (action === 'modules') {
        const moduleId = id();
        await run(
          'INSERT INTO modules SELECT ?,?,?,COALESCE(MAX(position),0)+1,0 FROM modules WHERE course_id=?',
          moduleId,
          key,
          str(b.title),
          key,
        );
        await audit(user, 'Created module', b.title);
        return json({ id: moduleId });
      }
    }
    if (resource === 'modules' && key && post) {
      const courseModule = await moduleAccess(user, key, true);
      const b = await body(req);
      if (action === 'publish') {
        await run(
          'UPDATE modules SET published=? WHERE id=?',
          Number(!!b.published),
          key,
        );
        await audit(
          user,
          b.published ? 'Published module' : 'Unpublished module',
          courseModule.title,
        );
        return json({ ok: true });
      }
      if (action === 'lessons') {
        const kind = ['note', 'video', 'slides'].includes(b.kind)
          ? b.kind
          : 'note';
        const lessonId = id();
        await run(
          'INSERT INTO lessons(id,module_id,title,kind,content,file_key,file_name,position) SELECT ?,?,?,?, ?,NULL,NULL,COALESCE(MAX(position),0)+1 FROM lessons WHERE module_id=?',
          lessonId,
          key,
          str(b.title),
          kind,
          str(b.content, 50000),
          key,
        );
        await audit(user, 'Added lesson', b.title);
        return json({ id: lessonId });
      }
      if (action === 'assessments') {
        const kind = ['quiz', 'assignment', 'project'].includes(b.kind)
          ? b.kind
          : 'quiz';
        let questions: Question[] = [];
        if (kind === 'quiz') {
          try {
            questions = validateQuestions(b.questions);
          } catch (e) {
            throw new HttpError(400, (e as Error).message);
          }
        }
        const due = b.dueAt ? new Date(b.dueAt).getTime() : null;
        requireValue(!due || Number.isFinite(due), 'Invalid due date.');
        const assessmentId = id();
        await run(
          'INSERT INTO assessments(id,module_id,title,kind,instructions,duration_minutes,pass_mark,max_attempts,due_at,published,questions,integrity_mode) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
          assessmentId,
          key,
          str(b.title),
          kind,
          str(b.instructions, 10000),
          integer(b.durationMinutes || 30, 1, 240),
          integer(b.passMark ?? 70, 1, 100),
          integer(b.maxAttempts || 2, 1, 10),
          due,
          0,
          JSON.stringify(questions),
          integrityMode(b.integrityMode),
        );
        await audit(user, 'Created assessment', b.title);
        return json({ id: assessmentId });
      }
    }
    if (resource === 'lessons' && key) {
      const lesson = await one('SELECT * FROM lessons WHERE id=?', key);
      requireValue(lesson, 'Lesson not found.', 404);
      await moduleAccess(
        user,
        lesson.module_id,
        post && (action === 'file' || action === 'captions'),
      );
      if (action === 'captions' && post) {
        requireValue(
          lesson.kind === 'video',
          'Captions can only be attached to video lessons.',
        );
        const file = await storeFile(req, true);
        await run(
          'UPDATE lessons SET captions_key=?,captions_name=? WHERE id=?',
          file.key,
          file.name,
          key,
        );
        await audit(user, 'Uploaded video captions', lesson.title);
        return json({ ok: true });
      }
      if (action === 'captions' && !post) {
        requireValue(lesson.captions_key, 'Captions are not available.', 404);
        return deliverFile(lesson.captions_key, lesson.captions_name);
      }
      if (action === 'file' && post) {
        const file = await storeFile(req);
        await run(
          'UPDATE lessons SET file_key=?,file_name=? WHERE id=?',
          file.key,
          file.name,
          key,
        );
        await audit(user, 'Uploaded course material', lesson.title);
        return json({ ok: true });
      }
      if (action === 'file' && !post) {
        requireValue(lesson.file_key, 'No file attached.', 404);
        return deliverFile(lesson.file_key, lesson.file_name);
      }
      if (action === 'complete' && post) {
        requireValue(user.role === 'student', 'Student access required.', 403);
        await run(
          'INSERT INTO completions VALUES (?,?,?,?) ON CONFLICT(user_id,lesson_id) DO NOTHING',
          id(),
          user.id,
          key,
          now(),
        );
        return json({ ok: true });
      }
    }
    if (resource === 'assessments' && key && post) {
      const a = await assessmentAccess(
        user,
        key,
        action === 'publish' || action === 'import',
      );
      const b = await body(req);
      if (action === 'publish') {
        await run(
          'UPDATE assessments SET published=? WHERE id=?',
          Number(!!b.published),
          key,
        );
        await audit(
          user,
          b.published ? 'Published assessment' : 'Unpublished assessment',
          a.title,
        );
        return json({ ok: true });
      }
      if (action === 'start') {
        requireValue(
          user.role === 'student' && a.kind === 'quiz',
          'Only enrolled students can start quizzes.',
          403,
        );
        requireValue(
          !a.due_at || a.due_at > now(),
          'The assessment deadline has passed.',
          409,
        );
        const previous = await all(
          'SELECT * FROM attempts WHERE assessment_id=? AND user_id=? ORDER BY number DESC',
          key,
          user.id,
        );
        if (previous[0]?.status === 'in_progress') {
          const current = await expire(previous[0], a);
          if (current.status === 'in_progress')
            return json({
              attempt: studentAttempt(current),
              serverTime: now(),
            });
        }
        requireValue(
          previous.length < a.max_attempts,
          'You have used all allowed attempts.',
          409,
        );
        const started = now();
        const attemptId = id();
        try {
          await run(
            'INSERT INTO attempts(id,assessment_id,user_id,number,started_at,deadline,status,questions) VALUES (?,?,?,?,?,?,?,?)',
            attemptId,
            key,
            user.id,
            previous.length + 1,
            started,
            Math.min(
              started + a.duration_minutes * 60000,
              a.due_at || Infinity,
            ),
            'in_progress',
            JSON.stringify(shuffleQuestions(JSON.parse(a.questions))),
          );
        } catch {
          throw new HttpError(
            409,
            'An attempt was already started. Refresh and resume it.',
          );
        }
        await audit(user, 'Started quiz', a.title);
        return json({
          attempt: studentAttempt(
            (await one('SELECT * FROM attempts WHERE id=?', attemptId))!,
          ),
          serverTime: now(),
        });
      }
      if (action === 'submit-work') {
        requireValue(
          user.role === 'student' && a.kind !== 'quiz',
          'Student assignment access required.',
          403,
        );
        requireValue(
          !a.due_at || a.due_at > now(),
          'The submission deadline has passed.',
          409,
        );
        const previous = await all(
          'SELECT id FROM attempts WHERE assessment_id=? AND user_id=?',
          key,
          user.id,
        );
        requireValue(
          previous.length < a.max_attempts,
          'You have used all allowed submissions.',
          409,
        );
        const attemptId = id();
        await run(
          'INSERT INTO attempts(id,assessment_id,user_id,number,started_at,deadline,submitted_at,status,questions,text_submission) VALUES (?,?,?,?,?,?,?,?,?,?)',
          attemptId,
          key,
          user.id,
          previous.length + 1,
          now(),
          a.due_at || now() + 365 * 86400000,
          now(),
          'submitted',
          '[]',
          str(b.text, 50000),
        );
        await audit(user, 'Submitted work', a.title);
        return json({ id: attemptId });
      }
      if (action === 'import') {
        requireValue(
          a.kind !== 'quiz',
          'Import external grades into assignments or projects.',
          400,
        );
        requireValue(
          Array.isArray(b.rows) && b.rows.length > 0 && b.rows.length <= 200,
          'Import 1–200 grade rows.',
        );
        const courseModule = await moduleAccess(user, a.module_id, true);
        const commands = [];
        const seen = new Set();
        for (const row of b.rows) {
          const address = email(row.email);
          requireValue(
            !seen.has(address),
            'Duplicate student email in import.',
          );
          seen.add(address);
          const student = await one(
            'SELECT u.id FROM users u JOIN enrollments e ON e.user_id=u.id WHERE u.email=? AND u.institution_id=? AND e.course_id=? AND e.active=1',
            address,
            user.institution_id,
            courseModule.course_id,
          );
          requireValue(student, `Student is not enrolled: ${address}`);
          const score = integer(row.score, 0, 100);
          const last = await one(
            'SELECT COALESCE(MAX(number),0) n FROM attempts WHERE assessment_id=? AND user_id=?',
            key,
            student.id,
          );
          commands.push(
            stmt(
              "INSERT INTO attempts(id,assessment_id,user_id,number,started_at,deadline,submitted_at,status,questions,score,passed,feedback,change_actor,change_reason) VALUES (?,?,?,?,?,?,?,'graded','[]',?,?,?,?,'CSV grade import')",
              id(),
              key,
              student.id,
              last!.n + 1,
              now(),
              now(),
              now(),
              score,
              Number(score >= a.pass_mark),
              'Imported grade',
              user.id,
            ),
          );
        }
        await db().batch(commands);
        await audit(
          user,
          'Imported grades',
          `${b.rows.length} grades · ${a.title}`,
        );
        return json({ ok: true });
      }
    }
    if (resource === 'attempts' && key) {
      let attempt = await one('SELECT * FROM attempts WHERE id=?', key);
      requireValue(attempt, 'Attempt not found.', 404);
      requireValue(
        user.role !== 'student' || attempt.user_id === user.id,
        'Attempt not found.',
        404,
      );
      const a = await assessmentAccess(
        user,
        attempt.assessment_id,
        user.role !== 'student',
      );
      attempt = await expire(attempt, a);
      if (action === 'history' && !post) {
        staff(user);
        return json({
          history: await all(
            'SELECT h.*,u.name actor_name FROM grade_history h LEFT JOIN users u ON u.id=h.actor_id WHERE h.attempt_id=? ORDER BY h.revision DESC LIMIT 200',
            key,
          ),
        });
      }
      if (action === 'integrity' && !post) {
        staff(user);
        const events = await all(
          'SELECT event_type,created_at FROM assessment_integrity_events WHERE attempt_id=? ORDER BY created_at ASC LIMIT 500',
          key,
        );
        return json({
          events,
          risk: integrityRisk(
            events.map((event) => ({
              event_type: event.event_type as IntegrityEventType,
            })),
          ),
        });
      }
      if (action === 'file' && !post) {
        requireValue(attempt.file_key, 'No file attached.', 404);
        return deliverFile(attempt.file_key, attempt.file_name);
      }
      if (action === 'file' && post) {
        requireValue(
          user.role === 'student' &&
            a.kind !== 'quiz' &&
            attempt.status === 'submitted' &&
            !attempt.released &&
            attempt.deadline > now(),
          'This submission can no longer be changed.',
          409,
        );
        const file = await storeFile(req);
        await run(
          "UPDATE attempts SET file_key=?,file_name=? WHERE id=? AND status='submitted' AND deadline>?",
          file.key,
          file.name,
          key,
          now(),
        );
        return json({ ok: true });
      }
      if (!post)
        return json({
          attempt:
            user.role === 'student'
              ? studentAttempt(attempt)
              : {
                  ...attempt,
                  questions: JSON.parse(attempt.questions),
                  answers: JSON.parse(attempt.answers),
                },
          serverTime: now(),
        });
      const b = await body(req);
      if (action === 'integrity') {
        requireValue(
          user.role === 'student' &&
            a.kind === 'quiz' &&
            attempt.status === 'in_progress' &&
            attempt.user_id === user.id,
          'Active learner quiz access required.',
          403,
        );
        requireValue(
          isIntegrityEventType(b.event),
          'Invalid integrity event.',
        );
        await rate(`integrity:${attempt.id}`, 120);
        await run(
          'INSERT INTO assessment_integrity_events(id,attempt_id,user_id,event_type,created_at) VALUES (?,?,?,?,?)',
          id(),
          attempt.id,
          user.id,
          b.event,
          now(),
        );
        return json({ ok: true });
      }
      if (action === 'save' || action === 'submit') {
        requireValue(
          user.role === 'student' && a.kind === 'quiz',
          'Student quiz access required.',
          403,
        );
        if (attempt.status !== 'in_progress')
          return json({ attempt: studentAttempt(attempt), serverTime: now() });
        requireValue(
          b.answers &&
            typeof b.answers === 'object' &&
            !Array.isArray(b.answers),
          'Invalid answers.',
        );
        const questions = JSON.parse(attempt.questions) as Question[];
        const answers: Record<string, number> = {};
        for (const [qid, value] of Object.entries(b.answers)) {
          const q = questions.find((q) => q.id === qid);
          requireValue(
            q &&
              Number.isInteger(value) &&
              Number(value) >= 0 &&
              Number(value) < q.options.length,
            'Invalid answer.',
          );
          answers[qid] = Number(value);
        }
        if (action === 'save') {
          await run(
            "UPDATE attempts SET answers=? WHERE id=? AND status='in_progress' AND deadline>?",
            JSON.stringify(answers),
            key,
            now(),
          );
        } else {
          const score = grade(questions, answers);
          await run(
            "UPDATE attempts SET answers=?,score=?,passed=?,status='graded',submitted_at=? WHERE id=? AND status='in_progress' AND deadline>?",
            JSON.stringify(answers),
            score,
            Number(score >= a.pass_mark),
            now(),
            key,
            now(),
          );
          await audit(user, 'Submitted quiz', a.title);
        }
        const updated = await expire(
          (await one('SELECT * FROM attempts WHERE id=?', key))!,
          a,
        );
        return json({ attempt: studentAttempt(updated), serverTime: now() });
      }
      staff(user);
      if (action === 'grade') {
        requireValue(
          a.kind !== 'quiz' && attempt.status !== 'in_progress',
          'This submission cannot be manually graded.',
        );
        const score = integer(b.score, 0, 100);
        requireValue(
          typeof b.feedback === 'string' && b.feedback.length <= 10000,
          'Feedback must be under 10,000 characters.',
        );
        const revision = integer(b.revision, 0, 1000000);
        const reason =
          attempt.score === null
            ? 'Initial manual assessment'
            : str(b.reason, 500);
        const results = await db().batch([
          stmt(
            "UPDATE attempts SET score=?,passed=?,feedback=?,status='graded',released=0,change_actor=?,change_reason=? WHERE id=? AND revision=? RETURNING id",
            score,
            Number(score >= a.pass_mark),
            b.feedback,
            user.id,
            reason,
            key,
            revision,
          ),
          stmt(
            'INSERT INTO audit SELECT ?,?,?,?,?,? WHERE changes()=1',
            id(),
            user.institution_id,
            user.id,
            'Graded submission',
            `${a.title} · ${attempt.user_id} · ${score}% · ${reason}`,
            now(),
          ),
        ]);
        requireValue(
          results[0].results.length === 1,
          'This grade changed since you opened it. Refresh and review the latest result.',
          409,
        );
        return json({ ok: true });
      }
      if (action === 'release') {
        requireValue(
          attempt.status === 'graded',
          'Grade this submission before releasing it.',
        );
        requireValue(
          typeof b.released === 'boolean',
          'Choose release or withhold.',
        );
        const revision = integer(b.revision, 0, 1000000);
        const reason = b.released
          ? 'Released grade to student'
          : 'Withheld grade from student';
        const results = await db().batch([
          stmt(
            'UPDATE attempts SET released=?,change_actor=?,change_reason=? WHERE id=? AND revision=? RETURNING id',
            Number(b.released),
            user.id,
            reason,
            key,
            revision,
          ),
          stmt(
            'INSERT INTO audit SELECT ?,?,?,?,?,? WHERE changes()=1',
            id(),
            user.institution_id,
            user.id,
            reason,
            `${a.title} · ${attempt.user_id}`,
            now(),
          ),
        ]);
        requireValue(
          results[0].results.length === 1,
          'This grade changed. Refresh before releasing or withholding it.',
          409,
        );
        return json({ ok: true });
      }
    }
    if (resource === 'certificates' && key && post && action === 'claim') {
      const course = await courseAccess(user, key);
      requireValue(user.role === 'student', 'Learner access required.', 403);
      requireValue(
        course.certificate_enabled,
        'This course does not issue a certificate.',
        409,
      );
      const incompleteLesson = await one(
        'SELECT l.id FROM lessons l JOIN modules m ON m.id=l.module_id WHERE m.course_id=? AND m.published=1 AND NOT EXISTS(SELECT 1 FROM completions c WHERE c.lesson_id=l.id AND c.user_id=?) LIMIT 1',
        key,
        user.id,
      );
      requireValue(
        !incompleteLesson,
        'Complete every published lesson before claiming your certificate.',
        409,
      );
      const unpassedAssessment = await one(
        'SELECT a.id FROM assessments a JOIN modules m ON m.id=a.module_id WHERE m.course_id=? AND m.published=1 AND a.published=1 AND NOT EXISTS(SELECT 1 FROM attempts t WHERE t.assessment_id=a.id AND t.user_id=? AND t.passed=1) LIMIT 1',
        key,
        user.id,
      );
      requireValue(
        !unpassedAssessment,
        'Pass every published assessment before claiming your certificate.',
        409,
      );
      const code = `AFC-${course.code}-${id().replaceAll('-', '').slice(0, 10).toUpperCase()}`;
      await run(
        'INSERT INTO course_certificates(id,course_id,user_id,certificate_code,issued_at) VALUES (?,?,?,?,?) ON CONFLICT(course_id,user_id) DO NOTHING',
        id(),
        key,
        user.id,
        code,
        now(),
      );
      const certificate = await one(
        'SELECT cc.*,c.title course_title,c.code course_code FROM course_certificates cc JOIN courses c ON c.id=cc.course_id WHERE cc.course_id=? AND cc.user_id=?',
        key,
        user.id,
      );
      await audit(user, 'Claimed course certificate', course.title);
      return json({ certificate });
    }
    if (resource === 'course-orders' && key === 'verify' && post) {
      const b = await body(req);
      const reference = str(b.reference, 100);
      const order = await one(
        'SELECT user_id FROM course_orders WHERE reference=?',
        reference,
      );
      requireValue(order?.user_id === user.id, 'Course order not found.', 404);
      return json(await verifyCourseOrder(reference));
    }
    if (resource === 'settings' && post) {
      administrator(user);
      const b = await body(req);
      await run(
        'UPDATE institutions SET name=?,semester=? WHERE id=?',
        str(b.name),
        str(b.semester),
        user.institution_id,
      );
      await audit(user, 'Updated institution settings', b.name);
      return json({ ok: true });
    }
    if (resource === 'staff' && post && !key) {
      administrator(user);
      const b = await body(req);
      const userId = id();
      const activation = token();
      requireValue(
        !(await one('SELECT id FROM users WHERE email=?', email(b.email))),
        'An account already uses this email. Manage its access from Institution administration.',
        409,
      );
      await db().batch([
        stmt(
          'INSERT INTO users VALUES (?,?,?,?,?,NULL,?)',
          userId,
          user.institution_id,
          str(b.name),
          email(b.email),
          'teacher',
          now(),
        ),
        stmt(
          'INSERT INTO invitations VALUES (?,?,?,NULL)',
          await digest(activation),
          userId,
          now() + 48 * 3600000,
        ),
      ]);
      await audit(user, 'Invited lecturer', b.email);
      return json({ activationPath: `/?invite=${activation}` });
    }
    if (resource === 'password' && post) {
      await rate('password:' + user.id);
      const b = await body(req);
      requireValue(
        passwordValid(b.password),
        'Use a password with 12–128 characters.',
      );
      const record = await one(
        'SELECT password_hash FROM users WHERE id=?',
        user.id,
      );
      requireValue(
        await verifyPassword(String(b.current || ''), record!.password_hash),
        'Current password is incorrect.',
        403,
      );
      await db().batch([
        stmt(
          'UPDATE users SET password_hash=? WHERE id=?',
          await hashPassword(b.password),
          user.id,
        ),
        stmt('DELETE FROM sessions WHERE user_id=?', user.id),
      ]);
      await audit(user, 'Changed password', 'All sessions revoked');
      return json({ ok: true }, 200, { 'Set-Cookie': cookie('', req, 0) });
    }
    if (resource === 'billing' && post) {
      administrator(user);
      const b = await body(req);
      if (action === 'verify' || key === 'verify') {
        const payment = await one(
          'SELECT institution_id FROM payments WHERE reference=?',
          str(b.reference),
        );
        requireValue(
          payment?.institution_id === user.institution_id,
          'Payment not found.',
          404,
        );
        return json(await verifyPayment(b.reference));
      }
      requireValue(
        runtime.PAYSTACK_SECRET_KEY,
        'Connect a Paystack account before accepting payments.',
        503,
      );
      const amount = Number(
        b.plan === 'teacher'
          ? runtime.TAS_TEACHER_AMOUNT_GHS
          : b.plan === 'college'
            ? runtime.TAS_COLLEGE_AMOUNT_GHS
            : 0,
      );
      requireValue(
        amount > 0 && Number.isSafeInteger(Math.round(amount * 100)),
        'The institution has not configured pricing.',
        503,
      );
      const reference = 'tas_' + id().replaceAll('-', '');
      await run(
        'INSERT INTO payments VALUES (?,?,?,?,?,?)',
        reference,
        user.institution_id,
        Math.round(amount * 100),
        b.plan,
        'pending',
        now(),
      );
      const response = await fetch(
        'https://api.paystack.co/transaction/initialize',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${runtime.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            amount: Math.round(amount * 100),
            currency: 'GHS',
            reference,
            callback_url: new URL('/?billing=verify', req.url).href,
            metadata: { institution_id: user.institution_id },
            channels: ['card', 'mobile_money'],
          }),
        },
      );
      const result = (await response.json()) as Row;
      requireValue(
        response.ok && result.status,
        'Unable to start payment. Please try again.',
        502,
      );
      requireValue(
        typeof result.data?.authorization_url === 'string' &&
          new URL(result.data.authorization_url).hostname ===
            'checkout.paystack.com',
        'Payment provider returned an invalid checkout URL.',
        502,
      );
      return json({ url: result.data.authorization_url });
    }
    throw new HttpError(404, 'This action is not available.');
  } catch (error) {
    if (error instanceof HttpError)
      return json({ error: error.message }, error.status);
    console.error(
      'AFC request failed',
      error instanceof Error ? error.message : 'Unknown error',
    );
    return json(
      {
        error:
          'Something went wrong. Please retry. If this continues, contact your institution administrator.',
      },
      500,
    );
  }
}
