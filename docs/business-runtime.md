# Business Runtime: Pilot Release

This increment introduces actual business records alongside the existing design-and-delivery workspace. It is a pilot, not a claim that AuraFlow is a complete school ERP, payment processor, or no-code publishing system.

## Available Workflows

- `/dashboard/businesses`: owners create up to five private school or restaurant systems. Claimed AuraFlow administrators can review every business and activate or suspend its public address.
- `/b/:businessId`: an activated business gets a shared-domain website. Restaurant customers sign in to place orders and see only their own order history. Schools expose contact information, never pupil records.
- Restaurants configure dishes, categories, integer-minor-unit prices, availability, currency, pickup/delivery, delivery fees, and an ordering pause. Checkout prices are calculated by the server against the current menu. Orders have guarded fulfilment transitions and idempotent submission IDs.
- Schools configure classes, academic year and term, maintain students/guardians and admission numbers, and record daily attendance. CSV export escapes spreadsheet formula prefixes. This pilot caps each school at 300 students.
- Business configuration and attendance use optimistic concurrency checks. Audit events are server written. Business endpoints require Firebase ID tokens; owner/admin checks happen on the server, not just in navigation.
- Each restaurant can have its own WhatsApp Cloud API credentials. Customer opt-in is recorded with the order. Operators explicitly submit an order-status template. Uncertain sends are not retried automatically.
- Studio: Shift multi-selection, grouped movement with boundary preservation, alignment/distribution, inline text editing, duplicate pages, duplicate selections, undo/redo and keyboard commands. Existing 12-layer security limits remain in force. Layout replacement now preserves other pages.

## Local Verification

All runtime tests must use the `demo-auraflow` emulators. Never run test seeding against production.

1. Start Firebase Auth, Firestore and Storage emulators using the existing `firebase.json` (ports 9799, 8780, 9798).
2. `npm run dev:business` starts an emulator-only Node API adapter at `127.0.0.1:5192`.
3. `npm run dev:demo -- --port 5190` starts Vite, which proxies the two business API paths to the adapter.
4. `npm run test:business` tests pricing, transitions, webhook signatures and studio editing operations.
5. With `FIRESTORE_EMULATOR_HOST=127.0.0.1:8780`, run `npm run test:business:integration`.
6. With that variable and `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9799`, run `npx playwright test tests/e2e/business.spec.ts` while the API adapter is running. Playwright starts its own Vite instance.

The local API adapter always sets the demo project and emulator addresses. It refuses production mode.

## Production Configuration

Set these as **server-only environment variables**, never `VITE_*`, source-controlled JSON files, browser storage or support-chat attachments:

- `FIREBASE_PROJECT_ID`: the intended AuraFlow Firebase project.
- `FIREBASE_SERVICE_ACCOUNT_JSON`: server credential JSON for that project, or provide supported application-default credentials. Provision a dedicated service identity and review its Firestore/Auth permissions. Do not use an owner's personal credential file.
- `WHATSAPP_GRAPH_VERSION`: a supported, explicitly chosen Meta Graph API version.
- `WHATSAPP_TENANTS_JSON`: object keyed by AuraFlow business UUID. Each entry has `phoneNumberId`, `accessToken`, `templateName`, and `language`. Phone-number IDs must be unique per business.
- `WHATSAPP_APP_SECRET`: the Meta application's webhook signing secret.
- `WHATSAPP_VERIFY_TOKEN`: a long random verification token for the webhook handshake.

`/api/whatsapp` requires the exact raw request body for HMAC verification. Configure Meta's callback to the production HTTPS URL and subscribe to message status events. The approved template must have two text body parameters, in order: order reference and order status. Do not put pupil records in WhatsApp messages.

Credentials must be obtained through a secure owner-onboarding process. The current UI routes operators to AuraFlow to arrange that connection; embedded Meta signup is **not implemented**. No live messages are sent by automated tests. API acceptance is not proof of message delivery; delivery depends on signed provider callbacks.

Reference: [Meta's Cloud API examples](https://github.com/fbsamples/whatsapp-api-examples), including signature validation and template messaging. Review Meta's current consent, template and account requirements before onboarding a live restaurant.

## Security Boundaries

The existing default-deny Firestore rules deliberately block all direct client reads/writes of `businesses`, its nested records, quota documents and WhatsApp delivery metadata. Only the Firebase Admin-backed API can access these collections. The public API returns an explicit field allowlist and never the owner UID, roster or orders. Unknown tenants return the same not-found response as unauthorized tenants.

The API rejects non-JSON writes, bounds payload sizes and validates strict command schemas. Per-user API and order limits are transactional. Production emulators are refused. No wildcard CORS is added. School/restaurant records do not reuse the legacy Supabase media API or its authentication.

## Remaining Commercial Release Gates

- Production server credentials and dedicated WhatsApp onboarding/provider validation have not been supplied or exercised by these local tests.
- Production Storage was previously blocked by the Firebase project's closed billing account. Restoring that account is required before promising live file uploads.
- No online payments, subscription billing, refunds, tax reconciliation, or payment webhooks yet. Restaurant orders explicitly use payment on pickup/delivery.
- No staff invitation/role system for tenant employees yet. This pilot supports business owners and AuraFlow administrators only. Teacher, parent and student portals still require scoped runtime roles and tests.
- School fees, grading, payroll, timetables and admissions workflows from Crestview are not migrated into this runtime yet.
- No inbound WhatsApp conversational ordering, embedded signup or autonomous message retry worker. The website creates orders; the Cloud API sends consented status updates.
- Studio designs remain versioned specifications. This pilot does not compile arbitrary canvas layers into a production system. Larger documents, responsive constraints, reusable components and media-rich publishing remain work.
- Listings are bounded: 100 businesses, 100 recent orders, 300 students, 30 attendance dates and 50 audit events per workspace response. Before exceeding the pilot limits, add paginated retrieval, index planning, archival/retention and measured load testing.
- Before a paid launch: staging deployment, backups/restore drills, monitoring, abuse/App Check strategy, privacy/retention review, accessibility review and end-to-end provider tests.
