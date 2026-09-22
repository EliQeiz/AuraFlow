import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pbkdf2Sync, randomBytes } from 'node:crypto';
if (process.env.NODE_ENV === 'production')
  throw new Error('Sample accounts are restricted to local development.');
const salt = randomBytes(32).toString('hex');
const hash = `pbkdf2:100000:${salt}:${pbkdf2Sync('TAS-local-pilot-2026!', salt, 100000, 32, 'sha256').toString('hex')}`;
const time = Date.now(),
  due = time + 7 * 86400000;
const quote = (value) =>
  value === null
    ? 'NULL'
    : typeof value === 'number'
      ? String(value)
      : `'${String(value).replaceAll("'", "''")}'`;
const rows = [];
const insert = (table, columns, values) =>
  rows.push(
    `INSERT OR IGNORE INTO ${table} (${columns}) VALUES (${values.map(quote).join(',')});`,
  );
insert('institutions', 'id,name,semester', [
  'pilot',
  'Adansi College · Demo',
  '2026/2027 · Semester 1',
]);
for (const [uid, name, email, role] of [
  ['lecturer', 'Ama Mensah', 'lecturer@tas.local', 'admin'],
  ['student', 'Kofi Asante', 'student@tas.local', 'student'],
  ['student2', 'Abena Owusu', 'abena@tas.local', 'student'],
  ['student3', 'Kwame Boateng', 'kwame@tas.local', 'student'],
  ['student4', 'Akosua Osei', 'akosua@tas.local', 'student'],
  ['teacher2', 'Yaw Ofori', 'yaw@tas.local', 'teacher'],
])
  insert(
    'users',
    'id,institution_id,name,email,role,password_hash,created_at',
    [uid, 'pilot', name, email, role, hash, time],
  );
for (const [cid, title, code, description, color, published] of [
  [
    'cs101',
    'Introduction to Computer Science',
    'CS 101',
    'Build a foundation in computational thinking, algorithms, and problem solving.',
    'blue',
    1,
  ],
  [
    'edu201',
    'Principles of Teaching & Learning',
    'EDU 201',
    'Connect learning theory with inclusive, effective classroom practice.',
    'orange',
    1,
  ],
  [
    'res102',
    'Academic Writing & Research',
    'RES 102',
    'Ask better questions. Develop evidence-based arguments and research skills.',
    'purple',
    0,
  ],
])
  insert(
    'courses',
    'id,institution_id,teacher_id,title,code,description,color,published,created_at',
    [
      cid,
      'pilot',
      'lecturer',
      title,
      code,
      description,
      color,
      published,
      time,
    ],
  );
for (const cid of ['cs101', 'edu201', 'res102'])
  for (const uid of ['student', 'student2', 'student3', 'student4'])
    insert('enrollments', 'id,course_id,user_id,active', [
      `${cid}-${uid}`,
      cid,
      uid,
      1,
    ]);
for (const [mid, cid, title, position, published] of [
  ['cs-foundations', 'cs101', 'Computational thinking', 1, 1],
  ['cs-algorithms', 'cs101', 'Algorithms in practice', 2, 1],
  ['edu-foundations', 'edu201', 'How people learn', 1, 1],
  ['research-start', 'res102', 'Finding your research question', 1, 0],
])
  insert('modules', 'id,course_id,title,position,published', [
    mid,
    cid,
    title,
    position,
    published,
  ]);
const lessons = [
  [
    'cs-intro',
    'cs-foundations',
    'Thinking like a computer scientist',
    'note',
    'Learning outcomes\nBy the end of this lesson, you will be able to describe an algorithm, explain decomposition, and distinguish input from output.\n\nAn algorithm is a finite sequence of clear steps for solving a problem. A recipe, a set of directions, and instructions for calculating a class average are familiar examples.\n\nDecomposition means breaking a complex problem into smaller, manageable parts. To create a student result report, we can separate collecting marks, calculating totals, assigning grades, and presenting results.\n\nInput is the information a system receives; output is what it produces. In an average calculator, the marks are inputs and the calculated average is the output.\n\nReflect\nChoose a familiar task from college life. Write five clear steps that another person could follow to complete it.',
  ],
  [
    'cs-example',
    'cs-foundations',
    'Worked example: calculating an average',
    'note',
    'A class has three assessment scores: 60, 75, and 90.\n\n1. Receive the three scores as inputs.\n2. Add the scores: 60 + 75 + 90 = 225.\n3. Count the scores: 3.\n4. Divide the total by the count: 225 ÷ 3 = 75.\n5. Display the average: 75.\n\nNotice that every step is explicit. The algorithm will terminate after a finite number of steps.\n\nPractice\nRepeat these steps for 40, 65, and 75. How would you adapt the steps for a class of 30 students?',
  ],
  [
    'cs-next',
    'cs-algorithms',
    'From instructions to pseudocode',
    'note',
    'You have unlocked the next module.\n\nPseudocode expresses an algorithm in structured, human-readable steps without requiring a particular programming language.\n\nINPUT first_score, second_score\ntotal ← first_score + second_score\naverage ← total / 2\nOUTPUT average\n\nWrite pseudocode that checks whether a student meets a pass mark of 70.',
  ],
  [
    'edu-intro',
    'edu-foundations',
    'Learning starts with the learner',
    'note',
    'Learning involves connecting new knowledge to existing understanding. Effective teaching makes learning goals explicit, provides opportunities to practise, and uses feedback to guide improvement.\n\nConsider a concept you found difficult to learn. What helped you understand it? How could you offer that support to students with different prior experiences?\n\nActivity\nWrite a short example of how you would check understanding during a lesson.',
  ],
  [
    'research-intro',
    'research-start',
    'What makes a useful research question?',
    'note',
    'A useful research question is focused, feasible, and open to investigation through evidence. Start with a topic, identify a specific problem, and consider what evidence you could realistically gather.',
  ],
];
for (const [i, l] of lessons.entries())
  insert('lessons', 'id,module_id,title,kind,content,position', [...l, i + 1]);
const questions = [
  {
    id: 'q1',
    prompt: 'What is an algorithm?',
    options: [
      'A finite sequence of clear steps for solving a problem',
      'A type of computer monitor',
      'A random list of numbers',
      'An internet connection',
    ],
    correct: 0,
  },
  {
    id: 'q2',
    prompt: 'What does decomposition mean in computational thinking?',
    options: [
      'Breaking a complex problem into smaller parts',
      'Deleting a program',
      'Combining all problems into one step',
      'Guessing an answer',
    ],
    correct: 0,
  },
  {
    id: 'q3',
    prompt: 'In an average calculator, what are the assessment scores?',
    options: ['Inputs', 'Outputs', 'Errors', 'Instructions'],
    correct: 0,
  },
];
insert(
  'assessments',
  'id,module_id,title,kind,instructions,duration_minutes,pass_mark,max_attempts,due_at,published,questions',
  [
    'cs-checkpoint',
    'cs-foundations',
    'Computational thinking checkpoint',
    'quiz',
    'Answer all three questions. Complete the readings before starting. You need 70% to unlock Algorithms in practice.',
    15,
    70,
    3,
    due,
    1,
    JSON.stringify(questions),
  ],
);
insert(
  'assessments',
  'id,module_id,title,kind,instructions,duration_minutes,pass_mark,max_attempts,due_at,published,questions',
  [
    'edu-reflection',
    'edu-foundations',
    'Design a learning activity',
    'assignment',
    'Design a 15-minute learning activity for a topic you teach. Include the learning outcome, a practice task, and how you will check understanding.',
    30,
    60,
    2,
    due,
    1,
    '[]',
  ],
);
insert(
  'attempts',
  'id,assessment_id,user_id,number,started_at,deadline,submitted_at,status,questions,text_submission',
  [
    'demo-submission',
    'edu-reflection',
    'student2',
    1,
    time - 86400000,
    due,
    time - 3600000,
    'submitted',
    '[]',
    'Learning outcome: learners will identify three features of a strong research question.\n\nStudents compare two example questions in pairs, discuss which is easier to investigate, and rewrite the weaker example. Each pair then shares one improvement.\n\nAn exit ticket asks each learner to write a focused question and explain what evidence would answer it.',
  ],
);
insert('audit', 'id,institution_id,user_id,action,detail,created_at', [
  'pilot-created',
  'pilot',
  'lecturer',
  'Pilot workspace prepared',
  'Fictional sample records for exploring TAS. No real student records.',
  time,
]);
writeFileSync('local-seed.sql', rows.join('\n'));
const result = spawnSync(
  process.execPath,
  [
    'node_modules/wrangler/bin/wrangler.js',
    'd1',
    'execute',
    'DB',
    '--local',
    '--config',
    'wrangler.local.json',
    '--file',
    'local-seed.sql',
  ],
  { stdio: 'inherit', env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } },
);
process.exitCode = result.status || 0;
