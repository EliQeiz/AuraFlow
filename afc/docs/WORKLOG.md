# TAS checkpoint log

## Scope confirmed

The founder selected Ghana and colleges as the first market. The initial research and implementation were preserved across the usage-limit interruption. No project initializer was rerun over the workspace.

## Completed sequence

1. Reviewed public Coursera, Alison and Turnitin capabilities and documented a TAS capability map and phased college rollout.
2. Scaffolded the application with the Sites starter, React/TypeScript, UI primitives, D1 and R2.
3. Implemented institution/lecturer/student access, invitations, classrooms, modules, protected files, quizzes, assignments, grades, activity records and the Paystack adapter.
4. Added Ghana time formatting, a responsive college workspace, local fictional demo records and documentation of production gaps.
5. Recovered from interrupted dependency downloads. The Windows Rolldown and lint/format native packages were recovered at their existing locked versions; archive integrity was verified against the lockfile.
6. Applied the database migrations and seeded local fictional data. The hosted database is separate and starts empty.
7. Started the local server and confirmed HTTP 200. Requested its preview in the Codex app.
8. Fixed type/lint issues, protected-caption support and non-JSON error handling. Added direct local database fixture control for deterministic expiry tests without waiting for network-dependent CLI shutdown.
9. Passed 7 unit tests, 30 API/database integration checks, application lint, TypeScript checks and the production build. See VALIDATION.md for exclusions and untested areas.
10. Reconnected to Sites, verified that the failed registration had created no TAS site, and registered the private pilot. Configured an initial setup secret and saved the founder’s setup note outside source control.

## 14 September 2026 — institution administration upgrade

Continued from the existing pilot and site, preserving source history and college records. Added institution directory/search/pagination, departments, academic terms, lecturer allocation with concurrency protection, account suspension/restoration, replacement invitations, active-session inventory/revocation and transactional grade history. Regrades require a reason; grading/publication require the reviewed revision. Course cards reflect assigned department and term.

Added migrations 0002 and 0003 without rewriting the original applied migrations. SQL history triggers were checked against D1 locally; grade updates use RETURNING results rather than trigger-inclusive change totals to detect conflicts. Added legacy-data preservation and transaction rollback tests. Validation reached 10 unit/migration tests and 43 API/database checks, plus targeted local browser interaction and narrow/desktop visual checks. Temporary integration teaching records were removed from the local sample database.

See COMMERCIAL-READINESS.md for the remaining delivery sequence and release gates. This upgrade is still an engineering pilot; it does not complete a paid institutional launch.

## Continuing work

Do not claim real Paystack payments, institutional compliance, a completed penetration test, browser visual QA, or production readiness. The project remains a private engineering pilot. Keep the private setup note and runtime secrets out of Git. Continue from the existing `.openai/hosting.json` and its project ID for subsequent changes; never create a duplicate TAS site.
