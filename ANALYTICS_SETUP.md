# Cloudflare Web Analytics setup

The site is prepared for Cloudflare traffic and real-user performance reporting. Collection is currently **disabled**. There is no account token in this repository and no deployment was performed.

## Activate

1. In Cloudflare, open **Web Analytics → Add a site** and add `elara-aerospace.com`. Select manual JavaScript snippet installation. Copy the **public beacon token** from the snippet (not an account API token).
2. In `analytics.js`, set `enabled` to `true` and paste the public token into `token`. Confirm the exact production hostnames in `hostnames`. The competition subdomain is excluded unless explicitly added and configured in Cloudflare.
3. Disable Cloudflare automatic beacon injection / Pages automatic analytics if enabled. Use one manual integration so the site’s consent controls remain effective and page views are not duplicated.
4. Review the published privacy notice to describe the configured service before activation. No claim of universal legal compliance is made by this implementation.
5. Run `node scripts/test-analytics.cjs` and `npm run build`, then deploy the resulting production bundle through the usual deployment process.
6. On the production hostname, opt into Telemetry & Analytics in Cookie Settings. Verify one request to `static.cloudflareinsights.com/beacon.min.js` and reporting to `cloudflareinsights.com/cdn-cgi/rum`; confirm page traffic arrives in Cloudflare. Rejecting analytics must prevent loading. Revoking an already-loaded beacon reloads the page to stop its installed listeners.

If the host uses Content Security Policy, add `https://static.cloudflareinsights.com` to the existing `script-src` and `https://cloudflareinsights.com` to the existing `connect-src`. Merge into existing directives; do not replace the policy.

## Collection boundaries

- Cloudflare’s standard page traffic and performance metrics only; no form-field contents or custom conversion events are sent by this integration.
- Opt-in via the existing `elara_cookie_consent.telemetry` setting is required.
- Public production HTTPS hostnames only. Local previews and unlisted staging hosts are excluded.
- Do Not Track and Global Privacy Control opt-outs are honored.
- URLs with query strings or fragments are excluded to avoid sending values that might contain personal or account-specific data. This deliberately omits campaign/query and fragment visits from reporting.
- No duplicate manual beacon is inserted. Ensure automatic injection is disabled in Cloudflare; browser detection alone cannot guarantee that an edge-injected script has not already executed.
- Data will represent consenting, eligible visits, not every visitor. Ad blockers may further reduce reporting.

The shared `app.js` loads `analytics.js` relative to its own bundle URL, including from nested article pages. The build includes it in both output bundles. Editing `analytics.js` requires rebuilding the deployment bundle, but not changing any HTML page.

## Sources

- [Cloudflare setup](https://developers.cloudflare.com/web-analytics/get-started/)
- [Cloudflare data collection](https://developers.cloudflare.com/web-analytics/data-metrics/data-origin-and-collection/)
- [Cloudflare manual beacon FAQs](https://developers.cloudflare.com/web-analytics/faq/)
