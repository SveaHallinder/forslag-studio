# Proposal refinements implementation plan

Approved direction: better source images and industry-specific content first, retaining the existing three-design picker and customer review. No new dependencies or schema.

1. Test and implement deterministic photo choice within each imported section. Prefer readable source variants; keep logos/certifications separate and retain every source gallery association. Unknown-size first photos remain conservative.
2. Test and implement industry review checks, plus an optional short introduction that moves the exact remainder into a new section. Never generate company claims, prices, reviews or availability. Preserve links, manually framed photos and originals.
3. Extend the existing whole-page review with before/after text, separate image/text opt-ins, stale-plan protection and undo. Reuse current visual styles and three-design picker.
4. Test import DOM fixtures and the review/apply/undo flow at desktop and mobile sizes on a separate QA origin. Run unit tests, lint, build; publish the same public Site and push the exact commit.

Files: public/import-photo.mjs, public/import-content.mjs, public/proposal-refinements.mjs, public/whole-page-quality.mjs, public/design-workbench.css; focused Node/browser tests and QA receipt. The implementation is sequential and does not touch saved projects or existing drafts.
