# AuraFlow

AuraFlow is a React, TypeScript, Vite, TailwindCSS, Framer Motion, and Firebase frontend for web and mobile development services, template previews, quote intake, public contact flows, authentication, and a protected client dashboard.

## Local Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill the Firebase web values.
3. Start the site with `npm run dev`.
4. Open the local URL printed by Vite.

The local Firebase values are read from Vite `VITE_*` variables. `.env.local` is ignored by git; put the same values in Vercel project environment variables before a production build.

## Firebase Setup

The client uses:

- Authentication for email/password, Google sign-in, password reset, and dashboard protection.
- Firestore for `contacts`, `quotes`, `newsletter`, `users`, `projects`, and optional public content collections.
- Storage for authenticated avatar uploads under `avatars/{uid}/...`.

Before production release:

1. Enable Firestore in the Firebase console and choose the intended production location.
2. Enable Firebase Authentication providers required by the site: Email/Password and Google.
3. Enable Firebase Storage before avatar uploads are expected to work.
4. Deploy the checked-in rules with `firebase deploy --only firestore:rules,storage --project <project-id>`.
5. Validate rules in the Emulator Suite when Java 21+ is available.

`firestore.rules` allows anonymous creates only for validated public intake documents, restricts user profiles to their authenticated owner, keeps project records owner-readable, and denies unmatched documents. `storage.rules` restricts avatar files to the owning authenticated user, images only, and 2MB maximum.

## Release Checks

Run these before GitHub or Vercel release:

```bash
npm run lint
npm run build
npm audit --audit-level=high
```

`vercel.json` includes SPA rewrites, immutable asset caching, and baseline security headers. Firestore and Storage rules are separate from Vercel deployment and must be deployed to Firebase.

## Routes

Public routes cover home, services, templates, template detail previews, portfolio, pricing, blog, about, contact, quote intake, login, register, password reset, privacy, and terms. `/dashboard/*` is protected and redirects unauthenticated visitors to `/login`.
