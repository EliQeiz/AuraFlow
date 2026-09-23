import type { AfcCourse, AfcLesson } from '../types'

const instructor = 'AuraFlow Class'

function lesson(id: string, moduleTitle: string, title: string, summary: string, durationMinutes: number, videoUrl?: string): AfcLesson {
  return { id, moduleTitle, title, summary, durationMinutes, ...(videoUrl ? { videoUrl } : {}) }
}

export const afcStarterCourses: Omit<AfcCourse, 'id'>[] = [
  {
    title: 'Python Programming', slug: 'python-programming',
    summary: 'Build a sound Python foundation through practical scripts, data handling, testing, and a small automation project.',
    category: 'Software development', level: 'Beginner', priceGhs: 0, instructorName: instructor,
    coverImage: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=1600&q=85', published: true, estimatedHours: 24,
    outcomes: ['Write readable Python programs', 'Work safely with files, functions, and data structures', 'Test small programs and explain trade-offs'],
    lessons: [
      lesson('python-orientation', '1. Foundations', 'How Python programs run', 'Set up a focused practice workflow and trace values through a small script.', 35, 'https://www.youtube.com/watch?v=rfscVS0vtbw'),
      lesson('python-data', '1. Foundations', 'Values, collections, and control flow', 'Choose useful structures and make decisions without tangled conditional logic.', 50),
      lesson('python-functions', '2. Reusable programs', 'Functions and modules', 'Break a task into well-named functions with clear inputs and outputs.', 48),
      lesson('python-files', '2. Reusable programs', 'Files and defensive input handling', 'Read, write, validate, and recover from ordinary file errors.', 52),
      lesson('python-testing', '3. Quality habits', 'Testing and debugging', 'Use small tests and useful error messages to improve confidence.', 44),
      lesson('python-project', '3. Quality habits', 'Project: operations helper', 'Plan a command-line helper that turns a messy input file into a clear report.', 60),
    ],
    assignments: [{ id: 'python-operations-helper', title: 'Build an operations helper', brief: 'Create a command-line Python tool that validates a small CSV or text input and produces a useful summary for a local business or school.', deliverables: ['Source code or repository link', 'Sample input and output', 'A short explanation of validation choices'], rubric: ['Correctness and error handling', 'Readability and structure', 'Usefulness of the output'] }],
  },
  {
    title: 'Machine Learning with Python', slug: 'machine-learning-with-python',
    summary: 'Learn to frame a prediction problem, prepare data, evaluate a baseline, and communicate model limits responsibly.',
    category: 'AI & machine learning', level: 'Intermediate', priceGhs: 0, instructorName: instructor,
    coverImage: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1600&q=85', published: true, estimatedHours: 28,
    outcomes: ['Frame a supervised learning problem', 'Prepare data without leaking evaluation information', 'Compare models with appropriate metrics'],
    lessons: [
      lesson('ml-problem-framing', '1. Problem framing', 'From business question to learning task', 'Define an outcome, usable data, decision owner, and a meaningful baseline.', 42, 'https://www.youtube.com/watch?v=hDKCxebp88A'),
      lesson('ml-data-splits', '1. Problem framing', 'Data splits and leakage', 'Separate training, validation, and test evidence before choosing a model.', 46),
      lesson('ml-preprocessing', '2. Practical modelling', 'Preprocessing pipelines', 'Handle missing values, categories, and scaling inside a reproducible workflow.', 54),
      lesson('ml-baselines', '2. Practical modelling', 'Baselines and first models', 'Compare a simple baseline with a first classification or regression model.', 48),
      lesson('ml-evaluation', '3. Evaluation and trust', 'Metrics, errors, and fairness checks', 'Read confusion matrices or error distributions without overstating confidence.', 50),
      lesson('ml-project', '3. Evaluation and trust', 'Project: decision support model', 'Document a small model and a recommendation for a non-technical stakeholder.', 60),
    ],
    assignments: [{ id: 'ml-decision-support', title: 'Decision-support model card', brief: 'Use a public, non-sensitive dataset to train and compare two models. Write a model card that explains intended use, evaluation method, limitations, and what a decision-maker should not infer.', deliverables: ['Notebook or repository link', 'Metric comparison', 'One-page model card'], rubric: ['Sound split and evaluation choices', 'Reproducible implementation', 'Honest limitations and communication'] }],
  },
  {
    title: 'Prompt Engineering', slug: 'prompt-engineering',
    summary: 'Design testable prompts and AI-assisted workflows while protecting private data and keeping human judgment accountable.',
    category: 'AI & machine learning', level: 'Beginner', priceGhs: 0, instructorName: instructor,
    coverImage: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1600&q=85', published: true, estimatedHours: 16,
    outcomes: ['Write structured prompts with useful constraints', 'Evaluate outputs with a repeatable rubric', 'Build safer AI-assisted task workflows'],
    lessons: [
      lesson('prompt-context', '1. Prompt foundations', 'Context, goal, and definition of done', 'Turn an ambiguous request into a prompt with an observable result.', 34, 'https://www.youtube.com/watch?v=DvhFcIRRXyI'),
      lesson('prompt-examples', '1. Prompt foundations', 'Examples, structure, and iteration', 'Use examples and delimiters to reduce ambiguity without making claims of certainty.', 38),
      lesson('prompt-evaluation', '2. Reliable workflows', 'Evaluation rubrics', 'Create checks for correctness, usefulness, tone, and citation requirements.', 42),
      lesson('prompt-privacy', '2. Reliable workflows', 'Privacy and sensitive information', 'Recognise information that should not be placed in a third-party AI prompt.', 35),
      lesson('prompt-automation', '3. Applied practice', 'Human-in-the-loop automation', 'Choose approval points before an AI output reaches a customer or production system.', 40),
      lesson('prompt-project', '3. Applied practice', 'Project: prompt playbook', 'Create a tested playbook for one real professional workflow.', 48),
    ],
    assignments: [{ id: 'prompt-playbook', title: 'Build a prompt playbook', brief: 'Design three prompts for one workflow such as client discovery, lesson planning, or data summarisation. Include success criteria, a privacy note, and a human review step for each.', deliverables: ['Three annotated prompts', 'Evaluation rubric', 'Example of a reviewed output'], rubric: ['Specific, testable instructions', 'Appropriate safety and privacy choices', 'Quality of the evaluation process'] }],
  },
  {
    title: 'Full Stack Development', slug: 'full-stack-development',
    summary: 'Plan and build a small full-stack product with accessible interfaces, API boundaries, persistence, authentication awareness, and deployment checks.',
    category: 'Software development', level: 'Intermediate', priceGhs: 0, instructorName: instructor,
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1600&q=85', published: true, estimatedHours: 32,
    outcomes: ['Design client and server responsibilities', 'Build and document a small API', 'Ship an accessible interface with basic security checks'],
    lessons: [
      lesson('fullstack-architecture', '1. Product architecture', 'Map the product before the framework', 'Identify users, workflows, data boundaries, and failure states before implementation.', 45, 'https://www.youtube.com/watch?v=nu_pCVPKzTk'),
      lesson('fullstack-ui', '1. Product architecture', 'Accessible client interfaces', 'Create a responsive interface with forms, validation, loading, and empty states.', 55),
      lesson('fullstack-api', '2. Server and data', 'API contracts and validation', 'Define server-owned validation, clear error responses, and useful status codes.', 58),
      lesson('fullstack-data', '2. Server and data', 'Persistence and identity boundaries', 'Model records and access rules so one account cannot read another account’s data.', 55),
      lesson('fullstack-release', '3. Delivery', 'Release and observability basics', 'Prepare environment variables, deployment checks, and a useful failure report.', 44),
      lesson('fullstack-project', '3. Delivery', 'Project: service request portal', 'Build a small client request workflow from interface to protected data record.', 70),
    ],
    assignments: [{ id: 'fullstack-service-portal', title: 'Ship a service request portal', brief: 'Create a small full-stack request portal with authenticated users, validation, private records, and a status view. Do not use real customer data.', deliverables: ['Live demo or repository', 'API and data model notes', 'Security and testing checklist'], rubric: ['Clear product workflow', 'Private access boundaries', 'Quality, accessibility, and deployment readiness'] }],
  },
  {
    title: 'Software Development Foundations', slug: 'software-development-foundations',
    summary: 'Develop durable engineering habits: requirements, version control, testing, code review, secure delivery, and practical technical communication.',
    category: 'Software development', level: 'Beginner', priceGhs: 0, instructorName: instructor,
    coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&q=85', published: true, estimatedHours: 20,
    outcomes: ['Turn a brief into a buildable plan', 'Use version control and review habits effectively', 'Test, document, and communicate software changes'],
    lessons: [
      lesson('software-briefs', '1. Engineering thinking', 'Requirements that can be built', 'Separate user needs, constraints, acceptance criteria, and open questions.', 36, 'https://www.youtube.com/watch?v=RGOj5yH7evk'),
      lesson('software-version-control', '1. Engineering thinking', 'Version control as team communication', 'Use commits, branches, reviews, and issue descriptions to make changes understandable.', 46),
      lesson('software-testing', '2. Quality systems', 'Test strategy and regression risk', 'Choose useful unit, integration, and end-to-end checks for a change.', 48),
      lesson('software-security', '2. Quality systems', 'Secure-by-default development', 'Protect secrets, validate inputs, and keep privileges narrow by design.', 45),
      lesson('software-review', '3. Professional delivery', 'Code review and technical communication', 'Give feedback that finds risks and helps a teammate act on it.', 38),
      lesson('software-project', '3. Professional delivery', 'Project: delivery plan and change set', 'Prepare a small feature plan, test evidence, and a concise release note.', 55),
    ],
    assignments: [{ id: 'software-change-set', title: 'Prepare a production-ready change set', brief: 'Choose a small feature, write acceptance criteria, plan the implementation, record test evidence, and prepare a concise release note. A mock project is fine.', deliverables: ['Feature brief and acceptance criteria', 'Change plan with test cases', 'Release note and risk note'], rubric: ['Clarity of requirements', 'Appropriate testing and security thinking', 'Professional technical communication'] }],
  },
]
