# Proposal quality — approved five-point refinement

1. Preserve explicit source image focus and full product/portrait framing; rank readable pictures using the current section's own words. Never borrow another section's photo or overwrite manual framing.
2. Turn explicitly labelled source text (menu, hours, services, cases) into editable sections without generating business facts. Keep unstructured copy reversible.
3. Show three compositions with the typography that the template picker actually proposes; increase separation for consulting/quiet directions while retaining source fonts as a reversible choice.
4. Offer concrete button labels only for already supplied contact/menu/booking destinations. Never invent a provider or destination.
5. Before sharing, render every imported page at 320 and 1280 pixels. Flag horizontal overflow, clipped headings/actions and text-heavy blocks. Use the same check in whole-page refinement. Missing/failed layout checks cannot be reported as passed.

Implementation stays in existing import, proposal/refinement, design comparison and review modules. Add one browser layout-check module with pure metrics and bounded inert iframes. No dependencies, schema changes or mutation of saved customer projects during QA. Run focused tests, import/browser fixtures, all unit tests, lint/build, then publish the existing public Site and push the exact source.
