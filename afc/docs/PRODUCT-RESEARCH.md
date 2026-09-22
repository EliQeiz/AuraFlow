# TAS: research and product direction

Research date: 5 September 2026. First market: colleges in Ghana, as confirmed by the founder. Later markets: SHS, universities, and independent teachers.

## What we are building

TAS is an institution-centered learning management and assessment system. A college owns its workspace; administrators appoint lecturers; lecturers manage classrooms and enroll students. Students receive only the courses, materials, assessment attempts, and released grades their permissions allow.

The initial objective is a coherent college teaching workflow, not a public course marketplace. The product should be more suitable for Ghanaian colleges through clear administration, low-bandwidth usability, lecturer-owned rosters, transparent assessment rules, GHS payments, and dependable grade handling. “Better than Coursera” is a product hypothesis to validate with colleges, not an established claim.

## Research boundaries

This is a review of publicly documented capabilities, not an audit of every private educator console or every subscription tier. Coursera and its partners change availability by product and contract. Where current public evidence does not establish a feature, TAS treats it as a proposed requirement rather than claiming a competitor offers it. We do not copy proprietary code, protected course content, or branding.

## Reference platforms

Coursera separates consumer learning, institutional learning, enterprise learning, and partner authoring. Its public Campus comparison covers content and credentials, learner experience, skills analytics, authoring and curation, academic integrity, integrations, and support. It describes question banks and variants, attempt limits, graded-item locking, proctoring and lockdown browsers, plagiarism tools, SSO, analytics APIs, and LTI integrations. Availability requires plan verification. [Current Campus comparison](https://www.coursera.org/campus/compare-plans).

Coursera Course Builder is an AI-assisted course-authoring product using participating partners’ content. This is useful inspiration for instructor assistance; it does not grant TAS permission to reuse Coursera courses. [Course Builder](https://www.coursera.org/campus/course-builder).

Coursera’s 2022 product announcement documents richer authoring, grade overrides and extra credit, and programming-lab assessment work. It is historical evidence of product direction, not confirmation that every described feature is available under a current plan. [Educator tools announcement](https://blog.coursera.org/new-products-tools-and-features-2022/).

Alison’s completion guidance requires studying all sections and achieving at least 80% in each assessment for course completion. This supports mastery-based progression as a reference pattern. TAS makes the pass mark a lecturer-defined assessment setting instead of copying a universal threshold. [Alison completion guidance](https://helpcenter.alison.com/en/articles/8206422-how-do-i-get-my-certificate).

Turnitin documents instructor enrollment individually and via uploaded student lists, with account instructions emailed to added students. TAS follows the instructor-managed roster pattern and omits public class-key enrollment. The pilot produces private activation links for direct distribution; automated email delivery is not connected. [Turnitin enrollment guide](https://guides.turnitin.com/hc/en-us/articles/25791878274701-Enrolling-students).

## Capability map

| Suite                      | TAS target                                                                                    | First implementation / next stage                                                                                                                        |
| -------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Institution administration | Institutions, campuses, departments, academic years, semesters, ownership and delegated roles | Institution, current semester, admin and lecturer roles implemented; department hierarchy and term archiving next                                        |
| Identity and access        | Invite-only students, teacher permissions, institutional SSO, MFA, recovery                   | Password sessions and one-use invitations implemented; SSO, MFA and recovery are pilot launch requirements                                               |
| Classroom management       | Lecturer-owned classes, rosters, co-teaching, sections, enrollment imports                    | Classroom creation, publication, individual enrollment and revocation implemented; co-teaching and roster CSV import next                                |
| Curriculum authoring       | Modules, units, outcomes, prerequisites, drafts, versioning, course copy                      | Ordered modules, lessons, publication and earlier-module prerequisites implemented; revisions, reordering and course copy next                           |
| Content delivery           | Notes, slides, PDFs, video, captions, transcripts, downloadable resources                     | Text lessons, protected file uploads/downloads and uploaded video playback implemented; captions and video streaming pipeline next                       |
| Learning progression       | Completion tracking, pass thresholds, locked materials, remediation                           | Lesson completion and server-enforced prior-module mastery implemented; conditional paths and instructor exemptions next                                 |
| Assessment authoring       | Question banks, reusable questions, variants, rich mathematics, scheduling                    | MCQ quizzes with shuffled question/option order, attempts, deadlines and durations implemented; reusable pools and other question types next             |
| Assignments and projects   | Written and file submissions, rubrics, group work, late policies, resubmissions               | Written/file submission and lecturer feedback implemented; rubrics, groups, extensions and late policies next                                            |
| Assessment delivery        | Server timers, autosave, resumable attempts, fixed questions, accessible accommodations       | Server deadlines, question snapshots, serialized autosave and resume implemented; per-student accommodations next                                        |
| Academic integrity         | Access controls, randomized assessments, provenance, review and appeals                       | Basic controls implemented; similarity integration, high-stakes proctoring and review case management are future integrations                            |
| Gradebook                  | Automatic marking, manual marking, feedback, import/export, release, audit                    | Automatic MCQ scores, manual assignment grades, CSV grade import/export and explicit release implemented; weights, GPA and grade approval workflows next |
| Student portal             | Enrolled courses, learning path, assignments, personal results                                | Implemented for initial flow; calendar and progress export next                                                                                          |
| Communication              | Announcements, course discussions, office hours, reminders                                    | Planned; no fake messaging or notification buttons                                                                                                       |
| Learning analytics         | Completion, pass rates, cohort trends, support needs                                          | Actual dashboard counts and grade averages implemented; longitudinal reporting and risk signals next                                                     |
| Credentials                | College-approved completion records and verifiable certificates                               | Planned after identity and completion-policy validation                                                                                                  |
| Labs                       | Programming exercises, sandboxed code execution, automated checks                             | Planned separate isolated service; never execute student code in the web app process                                                                     |
| Accessibility              | Keyboard operation, clear errors, semantic forms, responsive UI, captions                     | Accessible primitives and responsive styles implemented; independent WCAG 2.2 AA assessment and assistive-technology testing required                    |
| Ghana delivery             | Africa/Accra dates, GHS, Mobile Money, constrained-bandwidth UX                               | Ghana date formatting and Paystack adapter implemented; bandwidth testing and regional payment testing next                                              |
| Commercial access          | Institution and individual teacher plans, verified payments, invoicing, entitlements          | Configurable GHS checkout and verification adapter implemented; commercial entitlements, renewals, dunning and fiscal workflows incomplete               |
| Enterprise integrations    | SIS, LTI 1.3, SAML/OIDC, roster and grade synchronization                                     | Planned; document contracts and least-privilege scopes before integration                                                                                |
| Operations and governance  | Monitoring, backups, restore tests, audit retention, privacy requests                         | Application activity records implemented; operational controls and verified restoration required before real deployment                                  |
| AI assistance              | Teacher-reviewed draft questions, explanations tied to course content, feedback support       | Planned; no unreviewed AI grades or unsupported cheating accusations                                                                                     |

## Product decisions

1. Colleges pay for the workspace; students do not purchase access to lecturer-enrolled courses in the initial model.
2. A lecturer administers their own teaching operations. They cannot become institution owners or read other lecturers’ classes unless explicitly authorized through an institutional role.
3. Access checks apply on every server endpoint, including file downloads. Hiding a link is not authorization.
4. Students complete lessons and pass all published assessments in preceding published modules before accessing the next module. Viewing a lesson is self-reported completion in this pilot, not proof of attention.
5. Assessment answer keys never travel to the student client. The server fixes randomized questions and answer order per attempt and computes the score.
6. An attempt’s deadline survives refreshes and closed tabs. Expired attempts are finalized on the next server interaction; a scheduled finalizer is required for immediate unattended expiry processing at scale.
7. Released numerical grades are student-visible. Pass/fail is available for progression, even before score release. Decide with the pilot college whether progression decisions must also wait for moderator approval.
8. Manual regrading withdraws the grade until it is released again. All grade changes need a richer immutable history before high-stakes production use.
9. No platform can guarantee zero cheating. Second devices, collusion and impersonation require assessment design and proportionate identity/invigilation measures. Browser focus changes are not proof of misconduct.
10. Payment success comes from verified provider data, never a redirect or a student-supplied amount.

## Ghana pilot and commercial model

Start with one college, two participating lecturers and a small invited cohort. Validate enrollment, teaching materials, low-bandwidth access, assessments and grade release before adding departments or billing real customers. A lecturer plan and institution plan exist as configuration points; no prices have been approved. Merchant onboarding and the applicable Ghana payment channels must be verified in Paystack test mode and live merchant configuration. [Paystack payment channels](https://paystack.com/docs/payments/payment-channels/), [Webhooks](https://paystack.com/docs/payments/webhooks/), [Transaction verification](https://paystack.com/docs/payments/verify-payments/).

Before processing real student data, the college and TAS must establish their data-controller/processor roles, applicable registration obligations, lawful processing arrangements, retention periods, access request procedures, contracts and hosting arrangements. Confirm these against Ghana’s Data Protection Act and the Data Protection Commission with qualified local advice. This project has not completed a compliance review. [Ghana Data Protection Act, 2012](https://cybersecurity.gov.gh/documents/Data_Protection_Act_2012.pdf), [Data Protection Commission](https://dataprotection.org.gh/).

## Delivery sequence and acceptance gates

**Phase 1 — working engineering pilot:** sign in as staff, create a draft class, add modules, upload content, enroll and activate a student, publish, complete lessons, take a timed quiz, unlock a module, submit an assignment, grade it and release the result. Verify denied access and tenant boundaries in automated tests. This repository implements this phase, with limitations documented in ARCHITECTURE.md.

**Phase 2 — supervised college pilot:** password recovery, MFA, student identity procedures, per-student timing accommodations, stronger grade history, upload malware scanning, accessible media, real email infrastructure, monitoring, backup restoration and security assessment. A college signs off assessment and privacy policies before importing real records.

**Phase 3 — paid institutional release:** payment provider testing, entitlements, agreed prices and contracts, billing operations, SIS import, staff administration, enrollment bulk import, moderation and service-level commitments. Gate release on payment reconciliation and a successful disaster-recovery exercise.

**Phase 4 — institutional scale:** SSO/LTI, rich authoring, rubrics, question pools, discussions, learning analytics, accessible mobile experience, video transcoding, certificates, optional proctoring and teacher-reviewed AI assistance. Prioritize with actual lecturer/student pilot evidence.

Success measures: time to create and publish a class; student activation completion; assignment submission success; grading turnaround; percentage of interrupted quizzes recovered; accessibility defects; support incidents; restore time; payment reconciliation accuracy. No invented targets or customer claims are used in the interface.
