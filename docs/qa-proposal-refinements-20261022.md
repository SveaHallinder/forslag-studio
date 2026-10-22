# Förslag Studio — proposal refinements, 2026-10-22

| Before | After | Why |
|---|---|---|
| First readable photo in each block | Readability ranking within the same source block | Avoid a small thumbnail ahead of a larger source photo without borrowing another product’s image |
| Gallery thumbnails could pass after replacing the hero | Small gallery images remain quality reminders | Review every visible image group |
| Generic content review | Conservative industry-specific reminders | Café menu/hours/address, consultant services/cases, products, treatments, completed projects and hotel rooms |
| Long introduction only flagged | Optional short introduction with original comparison | Exact remaining words move into a new editable section; no fact generation |
| Image-only apply/undo | Separate image and text choices, combined apply and undo | Preview changes without overwriting newer edits |

No dependencies or schema changes. The existing three distinct design recommendations remain available under Få tre förslag. The update prioritizes image selection and industry-specific review; it does not generate missing prices, testimonials or business information. Readability ranking uses supplied dimensions, not an AI judgment of relevance or sharpness; unknown-size first photos keep their source order. Existing manual framing is retained. Real booking/payment/provider acceptance is unchanged.

Validation: 481 Node tests, lint and build passed. Real DOM import fixture: 93 passing cases, including the two new image-ownership cases. Refinement UI fixture: 124 passing checks across 18 customer designs at 320/1280px, including cancel, separate image/text choices, combined apply, undo, stale plan rejection, original copy/contact/branding preservation and working mail destinations. The actual 390px review dialog fits without horizontal overflow and has at least 44px action buttons; its close action stays in the header row. Local editor: http://localhost:4183/. Integrated Fler verktyg → Förfina hela sidan opened successfully on an existing QA proposal without applying or saving changes.

## Manual QA
1. Open a proposal in http://localhost:4183/ and choose Design → Fler verktyg → Förfina hela sidan.
2. Review image-size suggestions and the sector reminders; use Öppna delen to add verified missing content.
3. For a long introduction, compare the original and proposed text, then select Kortare introduktion. Menus, incomplete prose and full 40-section pages are left alone.
4. Apply selected image/text improvements; inspect the customer preview at desktop and mobile widths. Check that the remaining original text is in the new Om/About/Despre section.
5. Use Ångra förbättringar to restore the exact previous proposal. A newer manual edit disables undo to preserve that edit.
6. Choose Granska & dela; small gallery photos should remain reminders. Inspect the customer demo and real destinations before sending.

Automated browser fixtures on the separate QA origin: /qa/import-browser.html, /qa/proposal-refinements-browser.html, /qa/proposal-refinements-mobile.html. They use only illustrative in-memory data; saved projects and drafts are not overwritten.
