# AuraFlow rebuild checkpoint

Branch: `codex/platform-rebuild`. Last updated: 2026-09-09.

## Latest requested upgrade

The template-motion, portal-UI, and connected delivery-workflow upgrade is implemented. See [delivery-workspace.md](delivery-workspace.md) for the five client features, five admin tools, data contracts, and limitations.

- Website covers use category-specific imagery and Framer Motion image reels, with pause controls, offscreen/hidden-tab suspension, data-saving behavior, and live reduced-motion preference updates.
- Business-suite previews use the actual suite canvas with responsive thumbnail scaling. Portal tables, forms, controls, dialogs, status treatments, and navigation have been refined.
- Milestones, version approvals, tracked change requests, an activity inbox, and restorable studio checkpoints connect clients to the administration workspace.
- Administrators have priority triage, atomic bulk status updates, private notes, saved replies, and filtered CSV reports. Admin links can open projects outside the recent 100-record list.
- Latest verification: 10 unit/config tests, 9 emulator security groups, and 12 browser scenarios passed. TypeScript/build, lint, production-bundle route/preview smoke, and production dependency audit passed (zero reported production vulnerabilities). Two dead image references were removed; all remaining 173 unique gallery URLs returned successful HTTP responses on 2026-09-09.
- No Git push or production deployment. The new Firestore rules and activity index must be deployed together with the new application after staging verification. Existing production providers and owner claims were not changed.

## Completed implementation

- Separate public, account, customer-workspace, and claims-protected admin layouts.
- Restrained dark/light design system, responsive navigation, account image fallback.
- Email registration and sign-in, Google popup integration, password reset and reauthentication.
- Versioned studio drafts, conflict detection, undo/redo, duplication, ordered pages, branding, modules, roles, workflows, private media, responsive previews.
- Saved-design snapshots carried into project briefs; idempotent request creation and retryable uploads.
- Private project files, progress updates, preview delivery, revisions, project conversations, and support before a project exists.
- Admin project controls and a separate client support inbox.
- Theme settings, profile editing, account data export, sign-out, and a support-led deletion request.
- Updated public home, services, suite detail, template library, pricing, contact, and founder pages.

## Previous rebuild verification checkpoint

- [x] Production build and TypeScript passed after the suite field-name correction.
- [x] Eight domain/configuration tests passed, including absolute and escaped preview links.
- [x] Six Firebase emulator security tests passed, including a 20-file draft and immutable submitted snapshot.
- [x] Public browser route and mobile account-layout checks passed.
- [x] Corrected screenshot waits; inspected loaded home, mobile login, customer overview, admin, and mobile chat screenshots.
- [x] Corrected the profile startup/bookmark race; save, reload, and remove checks passed.
- [x] Replaced a broken cafe gallery reference and fixed iframe handoff after client-side navigation.
- [x] Nine browser scenarios passed together: public routes, registration, Google emulator sign-in, password reset, templates/bookmarks, private project/files/chat, admin updates/previews, isolation/themes, stale-design conflicts, and suite-specific mobile canvas controls.
- [x] Final TypeScript/build, dependency audit (zero reported vulnerabilities), and production-bundle route smoke passed after fixes.
- [x] Final lint passed without warnings; mobile studio screenshot reviewed with brand colors, custom page navigation, and relevant clinic content.
- [x] Local demo started on port 5190. Seeded client/admin accounts; independently verified sign-in, admin claim gating, client denial, and logout through the running preview.

## Important boundaries

This is a real Firebase-backed client design and delivery workspace. The studio previews contain explicitly labelled sample data. They are not operational school-management, commerce, or hospitality deployments.

Do not describe the following as implemented or verified: native mobile/desktop packages, automatic tenant provisioning, domain provisioning, payment settlement, transactional notifications, production Google OAuth, or full operational industry suites. Each needs its own implementation and release checks. No production data migration, Git push, or deployment has been performed for this rebuild.

Existing customer records and unrelated reference systems must remain intact. No global Git or account identity changes are required.

## Admin access

The workspace sidebar displays **Admin console** only when the signed-in Firebase account has the server-issued `admin: true` custom claim. Its route is `/dashboard/admin`; hiding the navigation is not the authorization control. Firestore and Storage also enforce this claim.

The production owner is `elishaafari0@gmail.com`. Claim assignment must be done with trusted credentials scoped to `auraflow-eece6`, using `scripts/grant-admin.mjs`, then signing out and back in. Never grant administration from a browser email comparison or place service-account credentials in `VITE_*` variables. Production claim assignment was not performed in this checkpoint.

## Next implementation and release gates

1. The client-workspace QA checkpoint is complete. Next, inspect the existing `Crestview/` data models and workflows and define the tenant/membership contract before changing the operational school subsystem. Preserve the reference folder and existing production data.
2. Build the operational school runtime separately from the design preview: tenant membership and role rules, admissions, students, attendance, grades, fees, audit history, and migration of reference-system features. Use synthetic data until authorization tests pass.
3. Apply the tenant/runtime model to hospitality, restaurants, and commerce. Publishing, real bookings, inventory, orders, and payments require server-side workflows, not demo records in the canvas.
4. Review and migrate existing production data and rules without deleting client projects. Verify password and Google providers, authorized domains, email actions, private Storage CORS, and owner claims on a staging deployment.
5. Before public release: App Check rollout, server-enforced abuse/rate/storage quotas, upload malware scanning, admin MFA, audited privileged changes, retention/deletion policies, backup and restore tests, and external security review. The passing local tests are not a certification.
6. Package and test actual mobile/desktop clients after the backend contracts are stable. `VITE_APP_ONLY` removes marketing routing; it does not produce a native app.

## Run the checks

Use Java 21+ and the Firebase CLI. The test project is `demo-auraflow`, never the production project. The local Java runtime under `.tools/` is ignored by Git.

```powershell
$env:JAVA_HOME = (Resolve-Path '.tools\jdk-21.0.12.1+1-jre').Path
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
npm run test
npm run lint
npm run build
npm run test:production
firebase emulators:exec --project demo-auraflow --only auth,firestore,storage "npm run test:security && npm run test:e2e"
```

Emulator ports: Auth 9799, Firestore 8780, Storage 9798. Browser tests use port 5187 and `.env.e2e`. Playwright uses installed Chrome by default; set `PLAYWRIGHT_CHANNEL` to another installed supported channel when needed. Test artifacts and emulator downloads are ignored.

Do not start a second emulator instance while the local demo owns these ports. Stop this project's demo first, then run the emulator test command. Do not stop unrelated projects' services.

## Local demo setup

The local demo uses Firebase emulators, not the production project. Never enter production passwords or customer information into this disposable environment. Auth, chat, projects, and uploaded files exist only in this emulator session and are lost when it stops.

Start the emulators with the Java environment above:

```powershell
firebase emulators:start --project demo-auraflow --only auth,firestore,storage
```

In a separate terminal scoped to this project:

```powershell
$env:FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9799'
npm run demo:seed
npm run dev:demo -- --port 5190 --strictPort
```

Local accounts: `owner@auraflow.test` (admin) and `client@auraflow.test` (client). Both use `AuraFlow-local-2026!`. These are public, local-only test credentials and must never be used for a deployed project. The Google button opens a simulated provider in the emulator, not real Google authorization.

Preview address: `http://127.0.0.1:5190`. Sign in as the client to create a design, submit a project, and message support. Sign out, then sign in as the owner to use **Admin console**, update the project, share a preview, and reply. No account switches outside this local preview are needed.

The preview was restarted on 2026-09-09 after the delivery-workspace QA run, with a fresh emulator session and the local accounts above. Background service logs are under `.tools/preview-vite.*.log` and `.tools/preview-emulators.*.log`. These services are local processes, not a hosted deployment; use the setup commands above after a restart.
