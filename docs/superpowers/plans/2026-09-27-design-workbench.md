# Design workbench implementation plan

Goal: ship the five approved improvements while retaining original content and old-project compatibility.
Architecture: small pure presentation module, editor-only UI helpers, existing shared renderer and importer. Vanilla modules/CSS; no dependencies.

- [ ] Three directions: public/design-directions.mjs + tests/design-directions.test.mjs. Export recommendDirections(project), three unique existing template IDs, names/reasons. No mutation; preserve source in previews.
- [ ] Inline preview selection: public/preview-edit.mjs, tests/preview-edit-browser.html; installPreviewEditing(doc,{onSelect}) decorates known DOM controls only in the editor. Dispose listeners and styles; event capture prevents demo navigation in edit mode. Studio maps selection to controls.
- [ ] Approved optional fields: card.kind; gallery item.presentation {fit,x,y}; page.original snapshot of imported headline/description/hero/cards/navigation/branding/typography. Normalize safe bounded fields, no recursion; legacy absent fields stay absent. Schema approval required before this step.
- [ ] Semantic sections: public/section-design.mjs, public/render.mjs, public/import-content.mjs. Detect conservative semantic cues; explicit override selects known enum. Render source text verbatim, no fabricated schema. Regression verifies escape, precedence and copy preservation.
- [ ] Visual media editor: public/design-workbench.mjs + CSS and dialog HTML. Thumbnail selection and fit/focus controls bound to gallery records. Confirm applies, cancel discards. Existing legacy heroPosition remains fallback.
- [ ] Comparison: snapshot on import; pure diff helper identifies changed/removed sections by source anchor and changed hero/nav. Original-content column and actionable editor links. Legacy empty state prompts reimport without claiming a snapshot exists.
- [ ] Integration: mount workbench via small callbacks in studio.mjs, preserve subpage selection, existing fields, save/share/export. Strip original snapshot from customer sharing.
- [ ] Verification: npm run lint; npm test; npm run build. Browser keyboard/edit/navigation, comparison, three previews, media cancel/commit, 375/1200 layout, legacy restore and roundtrip. Screenshot and README QA 6 steps; publish exact checked commit, push private backup and generate per-file diffs.

## Current checkpoint

Implemented and checked: three directions, click text/image editing, visual image selection, conservative derived section styles, session-only original comparison and restoration. 170 Node tests, 5 preview-edit browser checks and 30 semantic layouts pass. New dialogs checked at 375 px.

Schema question remains pending: card.kind override; image presentation fit/x/y; persisted original snapshot. These fields have NOT been implemented. User must approve before continuing dependent persistence work. Comparison uses a WeakMap during the session and can fetch a fresh original without mutating the proposal.
