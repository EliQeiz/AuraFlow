# AuraFlow

AuraFlow is a React, TypeScript, Vite, TailwindCSS, Framer Motion, and Firebase business website plus authenticated client app for websites, web apps, mobile apps, dashboards, software prototypes, and managed hosted business systems.

## Product Model

- The public website markets AuraFlow, shows services, pricing, portfolio concepts, and detailed template previews.
- Visitors can browse public templates and hosted-system examples, but serious requests, uploads, template selections, project chats, and preview feedback require an account.
- The private client app includes Requests, Prototype Studio, Templates, Messages, Settings, status tracking, client uploads, revision notes, and preview files.
- The owner/admin console is hidden unless the signed-in Firebase account has the `admin: true` custom claim.
- Managed hosted systems let small businesses start with a lower-cost AuraFlow-hosted link, such as `yourschool.auraflow.app`, and upgrade later to a custom build or domain.
- Suite blueprints turn systems such as school management, ecommerce, restaurants, hotels, clinics, pharmacies, supermarkets, portfolios, logistics, real estate, salons, construction, and finance portals into configurable client-app starting points.
- The included Crestview school system is translated into a reusable SMS blueprint rather than exposed as a public demo with credentials. See `docs/suite-blueprint-model.md`.

## Core Routes

- Public: `/`, `/services`, `/solutions`, `/solutions/:slug`, `/templates`, `/templates/:slug`, `/portfolio`, `/pricing`, `/blog`, `/about`, `/contact`, `/login`, `/register`, `/forgot-password`.
- Private client app: `/dashboard`, `/dashboard/studio`, `/dashboard/requests/new`, `/dashboard/requests`, `/dashboard/messages`, `/dashboard/templates`, `/dashboard/settings`.
- Owner/admin: `/dashboard/admin`, visible in navigation only after the admin custom claim is granted.

## Local Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill the Firebase web values.
3. Start the site with `npm run dev`.
4. Open the local URL printed by Vite.

The local Firebase values are read from Vite `VITE_*` variables. `.env.local` is ignored by git; put the same values in Vercel project environment variables before a production build.

## Firebase Setup

The client uses:

- Authentication for email/password, Google sign-in, password reset, and dashboard protection.
- Firestore for `newsletter`, authenticated `users`, private `projects`, request messages, and optional public content collections.
- Storage for authenticated avatars plus private project references and admin previews.

Before production release:

1. Enable Firestore in the Firebase console and choose the intended production location.
2. Enable Firebase Authentication providers required by the site: Email/Password and Google.
3. Enable Firebase Storage before avatar, client reference, or admin preview uploads are expected to work.
4. Set the admin custom claim from a trusted server/Admin SDK for AuraFlow admin accounts. The frontend never grants this claim.
5. Deploy the checked-in rules and indexes with `firebase deploy --only firestore:rules,firestore:indexes,storage --project <project-id>`.
6. Validate rules in the Emulator Suite when Java 21+ is available.

`firestore.rules` keeps project records, chat messages, client updates, suite prototype specs, and admin updates behind owner/admin checks. Public request forms are not exposed; legacy contact and quote writes require authentication. `storage.rules` keeps references owner/admin-readable, makes preview uploads admin-only, limits approved reference files to 25MB, and limits avatars to owner image uploads under 2MB.

## Admin Access

1. Register or log in with the creator account.
2. Open dashboard Settings and copy the Firebase UID shown in Creator Access.
3. Authenticate a local trusted Admin SDK session, for example by setting `GOOGLE_APPLICATION_CREDENTIALS` to a Firebase service account JSON path.
4. Run `npm run grant-admin -- <uid>`.
5. Sign out and back in. The sidebar then shows Admin, and `/dashboard/admin` opens the client request console.

Do not put service-account JSON in the repo or in browser environment variables.
Do not share third-party production login credentials in issues, chats, project briefs, screenshots, or seed data. Use public demos, owned staging accounts, or screenshots with sensitive data removed.

## Release Checks

Run these before GitHub or Vercel release:

```bash
npm run lint
npm run build
npm audit --audit-level=high
```

`vercel.json` includes SPA rewrites, immutable asset caching, and baseline security headers. Firestore and Storage rules are separate from Vercel deployment and must be deployed to Firebase.

## Routes

Public routes cover home, services, hosted suite details, marketing template previews, portfolio concepts, pricing, blog, about, contact, login, register, password reset, privacy, and terms. `/quote` and `/dashboard/*` are protected and redirect unauthenticated visitors to `/login`; `/dashboard/requests/*` is the private intake, preview, revision, and chat workspace.
