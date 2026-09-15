# weddingcakes.ae: site identity and indexing

## Site configuration

- Preferred origin: `https://www.weddingcakes.ae`.
- Non-www requests receive a permanent 308 redirect to the preferred origin, preserving the path and query. The redirect is included in both the Node server and Vercel's CDN routing, ahead of static file handling.
- Vercel supplies HTTP-to-HTTPS redirects. Both domain names must remain attached to the correct Vercel project, with working DNS and TLS certificates. The live redirect chains and certificates passed the September 15, 2026 checks.
- Localhost and preview domains are not redirected. Redirect destinations use the configured owned domain, not forwarded request headers. `PUBLIC_SITE_URL`, if configured, must match the chosen preferred origin at build time and runtime.
- Canonical links, robots.txt and sitemap already use the preferred origin. Public pages allow indexing; cart, checkout, search and wishlist remain excluded.
- Browser icons now include SVG, ICO (16/32/48), PNG (48/192/512), and an Apple touch icon (180). The page head references the browser and Apple icons with an updated cache version.
- `assets/brand/site-logo.svg` and `.png` export the existing Maison Zavi wordmark. All public pages supply Organization and WebSite structured data, UAE service coverage and an appropriate page type. The homepage supplies the social logo image. Priced cakes use Product/Offer markup; quote-only designs use Service markup. Collections, breadcrumbs and the visible FAQ have matching schema. The header and footer retain their existing typography.

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

Creating properties does not itself fix crawling or guarantee indexing. Actual Search Console exclusion reasons, property verification and Google's selected canonical remain unverified until the Google account is connected.

## Live verification — September 15, 2026

- All four HTTP/HTTPS and www/non-www variants resolve to the preferred HTTPS www URL; nested paths and query strings are preserved.
- Both hostnames have valid HTTPS certificates. The Google HTML verification tag is present.
- All 204 unique sitemap URLs return HTTP 200, allow indexing and have matching canonical URLs. Following 52 collection/pagination pages confirms that every sitemap URL can be reached through links from the homepage.
- Robots.txt and the sitemap are public. Representative requests with a Googlebot user agent return HTTP 200 and no `X-Robots-Tag: noindex`; these synthetic requests do not prove access from Google's actual crawler infrastructure.
- Published icon/PNG assets and mobile checkout CSS match the committed files. The SVG favicon differs only in its line ending. Cart and checkout render correctly at 320, 390 and 430 pixels, with 12px field text under 13px labels and 16px radio controls. Pickup and delivery fees update correctly, with no JavaScript errors in the checked flows; no order was submitted.
- Probes for server source, environment files, Git configuration, internal image metadata and private orders return HTTP 404. This limited public-file check is not a complete security audit.
- A Windows DNS TXT lookup returned no Google verification record. Domain-property DNS verification therefore needs checking in Search Console; the existing HTML tag can support URL-prefix verification. The initial Node DNS resolver failed, so its result was not used to determine record presence.
- GSC Wizard installation/authorization, actual indexed-page inspection, sitemap submission and manual indexing requests remain pending. No indexing request has been submitted by this task.

Detailed local results and screenshots are stored under `artifacts/live-verification.json` and `artifacts/live-compact-*.png` (not committed).

## Deployment checks

After deployment, check all four origins, including a nested cake URL and a query string. Each should end at the corresponding HTTPS www URL without loops. Check that `/favicon.ico`, `/favicon-48.png`, `/favicon.svg`, `/apple-touch-icon.png`, `/assets/brand/site-logo.png`, `/robots.txt` and `/sitemap.xml` are public, and confirm that no hosting-level `X-Robots-Tag: noindex` or authentication wall blocks the production pages.

Local automated checks cover asset dimensions, icon links, structured-data escaping, redirect destination restrictions, private-file exclusions, canonical/sitemap consistency and the deployment bundle. They do not audit Google account access, DNS, hosting controls or the live site. No new dependencies or credentials are added.

The existing README records that Runethia is personal-use-only unless commercial permission has been obtained. This also applies to the exported logo. Confirm the existing commercial licence before publishing these assets, or supply commercially licensed replacement artwork.
