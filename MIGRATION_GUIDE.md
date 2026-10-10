# Old Website → Elara Aerospace Website Migration Guide

This guide is for moving the current static site into production at `https://elara-aerospace.com/`.

## 1. Freeze and inventory the old site

1. Export a complete backup of the old document root, including uploads, DNS records, redirects, form settings, analytics, and email routing.
2. Crawl the old site and save its URL list. Keep the crawl report so every old URL can be mapped, redirected, or intentionally retired.
3. Freeze content changes on the old site during the final cutover window.
4. Confirm ownership of the domain and both the old and new hosting accounts before changing DNS.

## 2. Prepare this repository

From the repository root:

```bash
npm ci
npm audit
npm run build
```

The production-ready output is written to `dist/`. Deploy the contents of `dist/`, not the repository, temporary outputs, or `node_modules/`.

## 3. Test the built site locally

```bash
python3 -m http.server 8080 --directory dist
```

Open `http://localhost:8080/` and test the following at desktop and mobile widths:

- Homepage hero rotation, navigation, dropdowns, and mobile menu.
- Every top-level navigation item, including **The Bridge** under Events.
- All News cards and article pages.
- Contact, newsletter, donation, partner, and student application forms.
- Cookie preferences, legal/privacy links, redirects, and error pages.
- Images, video, fonts, keyboard focus, reduced-motion behavior, and browser console errors.

Run `npm run audit:deployment` for the current page and reference checks. The latest main bundle contains 42 HTML pages.

## 4. Configure the host

1. Create a production site whose document root is the deployed `dist/` directory.
2. Enable HTTPS and redirect HTTP to HTTPS.
3. Configure the host to serve `robots.txt`, `sitemap.xml`, and `llms.txt` from the domain root.
4. Keep the existing error mappings for `400`, `401`, `403`, `404`, `500`, and `503` pages.
5. Add security headers at the hosting layer. Start a Content-Security-Policy in `Report-Only` mode, validate the reports, then enforce it. At minimum configure `Strict-Transport-Security` (after HTTPS is confirmed), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a restrictive `Permissions-Policy`.
6. Do not expose `backups/`, `scratch/`, source maps, build logs, or dependency directories publicly.

## 5. Map old URLs to new URLs

Use permanent (`301` or `308`) redirects for any old URL whose content moved. Preserve meaningful query parameters. The main routes are:

| Old content | New URL |
| --- | --- |
| Homepage | `/` |
| Technology landing page | `/technology.html` (redirects to `/starleap.html`) |
| Starleap | `/starleap.html` |
| Starlight | `/starlight.html` |
| TB30 | `/tb30.html` |
| Payload | `/payload.html` |
| News index | `/news.html` |
| Events / The Bridge | `/events.html` |
| Team | `/team.html` |
| Partners | `/partners.html` |
| Partner inquiries | `/partner-with-us.html` |
| Donations | `/donate.html` |
| About | `/about.html` |
| Contact | `/contact.html` |
| Glossary | `/glossary.html` |
| Legal | `/legal.html` |

For old article URLs, map each article to its matching `/news/news-*.html` route. Do not redirect retired pages to the homepage unless there is no closer replacement; use a meaningful `410` for content that is intentionally gone.

## 6. Verify forms and integrations

1. Confirm the HubSpot portal/form IDs in the production account.
2. Submit test newsletter, contact, partner, donation, and student applications using test addresses.
3. Verify consent text, privacy-policy links, success states, error states, and duplicate-submission behavior.
4. Confirm submissions arrive in the correct HubSpot lists/pipelines and that notification email routing still works.
5. Check that no private API keys or credentials are placed in HTML, JavaScript, or the deployed `dist/` directory.

## 7. Update search indexing

1. Verify `https://elara-aerospace.com/sitemap.xml` returns HTTP 200 and valid XML.
2. In Google Search Console, add/verify the canonical domain property.
3. Submit `/sitemap.xml` and request inspection for the homepage, `/events.html`, `/news.html`, and the main product pages.
4. Confirm that `robots.txt` allows public pages and excludes only utility pages (`thank-you`, error/status pages).
5. Monitor coverage, canonical selection, redirect errors, and 404s during the first 2–4 weeks.

## 8. Cut over with a rollback plan

1. Lower the DNS TTL 24–48 hours before the planned switch.
2. Upload and smoke-test the new `dist/` build on a staging hostname.
3. Deploy the new site and redirects.
4. Switch DNS or the hosting target during a low-traffic window.
5. Run the production checklist: HTTPS, canonical URLs, forms, redirects, sitemap, analytics, social previews, and mobile navigation.
6. Keep the old site available but read-only until traffic, forms, and search coverage are stable.
7. If a critical issue appears, restore the previous hosting target/DNS and investigate using the saved backup and crawl report.

## 9. Post-launch monitoring

For the first week, review hosting errors, form submissions, Search Console coverage, analytics, page speed, and mobile usability daily. After the first week, review them weekly and rerun `npm ci`, `npm audit`, and `npm run build` before each substantial release.

