# AFC — AuraFlow Class

The AFC learning platform is being built from the TAS engineering base for
practical machine learning, data science, software engineering, mobile and web
development, AI tools, prompt engineering, frontend, and backend courses.

It currently supports owner/instructor/learner workspaces, protected learning
materials, YouTube-led video lessons, timed quizzes, written and file
submissions, mastery gates, integrity context events, grade review/release,
certificate claims, activity records, and a public published-course catalog.

Read [AFC security and integrity baseline](docs/AFC-SECURITY.md), [architecture and known limitations](docs/ARCHITECTURE.md), and [validation results](docs/VALIDATION.md) before use. This is not yet suitable for real learner data, paid certificates, or high-stakes assessments.

## Run locally on Windows

Requires Node.js 22.13 or later and npm.

```powershell
npm install
npm run db:generate
npm run db:migrate:local
npm run db:seed:local
npm run dev
```

Use the local URL printed by the development server. The local sign-in screen offers a lecturer and student demo workspace. These accounts use fictional records and the password `TAS-local-pilot-2026!`:

| Role                                 | Email              |
| ------------------------------------ | ------------------ |
| Institution administrator / lecturer | lecturer@tas.local |
| Student                              | student@tas.local  |
| Additional student                   | abena@tas.local    |
| Lecturer with no assigned classroom  | yaw@tas.local      |

The seed script always uses the local D1 database. It does not run at application startup or during deployment. Never seed these public credentials into a hosted database.

## First controlled provisioning

Run migrations against the chosen environment. Set a cryptographically random `AFC_SETUP_TOKEN` through secret management, visit the application and complete AFC owner setup. Remove the token after setup. The existing `TAS_SETUP_TOKEN` remains supported only for migration compatibility. Use the AFC owner account to invite instructors and learners during the controlled pilot.

The former academy-plan payment adapter is not a course checkout system. Do not charge learners until course-specific Paystack orders, fulfillment, refunds, invoices, and entitlement enforcement are implemented and tested.

## Verification

```powershell
npm run typecheck
npm run lint
npm test
npm run test:integration
npm run build
```

Integration tests require a running local development server and seeded local data. They create uniquely named fixture records and verify authorization and learning workflows. They must not point to production.

The private pilot address is https://tas-teaching-assistant-system.elishaafari0.chatgpt.site. Initial college setup uses the private setup note saved locally in `work/TAS-private-setup.txt`, which is excluded from source control. Deployment success is reported separately after the hosting service confirms it. The hosted database starts empty; local demo accounts are not deployed.
