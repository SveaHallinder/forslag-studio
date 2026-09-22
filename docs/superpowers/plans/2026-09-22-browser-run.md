# Browser Run Implementation Plan

> Implement the user-approved fallback in the existing checkout, with minimal edits and regression tests. Account activation remains dependent on user login and verification of Workers Free.

**Goal:** Recover public JavaScript pages when ordinary HTML contains no readable company content.

**Architecture:** Existing HTML import remains first. A specifically tagged empty-content error triggers one server-side Cloudflare `/content` request. Rendered HTML goes through the same extractor; no saved-project schema changes. Secrets stay in runtime environment variables.

**Tech Stack:** Existing native JavaScript, Worker fetch, Node tests; no new packages.

- [ ] Add failing server tests for disabled configuration, URL validation, bounded HTML, final URL, origin status, quota and credential errors.
- [ ] Add failing client tests for exactly one fallback, no fallback for ordinary content, preservation of error status and no false success.
- [ ] Implement `/api/render` with a free-plan activation flag, fixed provider endpoint, bounded time/size, concurrency cap, sanitized errors and logs. Pass allowlisted runtime settings in local preview.
- [ ] Connect the tagged empty-content error to fallback; retain normal stylesheet/contact extraction. Verify lint, tests, build and UI on localhost.
- [ ] After Cloudflare login, verify Workers Free, configure a narrowly scoped Browser Rendering token as a server secret and test a real JavaScript page. Publish verified source; document any activation blocker honestly.

## Approved scope and limits

The user approved Cloudflare Browser Run on its free plan on 2026-09-22. Do not upgrade billing. An operator must confirm Workers Free before setting `CLOUDFLARE_BROWSER_PLAN=free`; this flag is an activation guard, not a provider billing limit. Cloudflare enforces the account's daily quota. The public editor has no login, so all sellers share that quota. No retry loops or automatic paid fallback.

## Evidence and manual QA

1. Import an ordinary HTML website and verify no `/api/render` request.
2. Import an empty JavaScript shell: verify exactly one fallback request and usable original text on success.
3. With credentials absent, verify the connection message and that the draft stays intact.
4. Simulate quota and provider authentication failures: no success toast or partial draft replacement.
5. Once connected to Workers Free, import a real JS page, compare text and links, save and open a customer demo.

References: https://developers.cloudflare.com/browser-run/quick-actions/content-endpoint/ and https://developers.cloudflare.com/browser-run/pricing/ (checked 2026-09-22).
