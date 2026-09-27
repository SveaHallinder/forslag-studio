# Design workbench

User approved all five proposed improvements on 27 September. No new packages or accounts. Optional persistence additions await the explicit schema question; independent controls use existing fields.

1. Content-aware sections: conservative Swedish/English detection of service, product, team, case study, pricing, testimonial and FAQ from source headings/structure. Unknown stays generic. Explicit override, preserve every original string and linked image. Distinct responsive presentation, no invented prices, ratings, quotes or people.
2. Three directions: show three actual previews of the current company's content using existing template IDs, with a short reason based on its content. Applying one changes only templateId. Cancel never changes content.
3. Image picker: searchable thumbnail dialog per hero/card/gallery image; selected state and empty/error feedback. Fit/cover and horizontal/vertical focal points, applied to preview, saved project, share and HTML. No image manipulation dependency.
4. Compare: original extracted snapshot alongside editable proposal and contextual difference/review rows. Explicitly label snapshot as imported content, not original visual rendering. Optional original website iframe loaded only on request with always-visible original link and blockage guidance. Original arbitrary HTML never injected. Snapshot excludes executable markup and transient data; omit it from customer links/export.
5. Click editing: explicit Edit mode in preview. Click/Enter/Space on title, text, image, navigation or contact reveals corresponding editor control. Links do not navigate in edit mode; View mode retains functional demo links. No editing controls in customer output. Focus indication, 44px controls, Escape exits mode.

Acceptance: unchanged old projects, source copy intact, deterministic safe classification, three distinct template choices, cancel-safe picker, focal data through save/share/export, comparison distinguishes removed/changed/missing snapshot, edit mode on root/subpages, keyboard support and no mobile overflow. Lint/build/Node regression, dedicated browser fixtures and real editor UI checks precede publication.
