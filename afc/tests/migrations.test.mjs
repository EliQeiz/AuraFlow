import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

function upgradedDatabase() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys=ON');
  for (const name of [
    '0000_complex_norrin_radd.sql',
    '0001_typical_lockheed.sql',
  ])
    db.exec(
      readFileSync(new URL(`../drizzle/${name}`, import.meta.url), 'utf8'),
    );
  db.exec(`
    INSERT INTO institutions(id,name,semester) VALUES ('college','Existing college','Existing term');
    INSERT INTO users VALUES ('teacher','college','Teacher','teacher@example.test','admin','existing-hash',1);
    INSERT INTO sessions VALUES ('existing-session','teacher',9999999999999);
    INSERT INTO courses VALUES ('course','college','teacher','Existing course','CS1','Original course','blue',1,1);
    INSERT INTO modules VALUES ('module','course','Module',1,1);
    INSERT INTO assessments VALUES ('assessment','module','Assessment','assignment','Write',30,50,2,NULL,1,'[]');
    INSERT INTO attempts(id,assessment_id,user_id,number,started_at,deadline,status,questions,score,feedback,released)
    VALUES ('attempt','assessment','teacher',1,1,2,'graded','[]',80,'Original feedback',1);
  `);
  for (const name of [
    '0002_ambiguous_menace.sql',
    '0003_mature_maria_hill.sql',
    '0004_afc_learning_integrity.sql',
    '0005_afc_course_orders.sql',
  ])
    db.exec(
      readFileSync(new URL(`../drizzle/${name}`, import.meta.url), 'utf8'),
    );
  return db;
}
test('institution upgrade preserves existing accounts, sessions, classrooms and grades', () => {
  const db = upgradedDatabase();
  try {
    assert.equal(
      db.prepare('SELECT password_hash FROM users').get().password_hash,
      'existing-hash',
    );
    assert.equal(db.prepare('SELECT count(*) n FROM sessions').get().n, 1);
    assert.equal(
      db.prepare('SELECT title FROM courses').get().title,
      'Existing course',
    );
    const attempt = db
      .prepare('SELECT score,feedback,released,revision FROM attempts')
      .get();
    assert.deepEqual(
      { ...attempt },
      { score: 80, feedback: 'Original feedback', released: 1, revision: 0 },
    );
    assert.equal(db.prepare('SELECT count(*) n FROM grade_history').get().n, 0);
  } finally {
    db.close();
  }
});
test('grade and history commit together and roll back together on a constraint failure', () => {
  const db = upgradedDatabase();
  try {
    db.exec(
      "UPDATE attempts SET score=90,feedback='Reviewed',released=0,change_actor='teacher',change_reason='Moderation' WHERE id='attempt'",
    );
    const history = db.prepare('SELECT * FROM grade_history').get();
    assert.equal(history.old_score, 80);
    assert.equal(history.new_score, 90);
    assert.equal(history.actor_id, 'teacher');
    assert.equal(history.reason, 'Moderation');
    assert.equal(db.prepare('SELECT revision FROM attempts').get().revision, 1);
    assert.throws(
      () =>
        db.exec(
          "UPDATE attempts SET score=20,change_actor='missing-user' WHERE id='attempt'",
        ),
      /FOREIGN KEY/,
    );
    assert.equal(db.prepare('SELECT score FROM attempts').get().score, 90);
    assert.equal(db.prepare('SELECT count(*) n FROM grade_history').get().n, 1);
  } finally {
    db.close();
  }
});
test('session metadata follows revocation and common administration queries use indexes', () => {
  const db = upgradedDatabase();
  try {
    db.exec(
      "INSERT INTO session_details VALUES ('display-id','existing-session',1,'Test browser'); DELETE FROM sessions WHERE token_hash='existing-session'; PRAGMA optimize;",
    );
    assert.equal(
      db.prepare('SELECT count(*) n FROM session_details').get().n,
      0,
    );
    assert.match(
      db
        .prepare(
          "EXPLAIN QUERY PLAN SELECT * FROM sessions WHERE user_id='teacher' AND expires_at>1",
        )
        .get().detail,
      /idx_sessions_user_expiry/,
    );
    assert.match(
      db
        .prepare(
          "EXPLAIN QUERY PLAN SELECT id,name FROM users WHERE institution_id='college' ORDER BY role,name",
        )
        .get().detail,
      /idx_users_institution_role_name/,
    );
  } finally {
    db.close();
  }
});
test('AFC migration adds course catalog, certificate, and integrity records', () => {
  const db = upgradedDatabase();
  try {
    const course = db
      .prepare('SELECT level,price_ghs,certificate_enabled FROM courses')
      .get();
    assert.deepEqual({ ...course }, {
      level: 'beginner',
      price_ghs: 0,
      certificate_enabled: 1,
    });
    db.exec(
      "INSERT INTO assessment_integrity_events VALUES ('event','attempt','teacher','focus_lost',1); INSERT INTO course_certificates(id,course_id,user_id,certificate_code,issued_at) VALUES ('certificate','course','teacher','AFC-CS1-TEST',1);",
    );
    assert.equal(
      db.prepare('SELECT count(*) n FROM assessment_integrity_events').get().n,
      1,
    );
    assert.equal(
      db.prepare('SELECT count(*) n FROM course_certificates').get().n,
      1,
    );
    db.exec(
      "INSERT INTO course_orders(reference,course_id,user_id,amount,status,created_at) VALUES ('order','course','teacher',1000,'pending',1);",
    );
    assert.equal(
      db.prepare('SELECT count(*) n FROM course_orders').get().n,
      1,
    );
  } finally {
    db.close();
  }
});
