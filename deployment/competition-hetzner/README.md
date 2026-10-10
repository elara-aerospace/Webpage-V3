# Competition subdomain deployment

This bundle is generated at `competition-dist/` by `npm run build`.

It is intended to be served as the document root for:

`https://competition.elara-aerospace.com/`

## DNS

Create an `A` record for `competition.elara-aerospace.com` pointing to the Hetzner server's public IPv4 address. Add an `AAAA` record if IPv6 is configured on the server. Keep the existing apex-domain records unchanged until this subdomain has been tested.

## Upload

Upload the contents of `competition-dist/` to a dedicated directory such as:

`/var/www/competition.elara-aerospace.com/`

Do not upload the repository or `node_modules/`.

## Nginx

Use the accompanying `nginx.conf.example` as the server block. Replace the placeholder certificate paths after obtaining the certificate.

## Certificate

After DNS resolves to Hetzner, issue the certificate with Certbot and enable the HTTP-to-HTTPS redirect. Test the subdomain before changing any existing production records.

## Rollback

The current main site remains independent. To roll back the competition subdomain, restore the previous Nginx server block or remove the subdomain DNS record; no apex-domain change is required.
