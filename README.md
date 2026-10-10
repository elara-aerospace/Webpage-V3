# EAWebsiteV2

Static website for Elara Aerospace.

## Build and check

```sh
npm ci
npm run build
npm run audit:deployment
```

Edit the root HTML pages, articles in `news/`, `styles.css`, `app.js`, and
`homepage-data.js`. Payload capacity and prices are configured in
`payload_config.json`. The build regenerates minified files and both deployment
bundles.

Preview the main bundle with `python3 -m http.server 8080 --directory dist`.
Upload the contents of `dist/` for the main site and `competition-dist/` for the
competition subdomain. Hosting instructions are in `deployment/`.

`assets/` contains referenced website media and the source images needed by
`npm run optimize:starlight`. `npm run optimize:images` optimizes newly referenced
media. Superseded originals, old drafts, temporary exports, and duplicate release
archives have been removed. Keep temporary work in ignored `tmp/` or `outputs/`.
