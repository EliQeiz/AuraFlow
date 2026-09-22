import { DatabaseSync } from 'node:sqlite';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// This script removes only named integration fixtures from the local pilot.
const directory = resolve('.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
const files = readdirSync(directory).filter((name) =>
  /^[a-f0-9]+\.sqlite$/.test(name),
);
if (files.length !== 1) throw new Error('Expected one local pilot database.');
const db = new DatabaseSync(resolve(directory, files[0]));
try {
  if (
    !db
      .prepare(
        "SELECT id FROM users WHERE id='lecturer' AND email='lecturer@tas.local'",
      )
      .get()
  )
    throw new Error('Local sample account not found. Refusing cleanup.');
  const fixtures = db
    .prepare(
      "SELECT id FROM courses WHERE (code LIKE 'QA-%' AND title LIKE 'Verification %' AND description='Integration verification fixture') OR (code LIKE 'PAY-%' AND title LIKE 'Paid course %' AND description='Course payment verification fixture')",
    )
    .all();
  db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; BEGIN;');
  for (const fixture of fixtures) {
    db.prepare(
      'DELETE FROM assessment_integrity_events WHERE attempt_id IN (SELECT t.id FROM attempts t JOIN assessments a ON a.id=t.assessment_id JOIN modules m ON m.id=a.module_id WHERE m.course_id=?)',
    ).run(fixture.id);
    db.prepare(
      'DELETE FROM grade_history WHERE attempt_id IN (SELECT t.id FROM attempts t JOIN assessments a ON a.id=t.assessment_id JOIN modules m ON m.id=a.module_id WHERE m.course_id=?)',
    ).run(fixture.id);
    db.prepare('DELETE FROM course_allocations WHERE course_id=?').run(
      fixture.id,
    );
    db.prepare('DELETE FROM course_certificates WHERE course_id=?').run(
      fixture.id,
    );
    db.prepare('DELETE FROM course_orders WHERE course_id=?').run(fixture.id);
    db.prepare(
      'DELETE FROM attempts WHERE assessment_id IN (SELECT a.id FROM assessments a JOIN modules m ON m.id=a.module_id WHERE m.course_id=?)',
    ).run(fixture.id);
    db.prepare(
      'DELETE FROM completions WHERE lesson_id IN (SELECT l.id FROM lessons l JOIN modules m ON m.id=l.module_id WHERE m.course_id=?)',
    ).run(fixture.id);
    db.prepare(
      'DELETE FROM lessons WHERE module_id IN (SELECT id FROM modules WHERE course_id=?)',
    ).run(fixture.id);
    db.prepare(
      'DELETE FROM assessments WHERE module_id IN (SELECT id FROM modules WHERE course_id=?)',
    ).run(fixture.id);
    db.prepare('DELETE FROM modules WHERE course_id=?').run(fixture.id);
    db.prepare('DELETE FROM enrollments WHERE course_id=?').run(fixture.id);
    db.prepare('DELETE FROM courses WHERE id=?').run(fixture.id);
  }
  const invitees = db
    .prepare(
      "SELECT id FROM users WHERE name='Invited student' AND email LIKE 'invite-%@tas.local' AND NOT EXISTS(SELECT 1 FROM enrollments e WHERE e.user_id=users.id)",
    )
    .all();
  for (const user of invitees) {
    db.prepare('DELETE FROM account_controls WHERE user_id=?').run(user.id);
    db.prepare('DELETE FROM invitations WHERE user_id=?').run(user.id);
    db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);
    db.prepare('DELETE FROM users WHERE id=?').run(user.id);
  }
  db.exec(
    "UPDATE users SET institution_id='pilot',role='teacher' WHERE id='teacher2' AND email='yaw@tas.local'; DELETE FROM rate_limits; DELETE FROM departments WHERE (code LIKE 'QA-%' AND name LIKE 'QA department %') OR (id LIKE 'foreign-%' AND name='Foreign department' AND institution_id LIKE 'tenant-%'); DELETE FROM academic_terms WHERE name LIKE 'QA term %'; DELETE FROM institutions WHERE id LIKE 'tenant-%' AND name='Isolated fixture' AND NOT EXISTS(SELECT 1 FROM users WHERE institution_id=institutions.id); COMMIT;",
  );
  console.log(
    `Removed ${fixtures.length} integration classrooms and ${invitees.length} test invitation accounts. Sample teaching records were preserved.`,
  );
} catch (error) {
  try {
    db.exec('ROLLBACK;');
  } catch {}
  throw error;
} finally {
  db.close();
}
