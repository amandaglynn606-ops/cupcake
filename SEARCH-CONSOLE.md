# weddingcakes.ae: site identity and indexing

## Prepared locally

- Preferred origin: `https://www.weddingcakes.ae`.
- Non-www requests receive a permanent 308 redirect to the preferred origin, preserving the path and query. The redirect is included in both the Node server and Vercel's CDN routing, ahead of static file handling.
- Vercel supplies HTTP-to-HTTPS redirects. Both domain names must remain attached to the correct Vercel project, with working DNS and TLS certificates. These external settings have not been checked during this task.
- Localhost and preview domains are not redirected. Redirect destinations use the configured owned domain, not forwarded request headers. `PUBLIC_SITE_URL`, if configured, must match the chosen preferred origin at build time and runtime.
- Canonical links, robots.txt and sitemap already use the preferred origin. Public pages allow indexing; cart, checkout, search and wishlist remain excluded.
- Browser icons now include SVG, ICO (16/32/48), PNG (48/192/512), and an Apple touch icon (180). The page head references the browser and Apple icons with an updated cache version.
- `assets/brand/site-logo.svg` and `.png` export the existing Maison Zavi wordmark. The homepage supplies Organization and WebSite structured data, the logo, site name and a social image. The header and footer retain their existing typography.

Run `npm.cmd run build:identity` after editing the SVG artwork. The Vercel build also regenerates the raster assets. The optional `python scripts/build-brand-logo.py` command regenerates the outlined wordmark using locally installed fontTools and the repository's existing fonts; deployment does not require Python.

## Search Console setup still requiring account access

1. Add or inspect the **Domain property** `weddingcakes.ae`. Verify ownership using the exact DNS TXT record Google supplies. This single property covers HTTP, HTTPS, www and non-www.
2. If separate reporting is wanted, add these four **URL-prefix properties** as well:
   - `http://weddingcakes.ae/`
   - `https://weddingcakes.ae/`
   - `http://www.weddingcakes.ae/`
   - `https://www.weddingcakes.ae/`
3. Keep the existing Google verification meta tag. Its presence in source is not proof of verified ownership, and it does not replace DNS verification for the Domain property. Use Google's offered verification method for each additional URL-prefix property.
4. Submit `https://www.weddingcakes.ae/sitemap.xml` to the Domain property and/or the preferred HTTPS www URL-prefix property.
5. Inspect the preferred homepage and a representative cake URL. Check the live test, Google's selected canonical, crawl permissions and the exact Page indexing exclusion reason. Request indexing for the preferred URLs when the live test passes.
6. Redirected HTTP/non-www URLs normally appear as **Page with redirect**. They should consolidate into the preferred HTTPS www URLs; they are not intended to be indexed separately.

Creating properties does not itself fix crawling or guarantee indexing. The actual Search Console exclusion reasons, live deployment, DNS, TLS, redirects, sitemap response and hosting access controls remain unverified until live access is allowed and the accounts are connected.

## Deployment checks

After deployment, check all four origins, including a nested cake URL and a query string. Each should end at the corresponding HTTPS www URL without loops. Check that `/favicon.ico`, `/favicon-48.png`, `/favicon.svg`, `/apple-touch-icon.png`, `/assets/brand/site-logo.png`, `/robots.txt` and `/sitemap.xml` are public, and confirm that no hosting-level `X-Robots-Tag: noindex` or authentication wall blocks the production pages.

Local automated checks cover asset dimensions, icon links, structured-data escaping, redirect destination restrictions, private-file exclusions, canonical/sitemap consistency and the deployment bundle. They do not audit Google account access, DNS, hosting controls or the live site. No new dependencies or credentials are added.

The existing README records that Runethia is personal-use-only unless commercial permission has been obtained. This also applies to the exported logo. Confirm the existing commercial licence before publishing these assets, or supply commercially licensed replacement artwork.
