# AuraFlow Business Center: SMS Discovery Baseline

**Status:** discovery complete; no Crestview or production data has been changed.

## Purpose

AuraFlow Business Center will offer an operational school-management product
that schools can trial, configure, subscribe to, and operate at an isolated
school URL. It should reuse the capability proven in Crestview while becoming a
multi-tenant AuraFlow product, not a copy of a single school's deployment.

This document records the first implementation boundary before building begins.

## Systems reviewed

### Crestview ISMS in this repository

`Crestview/crestview-isms` is a separate Next.js 15 / React 19 / Supabase
application, not a static dashboard. It currently includes:

- 100 routed pages, 29 feature areas, and 31 Supabase migrations.
- Role-specific workspaces for proprietor/administrator, teacher, student,
  parent, HR, finance, librarian, and IT support.
- Student directory, admissions, attendance, academic structures, assessment,
  grades, lesson notes, report cards, parent engagement, staff operations,
  payroll foundations, fees, transport, boarding, feeding, inventory, reports,
  messaging, notifications, audit views, and school public pages.
- Supabase Auth, Postgres, Storage, Realtime and role-aware server actions,
  plus form validation and internal audit records.

The code is useful as a **reference implementation and feature source**. It
must not be mounted directly behind a new customer subdomain.

### Single-school constraints found in Crestview

The current database is school-scoped by deployment rather than by tenant:

- Core tables such as `profiles`, `students`, `classrooms`, `invoices`,
  `academic_years`, and `school_settings` do not have a `tenant_id`.
- Several values are globally unique: student numbers, invoice numbers, school
  settings keys, department codes, academic years, and subject codes.
- Role checks resolve one global profile role per authenticated user.
- Server actions query broad tables directly, assuming every returned record
  belongs to Crestview.
- Branding and public content are stored as one school's settings and assets.

Adding a `school_id` column only to a few tables would leave cross-school data
exposure paths and uniqueness conflicts. The tenancy boundary has to be
designed first, then enforced in every query, RPC, storage path, and RLS
policy.

### SimsPlus product research

The public SimsPlus product presents the commercial pattern AuraFlow needs:

- A marketing site with pricing, school discovery/sign-in, demo booking and a
  time-limited full-feature trial.
- A branded school URL such as `school-name.simsplus.io`.
- Per-student pricing, onboarding/data migration, and plan-based module
  packaging.
- Local operational focus: attendance, parent engagement, Mobile Money,
  communication, report cards, payroll/statutory workflows, low-connectivity
  operation, multi-currency and multi-campus support.
- An admin portal that prioritizes actionable operations: unmarked registers,
  enrolment, attendance, collections, calendar and shortcuts.

The authenticated Crestview demonstration was reviewed without creating,
editing, exporting, or deleting records. It demonstrated global navigation,
student directory/import/export, attendance command views, class-level
registers, finance setup, notifications, persona-aware portal access and
school-local settings. These are product patterns, not code or visual assets to
copy.

Public reference: <https://simsplus.io/>.

## Target Business Center model

AuraFlow should distinguish three surfaces:

1. **AuraFlow control plane** at the main app: marketing, demo booking,
   qualified lead intake, onboarding workspaces, plan quotes, provisioning,
   billing status, support, and platform administration.
2. **School tenant application** at a school subdomain or verified custom
   domain: the operating system for that school, branded and constrained by its
   plan.
3. **Optional public school website**: admissions, news, events and contact;
   it shares approved tenant branding/content but must not share administrative
   sessions or private data.

The same pattern can later host restaurant, commerce, clinic and industrial
systems without putting unrelated industry records into school tables.

## Required tenancy architecture

### Identity and domains

- `organizations`: legal customer account; supports multi-campus ownership.
- `tenants`: one deployable school/campus workspace with plan, lifecycle and
  operational settings.
- `tenant_domains`: subdomain/custom-domain reservation, verification,
  activation, TLS/hosting state and canonical domain.
- `tenant_memberships`: a user may belong to more than one tenant and have a
  distinct role per tenant.
- `platform_roles`: AuraFlow support/operations roles are separate from school
  roles. Platform staff receive time-bounded, audited support access rather
  than silently becoming school administrators.

Tenant resolution must happen at the edge from the host header. The server must
then attach a tenant context to every request. The browser must never submit a
tenant ID as an authority claim.

### Data and RLS

- Every customer-owned table receives `tenant_id not null` with an indexed
  foreign key.
- Global-looking identifiers become unique *within* a tenant, for example
  `(tenant_id, student_number)` and `(tenant_id, invoice_number)`.
- `school_settings.key` becomes unique as `(tenant_id, key)`.
- Policies call a stable `current_tenant_id()` / membership helper and do not
  trust route parameters alone.
- Security-definer functions use a constrained `search_path`, verify caller
  membership, and grant the minimum privileges.
- All storage object paths begin with the tenant UUID. Storage RLS checks both
  tenant membership and object ownership. No public buckets for student or
  finance records.
- Background jobs and webhooks identify the tenant only from signed server-side
  metadata, never from browser-provided payloads.

### Provisioning lifecycle

`lead -> demo -> qualified -> trial-pending -> provisioning -> active ->
suspended -> archived`.

Provisioning must be idempotent and asynchronous:

1. Reserve and validate the requested school slug.
2. Collect school/campus details, branding, curriculum, term calendar, staff
   count, student count, modules, and consent.
3. Create organization, tenant, owner membership, encrypted integration slots,
   private storage prefixes and base records in one controlled job.
4. Issue the owner invitation only after the tenant is ready.
5. Configure/verify the subdomain and make the tenant visible only after DNS/
   certificate/health checks pass.
6. Record every phase, administrator, error and retry key in a provisioning
   audit trail.

No customer should receive a usable URL before that tenant's security policies,
owner, theme, plan and baseline records exist.

## Crestview capability migration map

### Phase 1: viable school product

- Tenant settings, branding, custom domain/subdomain, owner/admin setup.
- Admissions/enrolment, student/guardian records, class setup, attendance.
- Academic years/terms, subjects, teacher assignments, assessments, grades and
  report cards.
- Fee structures, invoices, payments/reconciliation and receipts.
- Parent, teacher, student and school-admin portals.
- Notifications, messaging, audit history, exports and data-retention controls.
- Guided onboarding, data-import validation and an operator provisioning
  console.

### Phase 2: operational depth

- Staff directory, leave, payroll/statutory adapters, recruitment, ID cards.
- Transport, boarding, feeding, inventory, library, learner care and document
  workflows.
- Multi-campus organization console, cross-campus roles and aggregated reports.
- Offline-capable attendance with conflict handling, not merely a cached page.
- Ghana payment provider integrations and WhatsApp/SMS adapters with per-tenant
  credentials stored server-side.

### Phase 3: managed platform operations

- Plan entitlements and per-student/campus usage metering.
- Trial expiry, billing, invoices, dunning and controlled suspension.
- Support-access requests, health dashboards, backup/restore drills and
  tenant-safe analytics.
- Mobile applications sharing the same tenant/membership authorization model.

## Security gates before real schools

- Threat model and automated RLS tests for tenant isolation, including direct
  object reference attempts across every major table and bucket.
- Independent review of all security-definer functions and service-role jobs.
- MFA for platform administrators; recovery, session revocation, login
  throttling, abuse monitoring and audit alerts.
- Encryption/key-management design, backups with tested restores, retention and
  deletion processes, incident response and Ghana privacy/education review.
- Payment and messaging webhooks with signature verification, replay
  protection, idempotency and tenant-bound metadata.
- Load, low-bandwidth, accessibility and disaster-recovery tests before
  accepting production student or financial data.

## Explicit non-goals for the first build step

- Do not transplant Crestview migrations into AuraFlow's current Supabase
  project.
- Do not reuse Crestview's existing database as a shared multi-school database.
- Do not create customer tenants, DNS records, payment products or live demo
  bookings during discovery.
- Do not claim compliance, 99.9% uptime, complete backups, or offline support
  until those are implemented and verified.

## Recommended next engineering deliverable

Create an isolated `business-center` service/app boundary and a versioned
Supabase schema for the control plane and tenant core. The first implementation
slice should cover school demo booking, subdomain reservation, owner
provisioning, tenant membership/RLS, branding, plan entitlements and a blank
tenant shell. Only then move Crestview modules into tenant-scoped slices, one
domain at a time, with migration and authorization tests.
