# Editing and removing invoices

In `/studio/`, open **Invoices**, then open an invoice.

- Drafts keep their existing editing controls.
- **Edit invoice** opens an issued invoice's fees, dates, reference, terms, payment instructions, and notes. **Save changes** asks for confirmation. The invoice keeps its number, client/studio billing identity, issue status, and payment ledger.
- **Update client details** compares an issued invoice's saved billing name, contact, email, and address with the latest client record. Confirm **Update this invoice** to apply those details to that invoice and its PDF only. Other issued invoices stay unchanged, including when you save ordinary invoice edits. Save or cancel any unsaved invoice edits before using this action. Drafts continue to use current client details as before.
- **Download PDF** uses the latest saved version. **Activity → Previous PDFs** provides earlier versions. Send revised PDFs to clients separately; saving never sends email.
- **Remove invoice** asks for confirmation and moves any draft, issued, or void invoice into **Invoices → Removed**. Removed invoices leave active project/document lists and outstanding totals. Payment history still contributes to the all-time payments total.
- Open a removed invoice and choose **Restore invoice** to return it to its prior status. Removal does not erase records, payments, or stored PDFs.
- An issued total cannot fall below recorded, unreversed payments. Required issue fields still apply. Voided invoices remain read-only; they can be duplicated into a new draft.

## Storage and deployment

Deploy the updated `studio/index.html` using the site's normal deployment process. No new Supabase table, column, policy, or migration is required. Existing access controls still apply.

The existing document `data` JSON gains a reserved `_studio` object containing removal state, lifecycle changes, and earlier issued snapshots/PDF references. It is preserved during draft saves, stripped from new duplicates and client-facing snapshots, and included in the existing JSON backup export. History and the invoice update are saved together in one row update. Number sequences and original PDF objects are untouched.

An issued edit replaces the current snapshot and clears its old PDF pointer; the latest PDF is generated from that snapshot using the existing renderer. Previous downloads use an existing stored PDF when available, otherwise regenerate from the retained snapshot. Client billing identity changes only through the explicit per-invoice update action. Studio identity is always preserved.

Client updates retain the previous snapshot/PDF and add `client-details-updated` to Activity. They follow the invoice's saved client ID (with a project lookup for older snapshots lacking an ID), omit private client notes, and check the reviewed client details and invoice revision before saving. A changed preview must be reviewed again. Reapplying identical billing details is a no-op. Voided/removed invoices and proposals cannot use this action; restore a removed invoice first.

Document writes compare the stored revision and status; stale/conflicting edits or denied writes return an error instead of success. Payment reads must succeed before allowing an issued edit. The existing separate payment-table operations are not a database transaction with document edits; simultaneous payment entry and amount edits across sessions still require serialized use. Old open Studio tabs should be refreshed after deployment so they use the removal checks.

Removed invoices retain their source-proposal relationship and prevent accidentally converting the same proposal again. Restore/edit the existing invoice when appropriate.

## Verification

Run `node tests/studio-invoices-browser.cjs` with Playwright available and Chrome installed. The test routes the app locally, substitutes an in-memory Supabase fixture, and uses the two existing pinned public PDF scripts. It never signs in to or writes to production.

Optional environment variables:

- `STUDIO_PDF_CACHE`: directory containing `pdfmake.min.js` and `vfs_fonts.js` from the site's pinned PDFMake 0.2.20 release, for fully offline tests.
- `STUDIO_SCREENSHOT_DIR`: directory for desktop history and mobile editing screenshots.

Checks cover issued editing and PDF downloads, private-note exclusion, cancellation, stale/conflicting writes, permission failures, required fields, paid balance limits, remove/restore, cloned metadata, manual client refresh without changing other invoices, and mobile layout. Live Supabase authorization and deployment must be verified in the user's normal environment; these tests do not alter real invoices.
