# Main-site deployment

Build with `npm run build`. Upload **the contents of `dist/`** to the document root for `elara-aerospace.com`. The bundle contains root pages, `news/`, referenced `assets/`, minified scripts/styles, configuration and crawler files. Do not upload the repository itself.

Upload **the contents of `competition-dist/`** separately to the competition subdomain's document root. Spayz has been removed from this project; neither bundle includes it.

Development scripts and unminified CSS/JS remain outside the deployment bundles. Image derivatives live under `assets/optimized/site/`; responsive Starlight assets retain their separate folder and the originals needed to regenerate them. Unused media, superseded portraits, raw camera files, drafts, temporary exports and duplicate release archives have been removed from the source tree. `deployment/image-optimization.json` records the earlier replacements; its source paths are historical and may no longer exist.

Run `npm run audit:deployment` after every build. `scripts/test-deployment.cjs` additionally checks pages and custom forms in Chrome with every external submission intercepted; it requires Playwright and Chrome. The bundled desktop runtime was used for this audit. Simulated submissions do not prove delivery to HubSpot.

Forms retain the site's custom layout. The supplied portal/form IDs are public routing identifiers, not private credentials. There is no application backend or private HubSpot token in this repository. Hosted HubSpot configuration, email workflows, actual delivery and the live server must be verified separately. The application form is published with CAPTCHA disabled, verified on 2026-10-10. See `deployment/AUDIT.md` for audit scope and remaining live delivery checks.

Use the Nginx example only after adapting domain, paths and TLS to the actual host. Serve over HTTPS. Keep a backup of the current live document root and swap deployment directories atomically, rather than deleting the current site before the upload finishes. Validate the live homepage, article pages, media, form success/failure behavior and real inbox/CRM receipt with agreed test submissions before opening the release to visitors.

If Spayz was previously uploaded or configured as a domain on the host, remove that deployed document root/vhost separately. No remote Spayz server was modified here.
