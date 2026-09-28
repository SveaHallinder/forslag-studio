# Generated website composition quality

User explicitly requests implementation after rejecting the current visual quality. Scope: improve the generated sites, preserve source content/branding and all editing paths. No dependency or saved schema change.

## Design

Use existing template IDs with stronger visual identities: story becomes an asymmetric editorial split; studio a large typographic masthead; services a precise split; dining/wellness/hospitality retain warm photographic identities; retail gets a product-led composition; consulting stays restrained. Imported brand colors and fonts win. No fabricated metrics, testimonials, imagery or marketing claims.

Content structure drives rhythm. Title-only linked blocks become compact navigation tiles, long text/image blocks alternate, introductory text gets a two-column hierarchy, and galleries use smaller image rows with intact captions. Copy retains every character; paragraphs render as block spans inside the existing editable paragraph. All card DOM order/anchors remain stable. Empty contact sections are compact rather than giant visual dead ends.

## Implementation

- [x] Add regression tests for paragraph text preservation, source order/anchors, derived layout roles, gallery-count attributes and editor selection.
- [x] public/composition.mjs: pure presentation helpers and responsive CSS, separate from schema. No image guessing/cropping override; explicit image presentation still wins.
- [x] public/render.mjs: minimal helper integration, derived card/hero attributes, block spans in existing text nodes; same renderer used by preview/share/export.
- [x] Visual comparison with DOM-derived real HallInc content and original images. Preserve before screenshot. Inspect desktop, mobile and long/missing-content cases.
- [x] Lint/build/192 Node tests, browser layout/edit suites and independent review. Fixed contrast, FAQ width, retail order, reduced motion and mobile hero gallery findings.
- [x] Conservative logo framing helper plus existing-project control. Real HallInc mixed transparent/white border regression; 904 × 188 result survives save/reload.
- [ ] Publish exact commit, Git backup and per-file diff report. Deployment evidence is recorded outside the source archive after publication.
