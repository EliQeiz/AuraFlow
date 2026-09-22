import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
  index,
} from 'drizzle-orm/sqlite-core';

export const institutions = sqliteTable('institutions', {
  id: text().primaryKey(),
  name: text().notNull(),
  semester: text().notNull(),
  plan: text().notNull().default('pilot'),
  paidUntil: integer('paid_until').notNull().default(0),
});
export const users = sqliteTable(
  'users',
  {
    id: text().primaryKey(),
    institutionId: text('institution_id')
      .notNull()
      .references(() => institutions.id),
    name: text().notNull(),
    email: text().notNull().unique(),
    role: text().notNull(),
    passwordHash: text('password_hash'),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [
    index('idx_users_institution_role_name').on(
      t.institutionId,
      t.role,
      t.name,
    ),
  ],
);
export const sessions = sqliteTable(
  'sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    expiresAt: integer('expires_at').notNull(),
  },
  (t) => [index('idx_sessions_user_expiry').on(t.userId, t.expiresAt)],
);
export const courses = sqliteTable(
  'courses',
  {
    id: text().primaryKey(),
    institutionId: text('institution_id')
      .notNull()
      .references(() => institutions.id),
    teacherId: text('teacher_id')
      .notNull()
      .references(() => users.id),
    title: text().notNull(),
    code: text().notNull(),
    description: text().notNull(),
    color: text().notNull(),
    level: text().notNull().default('beginner'),
    priceGhs: integer('price_ghs').notNull().default(0),
    youtubePlaylistId: text('youtube_playlist_id'),
    certificateEnabled: integer('certificate_enabled').notNull().default(1),
    published: integer().notNull().default(0),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [
    index('idx_courses_institution_teacher').on(t.institutionId, t.teacherId),
  ],
);
export const enrollments = sqliteTable(
  'enrollments',
  {
    id: text().primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    active: integer().notNull().default(1),
  },
  (t) => [uniqueIndex('enrollment_unique').on(t.courseId, t.userId)],
);
export const invitations = sqliteTable('invitations', {
  tokenHash: text('token_hash').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  expiresAt: integer('expires_at').notNull(),
  usedAt: integer('used_at'),
});
export const modules = sqliteTable(
  'modules',
  {
    id: text().primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id),
    title: text().notNull(),
    position: integer().notNull(),
    published: integer().notNull().default(0),
  },
  (t) => [uniqueIndex('module_position').on(t.courseId, t.position)],
);
export const lessons = sqliteTable('lessons', {
  id: text().primaryKey(),
  moduleId: text('module_id')
    .notNull()
    .references(() => modules.id),
  title: text().notNull(),
  kind: text().notNull(),
  content: text().notNull(),
  fileKey: text('file_key'),
  fileName: text('file_name'),
  captionsKey: text('captions_key'),
  captionsName: text('captions_name'),
  position: integer().notNull(),
});
export const completions = sqliteTable(
  'completions',
  {
    id: text().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    lessonId: text('lesson_id')
      .notNull()
      .references(() => lessons.id),
    completedAt: integer('completed_at').notNull(),
  },
  (t) => [uniqueIndex('completion_unique').on(t.userId, t.lessonId)],
);
export const assessments = sqliteTable('assessments', {
  id: text().primaryKey(),
  moduleId: text('module_id')
    .notNull()
    .references(() => modules.id),
  title: text().notNull(),
  kind: text().notNull(),
  instructions: text().notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  passMark: integer('pass_mark').notNull(),
  maxAttempts: integer('max_attempts').notNull(),
  dueAt: integer('due_at'),
  published: integer().notNull().default(0),
  questions: text().notNull(),
  integrityMode: text('integrity_mode').notNull().default('standard'),
});
export const attempts = sqliteTable(
  'attempts',
  {
    id: text().primaryKey(),
    assessmentId: text('assessment_id')
      .notNull()
      .references(() => assessments.id),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    number: integer().notNull(),
    startedAt: integer('started_at').notNull(),
    deadline: integer().notNull(),
    submittedAt: integer('submitted_at'),
    status: text().notNull(),
    questions: text().notNull(),
    answers: text().notNull().default('{}'),
    score: integer(),
    passed: integer().notNull().default(0),
    released: integer().notNull().default(0),
    feedback: text().notNull().default(''),
    textSubmission: text('text_submission').notNull().default(''),
    fileKey: text('file_key'),
    fileName: text('file_name'),
    revision: integer().notNull().default(0),
    changeActor: text('change_actor').references(() => users.id),
    changeReason: text('change_reason').notNull().default(''),
  },
  (t) => [uniqueIndex('attempt_number').on(t.assessmentId, t.userId, t.number)],
);
export const audit = sqliteTable('audit', {
  id: text().primaryKey(),
  institutionId: text('institution_id')
    .notNull()
    .references(() => institutions.id),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  action: text().notNull(),
  detail: text().notNull(),
  createdAt: integer('created_at').notNull(),
});
export const payments = sqliteTable('payments', {
  reference: text().primaryKey(),
  institutionId: text('institution_id')
    .notNull()
    .references(() => institutions.id),
  amount: integer().notNull(),
  plan: text().notNull(),
  status: text().notNull(),
  createdAt: integer('created_at').notNull(),
});
export const rateLimits = sqliteTable('rate_limits', {
  key: text().primaryKey(),
  count: integer().notNull(),
  resetAt: integer('reset_at').notNull(),
});

export const accountControls = sqliteTable('account_controls', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id),
  suspended: integer().notNull().default(0),
  reason: text().notNull(),
  updatedBy: text('updated_by')
    .notNull()
    .references(() => users.id),
  updatedAt: integer('updated_at').notNull(),
});
export const sessionDetails = sqliteTable('session_details', {
  id: text().primaryKey(),
  tokenHash: text('token_hash')
    .notNull()
    .unique()
    .references(() => sessions.tokenHash, { onDelete: 'cascade' }),
  createdAt: integer('created_at').notNull(),
  device: text().notNull(),
});
export const departments = sqliteTable(
  'departments',
  {
    id: text().primaryKey(),
    institutionId: text('institution_id')
      .notNull()
      .references(() => institutions.id),
    name: text().notNull(),
    code: text().notNull(),
  },
  (t) => [uniqueIndex('department_code').on(t.institutionId, t.code)],
);
export const academicTerms = sqliteTable(
  'academic_terms',
  {
    id: text().primaryKey(),
    institutionId: text('institution_id')
      .notNull()
      .references(() => institutions.id),
    name: text().notNull(),
    startsOn: text('starts_on').notNull(),
    endsOn: text('ends_on').notNull(),
  },
  (t) => [uniqueIndex('term_name').on(t.institutionId, t.name)],
);
export const courseAllocations = sqliteTable('course_allocations', {
  courseId: text('course_id')
    .primaryKey()
    .references(() => courses.id),
  departmentId: text('department_id').references(() => departments.id),
  termId: text('term_id').references(() => academicTerms.id),
  revision: integer().notNull().default(1),
});
export const gradeHistory = sqliteTable(
  'grade_history',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    attemptId: text('attempt_id')
      .notNull()
      .references(() => attempts.id),
    revision: integer().notNull(),
    actorId: text('actor_id').references(() => users.id),
    reason: text().notNull(),
    oldScore: integer('old_score'),
    newScore: integer('new_score'),
    oldReleased: integer('old_released'),
    newReleased: integer('new_released').notNull(),
    oldFeedback: text('old_feedback'),
    newFeedback: text('new_feedback').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [uniqueIndex('grade_history_revision').on(t.attemptId, t.revision)],
);

export const assessmentIntegrityEvents = sqliteTable(
  'assessment_integrity_events',
  {
    id: text().primaryKey(),
    attemptId: text('attempt_id')
      .notNull()
      .references(() => attempts.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    eventType: text('event_type').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [index('idx_integrity_attempt_created').on(t.attemptId, t.createdAt)],
);

export const courseCertificates = sqliteTable(
  'course_certificates',
  {
    id: text().primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    certificateCode: text('certificate_code').notNull().unique(),
    issuedAt: integer('issued_at').notNull(),
    revokedAt: integer('revoked_at'),
  },
  (t) => [uniqueIndex('certificate_course_learner').on(t.courseId, t.userId)],
);

export const courseOrders = sqliteTable(
  'course_orders',
  {
    reference: text().primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    amount: integer().notNull(),
    status: text().notNull(),
    createdAt: integer('created_at').notNull(),
    paidAt: integer('paid_at'),
  },
  (t) => [
    index('idx_course_orders_learner').on(t.userId, t.createdAt),
    index('idx_course_orders_course').on(t.courseId, t.status),
  ],
);
