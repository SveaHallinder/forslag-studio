# Source brand profile

User approved the optional branding profile and implementation on 27 September. No dependencies or credentials needed. Existing typography and accent fields remain authoritative.

1. Add optional branding roles: background, surface, text, mutedText, secondary, headerBackground, headerText, logoLight, logoDark. Normalize colors/URLs strictly; old projects remain unchanged. Add Node regression tests first.
2. Extend conservative CSS extraction to actual body, paragraph, header and section roles, including neutral colors. Skip conditional conflicts and gradients. Resolve transparent ancestor backgrounds without inheriting arbitrary sibling styles. Include original header logo context. Preserve a header inline SVG only as a raster image through the existing image-only export path.
3. Apply brand roles after template styles; preserve composition and original fonts. Choose a supplied logo variant for the header background, with readable text. Add explicit color-role controls and logo variant choices; missing colors retain template defaults unless user chooses them.
4. Propagate profile and logo assets through multipage rendering, public links and standalone HTML export. Cover old data, invalid inputs, dark/light logos and export in tests.
5. Run lint, Node tests, browser extraction/layout and real import checks. Publish through existing Sites workflow, push private Git backup and provide per-file diffs with QA.

Acceptance: the brand influences more than CTA; white logos can render on a dark header without a plate; original text/images stay associated. Static CSS cannot reproduce all JavaScript/theme-dependent styling; uncertain roles must remain unset and editable.
