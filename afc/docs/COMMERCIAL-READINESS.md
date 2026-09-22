# TAS commercial release plan

Ghana colleges remain the first pilot market. Universities and senior high schools need policy-specific workflows beyond the shared teaching core. This file is a delivery and acceptance checklist, not a claim that pending capabilities exist.

## Delivered foundation

Teacher-controlled enrollment and protected modules/materials; timed, server-scored and randomized quizzes; assignments/projects; progression gates; private/released grades; CSV grade import/export; private files and caption tracks; institution directory, departments and terms; classroom transfers; suspension and session revocation; invitation replacement; transactional grade history and stale-write rejection. A Paystack adapter exists but payment credentials, entitlement enforcement and commercial billing are unfinished.

## Next delivery sequence

| Workstream                         | Required product behavior                                                                                                                                                                     | Acceptance gate                                                                                                                       |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Identity and institution lifecycle | Vetted SSO/OIDC integration, staff MFA, verified account recovery, controlled institution provisioning, registrar/department/exam roles and least-privilege co-teaching                       | Provider configured; recovery/MFA/session-revocation and cross-tenant tests pass; administrator recovery drill completed              |
| Academic records                   | Programmes/cohorts, course offerings by term, student identifiers, weighted assessment categories, institutional grading scales, resits, moderation approvals, appeals and transcript exports | Pilot college approves its grading policy; results reconciled with independent expected records; all grade transitions auditable      |
| Assessment delivery                | Accommodations, availability windows, question pools, rubrics, late-work policy, cohort content versions, scheduled expiry, autosave/connectivity recovery                                    | Exam rules verified server-side; accessibility accommodations tested; interrupted-connection and concurrent-submission cases verified |
| Teaching and engagement            | Announcements, discussions with moderation, calendar, attendance, feedback notifications, bulk roster import and reliable invitation delivery                                                 | Teachers and students complete realistic workflows; delivery retries/duplicates and permission boundaries tested                      |
| Content operations                 | Quarantined uploads, malware/archive inspection, quotas, large video upload/transcoding/streaming, caption workflow, orphan cleanup                                                           | Unsafe files cannot be served; quotas and download authorization verified; realistic lecture videos play on target devices/networks   |
| Paid access                        | Approved GHS pricing, Paystack merchant integration, server-side plan entitlements, renewal/grace periods, invoices, refunds/reversals and reconciliation                                     | Sandbox and controlled real transactions tested; duplicate/out-of-order webhooks are safe; unpaid access follows agreed rules         |
| Interoperability and reporting     | College SIS import/export, approved LTI/SCORM/xAPI requirements, accessibility/engagement reporting, audited data exports                                                                     | Pilot integration contracts agreed; representative files reconciled; institution-specific data never leaks through reports            |
| Reliability and support            | Stable runtime decision, bounded/paginated data queries, monitoring/alerts, backups/restore, retention/deletion, incident procedures and support tooling                                      | Measured load target and availability objective met; restore/incident drills completed; independent security assessment resolved      |
| Ghana and school readiness         | Institution agreements, privacy notices, retention policy, controller/processor responsibilities, child-data/safeguarding rules for SHS, accessibility review                                 | Qualified Ghana review and institution approval; pilot users complete accessibility and operational acceptance                        |

## Engineering decisions for the next phase

Split the central API handler into tested domain services before expanding the role model. Retain explicit server authorization on every resource request. Do not introduce an uncontrolled public signup path. Choose the identity provider and production runtime before promising SSO, MFA or production password security. The existing password KDF and beta framework remain launch risks.

Academic terms currently label records; they do not enforce assessment windows. Department membership does not yet grant department-level authority. Grade history is append-only through the application but not protected from database administrators. Quiz controls reduce specific cheating opportunities; a browser cannot prevent outside assistance or a second device.

Run the next acceptance pilot with fictional records until identity, content safety, recovery, operational and institutional requirements are satisfied. Define concurrency, roster size, recovery-point/recovery-time targets and support obligations with the participating college before a commercial commitment. No invented SLA or compliance certification is attached to this release.

## Technical reference points

Session inventory and revocation follow the capabilities described in the [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html). Transactional mutations use [Cloudflare D1 batch operations](https://developers.cloudflare.com/d1/worker-api/d1-database/). These references inform the design; they do not certify TAS.
