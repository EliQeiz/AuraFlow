# AuraFlow platform rebuild

## Product contract

AuraFlow has three experiences: a public business website, an authenticated customer workspace, and a claims-protected operator console. The workspace must function independently of the website so native clients can reuse account, authorization, project, and suite contracts.

The customer journey: explore a suite, create an account, configure a prototype, save a draft, submit a brief, exchange files and messages, review work, request changes, and receive a delivered system. A configured prototype is not a deployed school, store, or hotel system. Runtime capabilities must be labelled and tested separately.

## Design direction

References: Shopify admin information hierarchy and familiar controls; Linear project lists and contextual conversations; Webflow separated canvas and property inspector. These are workflow references, not copied layouts or assets.

- Neutral charcoal or white surfaces, violet primary actions, cyan secondary accents.
- Body-sized control typography, consistent icons, visible keyboard focus.
- Full-width application shell and durable navigation.
- Restrained transitions that honor reduced motion.
- Honest data and explicit empty, loading, failure, saving, and success states.
- Ghana-first business identity and relevant industry photography.

## Architecture

- Firebase remains the account and business-data authority for existing clients.
- Framework-independent domain schemas validate writes before the persistence adapter.
- Firestore rules enforce ownership and privileged mutations independently of the UI.
- Live subscriptions are scoped to the current identity and disposed on logout/navigation.
- A studio document is a versioned draft; a submitted request is a durable client record.
- Marketing, authentication, and workspace layouts have independent route boundaries.
- The pre-existing Supabase media-processing API is a separate subsystem, not the business platform's identity provider.

## Release evidence

Before production replacement: build and lint, domain tests, Firebase emulator authorization tests, browser workflows on desktop/mobile, and an account/provider/environment check. Native packaging, payment processing, domain provisioning, and fully operational industry suites require their own implementation and release evidence; a responsive website does not establish these capabilities.

## References

- https://shopify.dev/docs/apps/design
- https://linear.app/docs/customer-requests
- https://help.webflow.com/hc/en-us/articles/41015796747667-Site-roles-and-permissions
- https://firebase.google.com/docs/auth/web/redirect-best-practices
