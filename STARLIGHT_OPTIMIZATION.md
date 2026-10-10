# Starlight image and loading optimization

Completed 9 October 2026.

- Responsive WebP derivatives for the vehicle render, both hardware photos,
  propulsion render, and logos. Original assets remain available for regeneration.
- Hero preload uses the same `srcset` and `sizes` as the image to avoid a second
  image download. The hero remains high priority; lower images load lazily.
- Explicit image dimensions and asynchronous decoding. Existing frame sizes,
  object positioning, and photo selection are retained.
- `npm run build` generates `starlight.min.css` from this page and `app.js`,
  retaining shared navigation, form, and cookie controls.
- Removed obsolete inline background-image rules for the previous hero.

## File sizes

The largest hero derivative is 23.0 KiB versus the original PNG's 401.4 KiB
(94% smaller). Starlight's CSS is 38.0 KiB versus the shared stylesheet's
70.8 KiB (46% smaller). These are uncompressed file sizes, not network timings.
Browsers select smaller image derivatives according to viewport and pixel density.

## Verification

Production build passed. Checked the source page at 1280px and the production
page at 390px: image crops, hardware frames, image loading, horizontal overflow,
mobile menu, cookie preferences, and newsletter field layout. All six images
loaded successfully during the page sweep; the production browser had no console
errors. Confirmed that every source and production image URL exists, responsive
width descriptors match actual files, and hero preload matches its image.

## Regeneration

Run `npm run optimize:starlight` with Python 3 and Pillow installed. Run
`npm run build` after HTML, CSS, or JavaScript edits. Image derivatives are
generated separately so ordinary builds do not require Pillow.
