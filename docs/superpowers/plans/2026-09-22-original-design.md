# Original design implementation plan

Goal: preserve original fonts and trustworthy brand colors through import, editing, saved projects, previews, links and HTML export; support source-grouped image collections when their optional fields are approved.
Architecture: keep existing DOM import and six templates. Add isolated CSS evidence extraction and sanitized font rendering. Never run source scripts or attach source CSS. Extend the existing bounded public asset reader for font files. Old projects retain template typography.
Tech stack: native JavaScript modules, CSSOM, IndexedDB, Worker, node:test. No package dependencies.

- [x] Add failing normalization/render/share/export/font-reader tests. Check font CSS injection, missing files, old projects and subpages.
- [x] Implement optional typography {heading,body,faces}; font faces contain family, URL, weight, style and unicode range. Retain only selected families; strict CSS and URL validation.
- [x] Extract matched inherited font declarations and scoped brand variables with CSSOM; resolve safe variables; preserve font subsets. Do not use unrelated component colors or ambiguous conditional overrides. Add DOM regressions first.
- [x] Integrate font edits and status in Innehåll. Use same-origin bounded font loading, and embed required font bytes for standalone export. Failed embedding must report an error.
- [x] After image-list approval, add optional section image lists, preserve source order and captions, provide editor controls for correction, and carry them through save/share/export. Do not borrow from adjacent heading scopes.
- [x] Run npm run lint, npm test, npm run build, DOM suites and UI import/save/reload/mobile checks. Review changes, publish to existing public Sites project and push private Git backup. Deliver per-file diffs and five-step QA.

Authorization: user explicitly requested all remaining design work and thereby approved the previously proposed typography field. Additional image-list fields were asked separately; user then instructed continuation and publication of all work, taken as approval to proceed with those proposed lists. Original content and existing six-template product direction were approved earlier.
