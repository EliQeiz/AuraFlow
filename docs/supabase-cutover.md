# Firebase to Supabase cutover

AuraFlow is moving from Firebase to Supabase in controlled phases. The goal is
one backend authority after validation, not a permanent dual-write system.

## 1. Provision and secure Supabase

- Apply the ordered migrations in `supabase/migrations/` to project
  `tbugdnfqajhevednmvim`. The linked project currently has migrations through
  `0008_admin_workspace_operations.sql`; do not edit or skip an applied file.
- Enable Email/Password and Google in Supabase Auth. Set the exact AuraFlow
  production and preview redirect URLs.
- Configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
  `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` in Vercel. The last key is
  server-only and must never have a `VITE_` prefix.
- Make `elishaafari0@gmail.com` an admin in `public.user_roles` only after it
  has authenticated with Supabase.

## 2. Export and migrate data

Take an immutable Firestore/Storage export before any write freeze. Do not
copy Firebase password hashes: users must sign in through Google again or use
Supabase's password-reset/invite flow. Preserve a mapping from Firebase UID to
the new Supabase Auth UUID, then migrate only validated records into the new
UUID-keyed schema. Copy private objects into their matching Supabase buckets;
do not preserve public Firebase URLs as private permissions.

Reconcile row counts and sampled ownership for profiles, projects, assets,
messages, AFC enrolments/submissions, business configurations, and orders.
Record failures separately rather than skipping them.

## 3. Switch, verify, and retire

Deploy the Supabase-backed application only after authentication, role checks,
RLS policies, signed uploads, realtime collaboration, WhatsApp server routes,
and AFC grading pass staging tests. Set both `VITE_BACKEND_PROVIDER=supabase`
and `AURAFLOW_BACKEND_PROVIDER=supabase` in the same Vercel environment. The
build refuses a mismatched pair. Place Firebase in read-only recovery mode for
an agreed retention window. Retire Firebase keys, Admin SDK dependencies, rules,
and deployment paths only after the reconciliation sign-off.

## Security gates

- RLS is enabled on every tenant table; UI visibility is never authorization.
- Admin/server operations use the service-role client only on Vercel routes.
- Browser uploads use user-scoped private Storage paths and bucket policies.
- Validate MIME type, file size, and ownership on every upload route.
- Never expose a service-role key or accept a client-supplied owner ID.
