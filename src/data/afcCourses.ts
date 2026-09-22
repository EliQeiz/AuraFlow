import type { AfcCourse } from '../types'

export const afcStarterCourses: Omit<AfcCourse, 'id'>[] = [
  {
    title: 'Frontend Engineering Foundations',
    slug: 'frontend-engineering-foundations',
    summary:
      'Build accessible, responsive interfaces with modern HTML, CSS, TypeScript, React, and real product review habits.',
    category: 'Software development',
    level: 'Beginner',
    priceGhs: 0,
    instructorName: 'AuraFlow Class',
    coverImage:
      'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=1600&q=85',
    published: true,
    estimatedHours: 18,
    outcomes: [
      'Plan responsive interface systems',
      'Build reusable React components',
      'Review accessibility and browser behaviour',
    ],
    lessons: [
      {
        id: 'interface-systems',
        title: 'Interface systems that hold together',
        summary: 'Tokens, hierarchy, layout constraints, and component boundaries.',
        durationMinutes: 42,
      },
      {
        id: 'react-production',
        title: 'React for production work',
        summary: 'State, routes, forms, loading states, and failure handling.',
        durationMinutes: 56,
      },
      {
        id: 'quality-review',
        title: 'Quality review',
        summary: 'Test an interface across devices before handing it to a client.',
        durationMinutes: 34,
      },
    ],
  },
  {
    title: 'Data Science for Decisions',
    slug: 'data-science-for-decisions',
    summary:
      'Move from raw operational data to trustworthy analysis, clear dashboards, and evidence-led decisions.',
    category: 'Data & analytics',
    level: 'Intermediate',
    priceGhs: 0,
    instructorName: 'AuraFlow Class',
    coverImage:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&q=85',
    published: true,
    estimatedHours: 22,
    outcomes: [
      'Frame useful business questions',
      'Clean and examine operational data',
      'Design dashboards that explain what changed',
    ],
    lessons: [
      {
        id: 'data-questions',
        title: 'Ask the question before opening the spreadsheet',
        summary: 'Define decisions, measures, owners, and useful time windows.',
        durationMinutes: 38,
      },
      {
        id: 'data-quality',
        title: 'Data quality and analysis',
        summary: 'Find gaps, duplicates, outliers, and misleading comparisons.',
        durationMinutes: 51,
      },
      {
        id: 'dashboard-story',
        title: 'Dashboard stories',
        summary: 'Turn metrics into a clear operational narrative.',
        durationMinutes: 44,
      },
    ],
  },
  {
    title: 'Practical AI and Prompt Engineering',
    slug: 'practical-ai-prompt-engineering',
    summary:
      'Use AI tools responsibly for research, drafting, analysis, and software work while keeping human judgment in control.',
    category: 'AI & machine learning',
    level: 'Beginner',
    priceGhs: 0,
    instructorName: 'AuraFlow Class',
    coverImage:
      'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1600&q=85',
    published: true,
    estimatedHours: 14,
    outcomes: [
      'Write structured prompts for real tasks',
      'Verify AI output before using it',
      'Build repeatable AI-assisted workflows',
    ],
    lessons: [
      {
        id: 'briefing-ai',
        title: 'Briefing an AI system well',
        summary: 'Context, constraints, examples, and a useful definition of done.',
        durationMinutes: 36,
      },
      {
        id: 'evaluation',
        title: 'Evaluate, challenge, and improve output',
        summary: 'Practical checks for factual, technical, and brand quality.',
        durationMinutes: 41,
      },
      {
        id: 'responsible-workflows',
        title: 'Responsible workflows',
        summary: 'Privacy, attribution, review, and the limits of automation.',
        durationMinutes: 31,
      },
    ],
  },
]
