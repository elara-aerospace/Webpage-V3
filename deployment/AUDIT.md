# Deployment audit — 2026-10-10

The upload bundles are `dist/` (main site) and `competition-dist/` (competition site). Upload the contents of the appropriate bundle, not the repository. Duplicate ZIP archives and manifests were removed during repository cleanup. Deployment has not been performed.

## Content and optimization

- Added the looping, silent machining video and Main Combustion Chamber Machining caption; removed the visible speed label.
- Replaced Kyron references with engine wording and updated GTM imagery with a cleaned mounting plate.
- Optimized 68 images, saving about 17 MiB; renamed 14 additional assets. Subsequent repository cleanup removed unused original media while retaining inputs for the supported Starlight image generator.
- Minified public HTML/CSS/JavaScript, added content versioning for primary scripts/styles, and pruned unused public assets. Main upload is 13.1 MiB (12.4 MiB ZIP); competition upload is 139 KiB.
- Removed the local Spayz project. No remote Spayz hosting has been changed.

## Verification

- 42 main pages and one competition page: 1,610 local references checked, no missing targets or fragment failures.
- All 233 deployment files served successfully over a local HTTP test server.
- Browser checks passed for 42 pages, 35 required-field checks, and 12 simulated success/server-error/network-error form cases. Application CV upload and consent serialization checked. Desktop/mobile layout checked.
- Analytics privacy tests passed. Collection remains unconfigured.
- Public bundle security scan: 233 files, no recognized credentials, private keys, private/source files, camera originals, or image GPS metadata found.
- Package dependency audit: zero reported vulnerabilities.

## Forms and external services

The original custom form masks remain in place. They route to portal 143597793, region eu1:

| Form | HubSpot ID |
| --- | --- |
| Contact | 7ee93551-3dcb-43a4-b521-51ed7abed90b |
| Payload | 20580497-2156-4296-9c2d-a6e7705fcd0f |
| Newsletter | e8ffd25d-7a5a-4be8-983d-64d6f8905f62 |
| Application | 54e8a780-8c8e-4fe8-9e42-c97ea1380f74 |

All four forms were inspected as published in HubSpot. With explicit user approval, CAPTCHA was disabled and published on Join Us Form. Its public definition was then verified as `isPublished: true`, `captchaEnabled: false`.

Submission handlers prevent duplicate clicks, time out stalled requests, permit retries after errors, and only display success on successful HTTP responses. No real form submissions were sent during automated tests.

## Scope and remaining deployment checks

This repository has a static website and no separate application server. HubSpot IDs are public routing identifiers, not secrets. The audit covers source routing, local behavior and the generated public bundles; it cannot establish that every secret in hosting or provider accounts is protected. No live server, provider access permissions, CRM workflows, or email delivery was audited.

Before launch, perform an intentional real submission through each custom mask and confirm the submitted values, consent, CV attachment (application), CRM record and expected email workflow in HubSpot. Mocked HTTP responses do not prove provider acceptance or delivery, including acceptance of every custom field. Verify HTTPS, cache behavior and security headers on the actual host using the supplied hosting example as appropriate.
