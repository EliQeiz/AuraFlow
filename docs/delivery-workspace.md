# Delivery workspace and template experience

Implementation checkpoint: 2026-09-09. This work is local, on `codex/platform-rebuild`; it has not been deployed.

## Five connected client features

1. **Milestone checklist**: administrators publish milestones, assign responsibility to the client or team, and set due dates. Clients can complete and reopen only client-assigned milestones. The project shows completion progress and overdue dates.
2. **Version approvals**: an administrator publishes a named version with a reference URL and brief. The client approves or requests changes. The decision and original reference are immutable after the response. Publish another approval record for a new version. Approval records are versioned references, not copies of an external website; use a stable version-specific preview URL.
3. **Tracked change requests**: clients submit titled, detailed scope changes. Administrators accept or decline them, provide feedback, and mark accepted requests complete. The legacy revision-message form remains available.
4. **Activity inbox**: both sides receive project workflow events and admin status updates. Read markers persist per account. Links return to the relevant project. This is an in-app inbox, not email, mobile push, or an SLA notification service.
5. **Studio checkpoints**: saving a design atomically stores an immutable checkpoint. History restores a checkpoint into the editor; saving creates a new revision. Undo can recover the previous editor state. Optimistic concurrency still prevents a stale tab from replacing newer work. Submitted briefs retain their original design snapshot.

## Five admin tools

1. **Priority and workload triage**: normal, high, and urgent priority with review, overdue, and urgent filters; metrics reflect actual loaded project records.
2. **Bulk status updates**: select up to five projects, confirm, and update their statuses and activity events in one atomic batch.
3. **Private team notes**: append-only project notes stored in an administrator-only collection, separate from client-readable records.
4. **Saved replies**: manage personal reusable responses and insert them into project or support conversations. Insertion fills the composer; it does not send without review.
5. **Operational reports**: export the filtered project list as CSV, including status, priority, deadline, and budget. CSV cells are escaped and formula-prefixed inputs are neutralized. Exports contain client information and must be handled as private records. Budget is not paid revenue.

## Data and access contracts

- `projects/{id}/workItems/{itemId}`: role-checked milestone, review, and change transitions; no deletion or edits to original titles, details, owners, or URLs after publication.
- `projectEvents/{id}`: append-only events tied by `getAfter` to the actual changed project/work item. The recipient must be the true project owner. A client cannot create activity for another client or write an event without the corresponding state change.
- `users/{uid}/eventReads/{eventId}`: owner-only read markers.
- `projectOps/{projectId}` and `projects/{id}/internalNotes/{id}`: administrator-only.
- `users/{uid}/snippets/{id}`: administrator-owned saved replies.
- `users/{uid}/drafts/{id}/versions/{revision}`: owner-only, immutable snapshots matching the draft saved in the same operation.
- `firestore.indexes.json` adds the activity query index on owner and creation date. Publish rules and indexes with the application when staging this release; the older deployed rules do not allow the new collections.

Limits are explicit in the interface: 100 recent projects, 100 workflow items per project, 100 activity events, 50 visible checkpoints, and five projects per bulk update. These are bounded working views, not a complete historical reporting warehouse. Future scale work should add cursor-based history and server-computed metrics. Existing drafts acquire checkpoint history on their next save; previous versions cannot be reconstructed retroactively.

The five-project batch size is deliberately conservative relative to Firestore's atomic rule access limits. Reference: [Firebase transactions and batched writes](https://firebase.google.com/docs/firestore/manage-data/transactions).

## Visual and motion changes

- Website template covers use category-specific image compositions, small browser frames, varied editorial and modern typography, and relevant gallery images.
- Business-system cards render the actual suite canvas, scaled to the available card width. Thumbnail controls are inert; the full studio remains interactive.
- Framer Motion drives slow image pans and crossfades. Reels have play/pause, pause offscreen and in hidden browser tabs, avoid autoplay on data-saving connections, and respond to reduced-motion changes without reloading.
- Gallery cards animate on hover/focus or explicit play; only the featured website reel autoplays when visible. The gallery initially renders 12 entries and loads more on demand.
- Motion is an animated image reel, not a generated video file. No video-player dependencies were added.
- Portal changes include compact buttons, clearer hierarchy, workflow tabs, restrained status treatments, bounded tables, responsive forms, and theme-aware dialogs. Template descriptions now explain the actual industry content instead of repeating generic launch language.

## Verification and release boundaries

The regression suite covers client/admin decisions, milestone completion, private notes, priority changes, bulk updates, CSV download, saved replies, persistent inbox reads, checkpoint restoration, reduced motion, and mobile overflow. Security emulator tests cover tenant isolation, role restrictions, immutable events and versions, and the five-project batch.

These checks do not certify the platform or implement operational school, hospitality, or commerce runtimes. Production provider setup, authorized domains, owner claims, App Check, administrator MFA, upload scanning, rate limits, backups, and production data migration remain release gates in `rebuild-status.md`. Existing sample suite records are prototypes, not live schools, bookings, or inventory.
