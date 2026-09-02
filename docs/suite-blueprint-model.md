# AuraFlow Suite Blueprint Model

AuraFlow now treats industry systems as reusable suite blueprints. A blueprint is not just a visual template; it describes the modules, roles, workflows, data entities, security controls, preview screens, and hosted launch path for a business system.

## Public Website Versus Client App

- Public visitors can browse `/solutions`, `/solutions/:slug`, `/templates`, and `/templates/:slug`.
- Visitors cannot submit serious build requests, upload assets, choose templates for customization, chat, or review private previews without an account.
- Authenticated clients use `/dashboard/studio`, `/dashboard/requests/new`, `/dashboard/requests`, `/dashboard/messages`, and `/dashboard/templates`.
- Admin users with the Firebase `admin: true` custom claim can use `/dashboard/admin`.

## Crestview SMS Transformation

The imported `Crestview/crestview-isms` project was reviewed as a source system. AuraFlow does not blindly mount the Next.js app inside the Vite app. Instead, its route map, roles, Supabase/RLS posture, and domain model were translated into `src/data/suiteBlueprints.ts`.

The school management suite currently includes:

- Admissions, guardians, interviews, assessments, and document review.
- Student 360 records, parent links, medical notes, documents, behavior, attendance, grades, invoices, and reports.
- Staff, HR, recruitment, leave, documents, tasks, and payroll preparation.
- Classes, subjects, terms, timetables, teacher assignments, attendance, grades, and PDF reports.
- Fees, bursary, daily payments, invoices, scholarships, accounting, and finance reports.
- Parent, student, teacher, finance, HR, library, IT, and school admin portals.
- Messaging, announcements, email/SMS/push queues, communication campaigns, and read tracking.
- Public school CMS pages for news, events, admissions, contact, hero slides, and media.
- AI tutor and lesson planner integration points with rate-limit and audit posture.
- Library, transport, boarding, inventory, IT support, preschool, learner care, and audit trail modules.

This gives AuraFlow a pitchable, configurable SMS product path:

1. Client chooses the school suite in the authenticated Suite Builder.
2. Client selects modules, portals, workflows, launch model, preferred hosted link, design direction, data sources, and compliance notes.
3. Client uploads approved files such as images, PDFs, Office documents, CSV/JSON/text, or ZIP packs.
4. AuraFlow receives a private Firebase project request.
5. Admin updates status, deadline, client-visible summary, previews, delivery files, and chat.
6. Client reviews previews, sends revision notes, and keeps all discussion inside the request.

## Security Posture

- Firebase client configuration stays in `VITE_*` variables and is not treated as a secret.
- Admin access is not granted by the frontend. Use a trusted Firebase Admin SDK session and `npm run grant-admin -- <uid>`.
- Firestore rules restrict project reads to the owner or an admin claim.
- Project chat is stored under each project and follows the same owner/admin boundary.
- Storage allows approved reference file types only and limits request assets to 25MB per file.
- Service-account JSON, private keys, production credentials, and third-party login details must not be committed or placed in browser variables.

## Future Build Path

The current AuraFlow app captures and previews blueprint intent. To turn a suite into a true self-service hosted product, the next backend layer should add tenant provisioning:

- A `tenants` collection with owner UID, suite slug, active modules, custom domain/subdomain, status, theme, and billing state.
- A server-only provisioning endpoint that creates tenant records, Storage prefixes, and optional backend resources.
- Per-tenant admin CMS forms for content, pages, products/classes/rooms/menu data, and role invitations.
- A public runtime that resolves `tenantSlug.auraflow.app` and renders the tenant suite from stored configuration.
- Webhook-backed billing and domain lifecycle automation.
