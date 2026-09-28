# Vegavista customer demo polish

**Goal:** Make the selected Vegavista pilot ready for visual sales review while improving the same general importer/renderer used by all projects. The user approved continuation of the existing direction and selected Vegavista. No new dependencies or saved fields.

**Design:** Preserve original fonts, palette, copy, navigation and image associations. Fix the wrong hero candidate and duplicated list heading in imported copy. Consecutive short image cards become a two-column portfolio on desktop, one column on phones. Large feature stories stay full-width. Preserve all source anchors and editor indices. Use existing image presentation overrides, never crop away image content automatically.

**Architecture:** Import changes in public/import-content.mjs and a browser regression fixture. Pure, render-time compact-card indices in public/composition.mjs, passed as a derived attribute by public/render.mjs; CSS responds to it without saved schema changes. No domain-specific conditionals. Customer pilot stays a separate saved proposal and export artifact, not a hardcoded template.

- [x] Reproduce hero and duplicate-description bugs using the current Vegavista HTML and a minimal Squarespace fixture; implement the narrow fix, retaining other image/heading behavior.
- [x] Add tests for consecutive short-image cards, exclusion of team/testimonial/FAQ/gallery/long text, source order, anchors, manual image styles and no input mutation. Implement derived `data-density="compact"` only for runs of at least two eligible cards.
- [x] Style compact cards in two desktop columns with consistent image height, restrained 24–30px headings and 14–16px copy; one mobile column. Keep full-width complex sections and existing colors/fonts.
- [x] Reimport Vegavista, inspect first view and all ten image/place/size associations, select best existing template. Save and verify customer link locally; retain project backup and screenshots.
- [x] Run lint/build/Node and relevant browser regressions; review diff. Publish exact source, Git backup, per-file diff and six-step QA.

Validation: lint/build/195 Node tests, 16 pilot import checks, 83 existing import checks, 30 portfolio scenarios. Publication result and exact commit recorded outside the checkout in the release diff report.
