# Validation

Original pilot verified on 5 September 2026. Institution administration upgrade verified on 14 September 2026 on Windows with Node.js 24.15.0.

| Check                                                       | Result                                                            |
| ----------------------------------------------------------- | ----------------------------------------------------------------- |
| TypeScript (`npm run typecheck`)                            | Passed                                                            |
| Application lint (`npm run lint`)                           | Passed                                                            |
| Unit and migration tests (`npm test`)                       | 10 passed                                                         |
| Local API/database integration (`npm run test:integration`) | 43 passed                                                         |
| Production build (`npm run build`)                          | Passed; repeated for the final publication source                 |
| Local HTTP rendering                                        | `/` returned HTTP 200; local status confirmed the seeded database |
| Database migrations                                         | Four migrations applied locally; legacy-data preservation tested  |

Integration checks cover anonymous and cross-origin access, lecturer ownership, cross-institution access, student enrollment, locked content and downloads, protected files and captions, file-signature rejection, module prerequisites, concurrent starts, fixed deadlines on resume, answer-key removal, forged scores, attempt limits, late submissions, automatic and manual grading, grade withholding/release, batch grade import validation, one-use invitations, revoked access, and disabled unconfigured payments.

Unit tests cover scoring, question-bank validation and randomization, student question projection, password verification, payment-data matching and webhook signatures. Provider interaction has not been tested against a real Paystack sandbox or live merchant account.

The administration checks also cover role-restricted directory access, search without password disclosure, duplicate department codes, invalid academic dates, ownership transfers, competing allocations, foreign-tenant department/account/history access, prevention of administrator lockout, account suspension and restoration, session inventory and scoped revocation, replacement and revoked invitations, mandatory regrade reasons, simultaneous grade writes, stale publication requests, and grade ledger values/actors. Migration tests apply the old schema to existing fictional records before upgrading, prove that records survive, verify grade/history rollback on constraint failure, check session metadata deletion and inspect index usage.

The first interrupted package installation left Windows native dependencies incomplete. Their archives were recovered and checked against the lockfile integrity values before installation. No dependency versions were changed to bypass that failure. Generated UI catalog files and the unmodified starter mobile hook have existing lint findings and are excluded from the application lint pass; TypeScript still checks the complete project.

Local browser checks now cover demonstration sign-in, the institution directory, department creation and success feedback, allocation selectors and cancellation, active sessions, and the grade-history dialog. The institution screen was inspected at the narrow in-app viewport and a 1280 × 900 desktop viewport. The review found and fixed numeric status text and horizontal overflow. The viewport override was reset afterward. These are targeted checks, not a full end-to-end browser suite.

No assistive-technology test, penetration test, load test, restore drill, real email delivery, or Ghana compliance review has been completed. Responsive styling and accessible primitives are implemented but are not an accessibility certification. The framework’s build output notes that its beta route classifier cannot classify the root page statically; the application builds and the local route responds.

The deployed pilot starts with an empty database. Local fictional accounts and integration fixtures are not deployed. Hosted college provisioning is an owner-performed step using the private setup note.
