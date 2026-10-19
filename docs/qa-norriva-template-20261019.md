# Norriva template — 2026-10-19

| Before | After | Why |
|---|---|---|
| Standalone supplied HTML | Norriva in the existing template library | Reusable with each customer’s content |
| Fixed company styling | Light headings, centered hero, wide imagery, rounded product/FAQ/contact sections | Preserve the reference composition while retaining project colors and content |
| Reference-only font data | Embedded supplied fonts with original license | Standalone exports without a font network dependency |

No new dependency or database schema. The reference product configurator is not included; this is a reusable visual template. Norriva company details and images are not inserted into other projects. Custom project fonts remain available by disabling the template-font option.

Validation: 467 unit tests passed; build passed. Dedicated browser fixture: 241 checks passed across 320, 390, 820 and 1280 pixels, source images/text-only/custom typography/long content, navigation, FAQ and encoded customer links. Actual template picker: search shows one of 18 designs; mobile preview and applying Norriva passed without modifying fixture content. Existing saved projects and restored drafts were not changed.

## QA script
1. Open localhost:4183 and open a proposal.
2. Choose Design → Välj design → Alla designer; search Norriva.
3. Preview Desktop and Mobil. Check the heading, images, products and contact section.
4. Apply Norriva; verify the original company text, accent and destination links remain.
5. Use Granska & dela and open the customer demo or standalone HTML.

Browser fixtures: /qa/norriva-browser.html and /qa/norriva-picker-browser.html on the separate QA server. The former uses the local-only /concepts/norriva-fixture.json extracted from the user’s supplied HTML, not a production customer project.
