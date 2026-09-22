# AFC security and integrity baseline

AuraFlow Class (AFC) is the technology-learning product being built from the
existing TAS learning engine. The implementation is deliberately evidence-led:
it does not describe any assessment as cheat-proof or any security control as
absolute.

## Current enforced controls

- Role checks and enrollment checks occur on the server for every protected
  course, lesson, assessment, file, grade, certificate, and integrity request.
- Quiz deadlines, attempt limits, assessment question snapshots, option order,
  scoring, passing decisions, and grade release are all server controlled.
- Learners receive no answer keys. Attempts use a server-generated randomized
  question snapshot and client-submitted scores are ignored.
- Course materials use private, random R2 keys. Downloads are authorized for
  every request and documents are served as downloads with safe headers.
- Sessions use random opaque values, hashed database storage, HttpOnly
  SameSite cookies, expiry, scoped session revocation, and origin checks for
  state-changing browser requests.
- Integrity events use a small allow-list: opening an assessment, focus loss,
  hidden-tab state, fullscreen exit, clipboard or paste attempt, and network
  state. AFC stores the event type and server timestamp only. It does not
  collect keystrokes, screen recording, webcam video, microphone audio, or the
  contents of a learner clipboard.
- Instructors can review the recorded context events for courses they own;
  learners cannot retrieve another learner's attempt or evidence. Context
  events are a review signal, never an automatic misconduct decision.
- Certificates are issued only after the server confirms completed published
  lessons and passed published assessments in the enrolled course.

## Required before paid, high-stakes release

1. Add verified self-registration and password recovery through a transactional
   email provider, with MFA for owners and instructors.
2. Replace the pilot password KDF with a vetted identity service or benchmarked
   memory-hard password hashing solution; enforce breached-password screening.
3. Configure and test the course-specific Paystack checkout and webhook
   fulfillment against a sandbox merchant account, then add refunds, invoices,
   entitlement expiry, and reconciliation. The prior academy-plan billing
   screen must not be used for student course purchases.
4. Add an assessment policy per course: accommodations, allowed resources,
   identity-check consent, resit rules, manual review, appeals, and data
   retention periods.
5. Add independent security testing, privacy/legal review for Ghanaian learner
   data, malware scanning/quarantine for submissions, backups and restore
   drills, centralized audit monitoring, rate limits at the edge, CSP, and
   production load testing.

The current design follows the principle of server-side, deny-by-default
authorization with auditability. See the OWASP Authorization, Authentication,
and Logging Cheat Sheets during the production security review.
