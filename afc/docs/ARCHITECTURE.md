# TAS engineering architecture

## Status

This is an initial working engineering pilot, not a certified, production-ready LMS. Do not onboard real student records or run high-stakes exams until the documented launch requirements are met. The private hosted pilot starts with an empty database and owner-controlled institution setup; local demo accounts are never seeded into hosting. See VALIDATION.md for completed checks and practical limits.

## Stack and boundaries

The application uses React 19, TypeScript, the Vinext framework adapter, Tailwind CSS, and existing Base UI/Shadcn primitives. Cloudflare Workers executes the server; D1 holds relational records; private R2 bindings hold files. The Sites starter supplied the pinned framework dependencies. Vinext is a beta dependency, so a production architecture review must decide whether to retain it or migrate the React application to a stable framework/runtime before institutional commitments.

The initial code is organized as a modular application, with client workspace components in `components/tas`, server routing and authorization in `lib/server.ts`, assessment logic in `lib/assessment.ts`, password/session utilities in `lib/auth.ts`, and the schema in `db/schema.ts`. AFC uses `app/api/afc/[...path]/route.ts`; the former TAS route is retained temporarily for local regression coverage. Drizzle generates SQL migrations. Domain services should be split from the current central route module as policies expand.

Institution → users and classrooms → enrollments and ordered modules → lessons and assessments → attempts and grades. Sessions and invitations hold token hashes. Files are addressed internally by random keys, never by paths supplied by the browser. The authorization graph is checked again for every file request.

## Identity and permissions

Institution admins manage the institution and can access its classrooms. Lecturers manage only their own classrooms. Students access published classrooms with an active enrollment and only permitted published modules. Neither a submitted role nor an institution ID from the browser is trusted.

The first institution can be provisioned only with a server-configured `TAS_SETUP_TOKEN`, and setup is closed once an institution exists. The fixed initial institution key also prevents two simultaneous setup requests creating separate initial owners. Additional institutions require controlled provisioning in a later administration release. There is no public student or lecturer registration.

Institution administrators can invite lecturers. Lecturers create or enroll student accounts; first-time users receive a private, 48-hour activation link. Invitation tokens have 256 bits of randomness and are stored as SHA-256 hashes. Activation is one-use and sets the password only on an unactivated account. Existing users cannot have passwords overwritten by enrollment. No emails are automatically sent in this pilot; the lecturer distributes the private invitation directly.

Sessions use random tokens, hash-only database storage, an eight-hour expiry, HttpOnly and SameSite=Lax cookies, and Secure cookies under HTTPS. Password changes revoke all sessions. Account settings list active sessions and allow revocation of another session or all other sessions. Separate display IDs prevent exposure of token hashes. Browser-supplied device descriptions are informational, not trusted device identity. Legacy sessions remain valid until expiry or revocation and are labelled when metadata is absent. State-changing browser requests require an exact Origin match. Authentication and password-change attempts are throttled through atomic database counters. Production network throttling, credential-stuffing monitoring, MFA and recovery still need implementation.

## Institution administration (September 2026 upgrade)

Administrators have a searchable directory with 50 accounts per page, department codes unique within each institution, dated academic terms, and classroom allocation. Allocation checks that the lecturer is an activated, unsuspended member of the same institution and validates department/term ownership. A transactional revision check ensures only one competing allocation succeeds. The former lecturer loses classroom access unless they are an administrator. Course cards show the assigned academic term and department; legacy classrooms retain the institution semester label. Term dates organize records and do not schedule assessment availability.

Administrators can suspend or restore students and lecturers with a recorded reason. Each change revokes their existing sessions and invitations. Suspended accounts cannot sign in, activate, or authenticate subsequent API requests. Requests already authorized before suspension can finish; this is not cancellation of in-flight operations. Administrator suspension and role editing are deliberately unavailable to prevent owner lockout and privilege escalation. Submitted work is retained. Unactivated, unsuspended accounts can receive a replacement invitation; previous links become invalid. This is invitation management, not recovery for an activated account.

Access changes, invitation replacement, academic structure creation, session revocation and allocation write their business operation and activity record in one D1 batch. Common directory, session and course lookups have supporting indexes. Directory pagination does not solve the existing large-course snapshot query budget, which still needs separate work.

Passwords use salted PBKDF2-SHA256 with 100,000 iterations in the pilot’s Worker-compatible WebCrypto implementation. This is a known launch limitation: select and benchmark a production password strategy against current guidance, preferably a vetted identity service with MFA or a suitably configured memory-hard KDF. Do not represent the current password design as having passed an OWASP review. [OWASP password storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

## Assessments and progression

The server takes a question snapshot at the start of a quiz, randomizing both question and option order. The client receives prompts and choices without answer keys. A uniqueness constraint on assessment, student and attempt number prevents simultaneous requests from granting duplicate attempt numbers. Server time controls deadlines and due dates. Saved answers are validated against the stored question snapshot. Scoring ignores client-supplied scores or pass flags.

Quiz answers are serialized by the client to avoid save reordering. On submit, the server conditionally updates an active attempt that has not passed its deadline. Once expired, only previously persisted answers are graded. Finalization currently occurs when the attempt or workspace is next requested, rather than through a background scheduler. Add a scheduled finalizer for unattended expiry and operational reporting.

The client timer is display-only. Closing the page or changing the local clock does not extend the deadline. The student can resume an active attempt. The college must define treatment of interrupted connectivity and add per-student duration accommodations before examination use.

All lessons in earlier published modules must have completion records, and all earlier published assessments must have a passing attempt. These gates apply before returning lesson content, starting assessments or delivering attached files. Lesson completion is an explicit student action; it does not prove that material was studied. Adding, withdrawing, or publishing modules can change progression policy, so production needs a frozen course version per cohort.

Assignment/project submissions are written responses with optional files. Manual grading records a score and feedback; changed grades revert to unreleased. Numerical quiz scores remain private until lecturer release. The pass/fail progression result is intentionally available earlier. CSV import validates the whole batch and enrolled student membership before inserting grades; export escapes CSV values and mitigates formula injection.

Current grade averages are averages of recorded graded attempts, not weighted course grades or institutional GPA. Course weights, resit policies, independent moderation approval, transcript production and grade appeals are not implemented.

Grade history now records prior/new scores, feedback and release states with a sequence number, timestamp and actor. SQL triggers make history insertion and grade mutation atomic, including automatically scored and imported results. Manual regrading requires a reason; grade and publication writes require the revision the staff member reviewed. Stale writes return a conflict without overwriting another staff member's changes. Staff can inspect up to the latest 200 revisions for classrooms they administer; students cannot view staff history. Earlier edits are not reconstructed. The first post-upgrade mutation records the legacy grade as its prior value. No application endpoint edits or deletes history; database administrators still have direct control, so this is not independently immutable or cryptographically tamper-evident storage. Changes that leave the score, feedback and publication state identical do not create a grade revision.

## Storage and content safety

The pilot permits PDF, TXT, DOCX, PPTX, MP4 and WebM, up to 20 MB per upload. It checks extensions and basic content signatures, uses random private storage keys, prevents file-key assignment by the browser and authorizes every download. Documents are served as attachments with no-sniff and sandbox headers; video files can play inline. Plain lesson content is rendered as text, not injected HTML.

Signature checking is not malware detection. Add quarantine, antivirus scanning, archive inspection, storage quotas, orphan cleanup, media processing, signed streaming/range support, captions and transcription before accepting real uploads. The 20 MB pilot limit is not suitable for full lecture recordings; production should use direct multipart uploads and a dedicated video pipeline.

## Payments

`PAYSTACK_SECRET_KEY`, `TAS_TEACHER_AMOUNT_GHS`, and `TAS_COLLEGE_AMOUNT_GHS` are server settings. No amount or plan entitlement is accepted from a browser without server selection. Checkout records a pending GHS amount, uses the hosted Paystack page and checks the returned checkout hostname. The return path verifies the reference belongs to the active institution.

Webhook requests require a SHA-512 HMAC signature. Fulfillment re-verifies the transaction with Paystack and compares reference, amount, currency and institution metadata. A transactional conditional update prevents the same successful payment extending access twice. Successful payment records a 30-day paid interval. This is a prepaid access foundation, not a complete recurring subscription service.

No merchant key or approved prices are configured. Live/sandbox payment behavior remains unverified until credentials are supplied. Commercial entitlement enforcement, plan quotas, delinquency handling, refund/reversal processing, renewal reminders, invoices and tax/accounting requirements remain incomplete. The pilot deliberately allows teaching without a paid plan; the billing screen must not be presented as a finished paywall.

## Operational and security acceptance

Use OWASP ASVS as the verification framework. [ASVS](https://owasp.org/www-project-application-security-verification-standard/), [Authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html), [File upload guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).

Before real college use: complete account recovery and MFA; replace or harden the password strategy; test cross-tenant object references; audit SQL and race behavior; scan uploads; design retention and deletion; verify backups and restores; add structured monitoring and alerts; set a CSP appropriate to the framework; enforce transport security; review accessibility with assistive technology; test production load and low-connectivity behavior; establish an incident response process; and agree Ghana privacy and education policies with the college.

The D1 snapshot implementation uses repeated queries for clarity in a small pilot. Pagination, batched joins, limits, indexes and benchmarked query budgets are required before large rosters and courses. Activity records are application-level and not an independently immutable audit system. Some audit writes occur after the business operation and must become atomic or reliably queued before regulated record use.

## Honest limits

No claim of “unhackable,” “cheat-proof,” “zero bugs,” “fully compliant,” or “production-ready” is made. The roadmap records functionality that is absent rather than showing nonfunctional UI controls. Real institutional deployment is a subsequent gated release, after the engineering pilot has been verified and reviewed with users.
