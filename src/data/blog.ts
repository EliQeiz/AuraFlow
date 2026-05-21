import { IMAGES } from '../lib/images'
import elishaAfariPhoto from '../assets/images/elisha-afari.jpg'
import type { BlogPost } from '../types'

const author = {
  name: 'Elisha Afari',
  role: 'AuraFlow Studio',
  avatar: elishaAfariPhoto,
}

export const seedPosts: BlogPost[] = [
  {
    id: 'post-1',
    slug: 'firebase-launch-checklist',
    title: 'A Firebase Launch Checklist for Client Apps',
    excerpt: 'Rules, environments, indexes, storage, and monitoring are easier to fix before launch day.',
    category: 'Firebase',
    coverImage: IMAGES.blog.firebase,
    author,
    publishedAt: '2026-04-08',
    readTime: '7 min read',
    content: `## Start with the data contract
Firestore gets easier when collections answer a real product question. Define ownership, timestamps, and the smallest query shape each page needs before adding rules.

## Protect the surfaces
Auth success is not authorization. Test denied reads, uploads, deletes, and anonymous traffic before production.

\`\`\`ts
match /projects/{projectId} {
  allow read: if request.auth != null
    && resource.data.userId == request.auth.uid;
}
\`\`\`

## Leave a release trail
Keep environment variables, deploy notes, index changes, and support contacts in the handoff so the next iteration starts calmly.`,
  },
  {
    id: 'post-2',
    slug: 'designing-mobile-quote-flows',
    title: 'Designing Quote Flows People Finish on Mobile',
    excerpt: 'A good wizard lowers ambiguity without hiding cost, urgency, or contact details.',
    category: 'Mobile',
    coverImage: IMAGES.blog.mobile,
    author,
    publishedAt: '2026-03-19',
    readTime: '5 min read',
    content: `## Ask one decision at a time
A project intake is not a database schema. Use large choices early, reveal detail later, and keep progress visible.

## Preserve momentum
Budget and timeline controls should be precise enough to qualify the lead and quick enough to use with one thumb.

## Review before submit
A final review step catches errors and gives the client confidence about what will be sent.`,
  },
  {
    id: 'post-3',
    slug: 'agency-sites-that-scan',
    title: 'Agency Sites That Scan Before They Dazzle',
    excerpt: 'Motion matters more when hierarchy, contrast, and proof already make the page easy to read.',
    category: 'Design',
    coverImage: IMAGES.blog.design,
    author,
    publishedAt: '2026-02-27',
    readTime: '6 min read',
    content: `## Make the offer visible
The first viewport should say what is built, who it helps, and where to act.

## Put proof near decisions
Testimonials, screenshots, stats, and process steps work when they answer doubt at the moment it appears.

## Animate meaning
Use transitions to connect state changes and hierarchy. Decoration alone gets old quickly.`,
  },
  {
    id: 'post-4',
    slug: 'ai-features-with-guardrails',
    title: 'AI Features Need Product Guardrails',
    excerpt: 'The useful question is rarely which model. It is where a prediction or generation earns trust.',
    category: 'AI & ML',
    coverImage: IMAGES.blog.ai,
    author,
    publishedAt: '2026-02-03',
    readTime: '8 min read',
    content: `## Tie output to a workflow
An assistant should shorten a real task: triage a lead, draft a summary, or search a knowledge base.

## Evaluate before polish
Build examples, edge cases, fallback states, and human review before shipping a glossy prompt box.

## Instrument the result
Track usage, correction, latency, and exits so the feature can improve after launch.`,
  },
  {
    id: 'post-5',
    slug: 'template-to-product',
    title: 'From Template to Product Without Starting Over',
    excerpt: 'A template should buy time on structure while leaving room for real brand and data work.',
    category: 'Business',
    coverImage: IMAGES.templates.tech,
    author,
    publishedAt: '2026-01-18',
    readTime: '4 min read',
    content: `## Reuse strong structure
Navigation, service blocks, trust proof, and contact flows do not need to be invented for every launch.

## Customize the edges
Voice, offers, forms, data, motion, and business rules create the product shape that matters.`,
  },
  {
    id: 'post-6',
    slug: 'dashboard-case-study',
    title: 'Case Study: One Operations Dashboard, Fewer Meetings',
    excerpt: 'Filters, statuses, and a focused activity feed replaced slow status chasing.',
    category: 'Case Studies',
    coverImage: IMAGES.services.dataAnalytics,
    author,
    publishedAt: '2025-12-12',
    readTime: '9 min read',
    content: `## The problem
Every team member had a different view of delivery status, and weekly reporting arrived late.

## The build
AuraFlow shaped a dashboard around status, owner, deadlines, and exception views.

## The outcome
Managers could answer priority questions without collecting manual updates first.`,
  },
]
