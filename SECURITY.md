# AuraFlow Security Notes

## Client And Admin Boundary

- Project briefs live in Firestore `projects/{projectId}` and project chat lives in `projects/{projectId}/messages/{messageId}`.
- Client creates and reads are scoped to `request.auth.uid == project.userId`, including prototype specs, hosted-system choices, reference links, attached assets, previews, revision notes, and project chat.
- Admin project reads, status changes, preview uploads, and admin chat replies require the Firebase Authentication custom claim `admin: true`.
- The browser must never set admin claims. Grant them with a trusted Admin SDK workflow after verifying the CEO/admin account UID; `npm run grant-admin -- <uid>` is the local helper for that trusted workflow.
- Treat client-uploaded images, PDFs, links, and business descriptions as confidential client material, even when they are ordinary marketing assets.

## Storage Boundary

- Client reference uploads use `projects/{uid}/{projectId}/references/...`.
- Admin previews use `projects/{uid}/{projectId}/previews/...`.
- Storage rules restrict references to the owning UID plus admins, preview writes to admins, file types to images/PDFs, and request uploads to 10MB.
- Treat preview and reference links as sensitive material even when the Firestore document containing them is private.

## Credential Handling

- Firebase web config values may be exposed to the browser, but service-account JSON, private API keys, admin SDK credentials, and third-party credentials must never be committed.
- Do not use a real client's credentials for research or testing unless AuraFlow owns the account or has explicit written permission.
- For external product references, prefer public pages, screenshots, documentation, or owned demo accounts with throwaway passwords.

## Release Checklist

1. Enable Firebase Auth providers and Firebase Storage in the production project.
2. Deploy Firestore rules, Firestore indexes, and Storage rules before Vercel points traffic at the app.
3. Turn on Firebase App Check enforcement after the web app is registered and token traffic is verified.
4. Test one client account and one admin-claimed account with the Emulator Suite or a staging Firebase project.
5. Review Firestore and Storage rule changes before each deploy.
6. Keep Firebase API restrictions, authorized domains, App Check, and billing alerts enabled before production traffic.
