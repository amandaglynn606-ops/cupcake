# Cake Website — Maison Zavi

Independent luxury cake storefront in the `cake website` folder. Node.js 20+, server-rendered pages and vanilla JavaScript; no production dependencies or build step.

## Run

Typography uses the user-provided Runethia for headings and the ZAVI wordmark, and Manrope for readable supporting text and controls. Both are self-hosted under `assets/fonts/` and registered by `atelier-fonts.css`; Manrope includes regular, medium and semibold weights under the SIL Open Font License. The supplied Runethia licence is personal-use-only; obtain commercial permission before publishing that font on the business site. Original licence files are retained alongside the fonts.

Double-click `Start Cake Website.cmd`, or run `npm.cmd start`, then visit http://localhost:3000.

Run `npm.cmd install` before starting a fresh checkout. Startup, tests and the Vercel build generate smaller WebP photo variants with Sharp; the original photographs remain available for enlarged views. Generated files in `assets/responsive`, `data/responsive-images.json` and `data/responsive-image-styles.json` are not committed. The same build samples photo edges to generate a compact desktop background stylesheet that fills the sides of uncropped photos. Their content-based filenames allow long-lived caching without serving old photographs after an update.

## Catalogue and pricing

The public storefront contains 177 selected designs across six collections: Wedding, Luxury, Engagement, Tiered, Fresh Floral and Sugar Flower Cakes. Wedding (130) and Luxury (22) have no shared products or photos; design collections can overlap. `store.config.json` enables the curated view, and `lib/storefront-selection.js` applies the selection to listings, search, product pages, APIs, orders and the sitemap. Unrelated products and the 70 designs with unreplaced Perfect Gift photos are archived; their public product routes return 404. The 17 imported designs with replaced photos remain public. The selection checks primary, gallery and variant photos. See `data/storefront-photo-removal-report.json`.

The internal catalog preserves all 1,054 imported products, 58 earlier wedding additions, 72 curated designs and 20 earlier luxury additions and 10 extravagant additions (1,214 records). Original prices and the requested AED 300 markup are unchanged. New designs use price-on-request quotations.

- Original inventory: `data/catalog.json`.
- Active pricing audit: `data/price-audit.json`.
- Original snapshots: `data/archive/original-catalog.json` and `data/archive/original-price-audit.json`.
- Product photos and galleries: `assets/products`.

Run `npm.cmd run import` to restore these original snapshots again. US/Canadian replacement catalogue scripts and image experiments remain on disk for history but are not the active import workflow. Do not run them to rebuild this inventory.

## Image matching batches

The full-catalog replacement task was superseded by the curated storefront. Existing cake photographs remain visible until suitable replacements are ready, following the latest user instruction. No new placeholders are introduced for cakes. Only image URLs that are no longer used are retired with HTTP 410.

`data/image-matches.json` retains earlier reviewed Pinterest matches. `data/cake-image-audit-baseline.json` records the read-only inventory before the scope change. `data/cake-image-manifest.json` is the paused full-catalog replacement inventory; it is not a completion report for the current storefront.

The 72 new designs and downloaded WebP assets are recorded in `data/curated-additions.json` and `data/curated-addition-manifest.json`. The manifest includes individual source pages, source-image URLs, UK location evidence, tier counts, dimensions, alt text and checksums. Internet and Pinterest discovery led to direct UK maker galleries. The initial batch added 40 designs. The floral expansion added 32 more designs and replaced eight original product photos; individual decisions are in `data/floral-batch-review.json`. Flower-type and combination filters use reviewed metadata in `data/flower-details.json`. Watermarked, cropped and low-resolution candidates were excluded. Reverse-image verification was not completed; local exact-hash and visual duplicate checks supplement manual review.

`img.cake-image` uses centered contain fitting without image padding and a warm grey background across the full container while existing containers retain their dimensions. Source credits remain internal. Fresh and sugar flower assignments are kept separate; uncertain flower materials remain in the general cake collections. Restart the server after catalog changes.

## New wedding designs

The desktop reference in `artifacts/background-reference/33070322b974a8c7ca.webp` supplies the warm grey seamless studio background for all 189 photographs across the 177 active designs. Optimized WebP edits are in `assets/products/cakes/backgrounds/` `assets/products/cakes/luxury/` and `assets/products/cakes/extravagant/`. `data/cake-background-manifest.json` maps each original to its edited file, product pages, dimensions, prompt and visual review. Original files remain available for comparison and recovery.

The 20 earlier luxury additions are in `data/luxury-additions.json`: eight UK, seven Australian, three Canadian and two Italian sources. No UAE source was selected. `data/luxury-addition-manifest.json` records each source URL, country evidence, image filename, tier count, alt text, checksum and built-in imagegen background-edit prompt. Original downloads and candidate contact sheets are in `artifacts/luxury-cake-candidates/`. `scripts/add-luxury-cakes.cjs` converts reviewed edits to WebP and rebuilds their catalog records; regenerate the CSS backdrops afterward. Luxury membership contains 22 reviewed extravagant designs in `data/luxury-selection.json`. Twenty-five simpler designs were removed from Luxury only; they remain available through their product pages and any other applicable collections. Wedding listings remain unchanged.

Ten further extravagant designs are in `data/extravagant-additions.json`: five Canadian, two Australian and three UK sources. Their source URLs, country evidence, reviewed tiers, alt text, filenames and background-edit records are in `data/extravagant-addition-manifest.json`. No UAE source was used. They appear first in Luxury and share no products or photos with Wedding. The repeatable import is `node scripts/add-extravagant-cakes.cjs`, followed by `node scripts/build-cake-backdrops.cjs`.

`lib/cake-backgrounds.js` applies approved edits after storefront selection, covering primary, gallery and variant images without changing the private archive or reintroducing removed products. Centred `contain` styling keeps the complete cake visible, while a warm grey background fills the container without cream side bands. The zoom view remains available for inspecting the full image. The responsive-image build supplies per-photo desktop background gradients sampled from the left and right edges. Run `npm.cmd run build:images` after changing cake photos; this reads the images without modifying them. On mobile, internal product grids group similar image proportions within each results page while preserving selected price/name sorting; resizing to desktop restores the original order. These are generative background edits: tier counts and overall decorations were reviewed, but fine photographic details may differ from the originals. `node scripts/audit-cake-backgrounds.cjs` checks every active product at desktop, tablet and mobile widths and exports a contact-sheet review and JSON report under `artifacts/cake-background-audit/`.

`data/wedding-additions.json` contains 58 reviewed designs and 70 gallery photographs from the supplied wedding pages. New designs appear first in the wedding collection, with matching tier controls. Structural separators are described separately. Duplicate views share a product gallery. Pricing remains on request through the cart and order flow.

`data/wedding-addition-review.json` and `data/wedding-addition-provenance.json` preserve internal tier observations and source records. Public product data, names, images paths and descriptions omit supplier names and credits. `artifacts/wedding-sources/review.html` is the internal source-photo review.

## Currency display

The header offers **AED, CAD, USD and EUR** and remembers the choice in this browser. Reference rates are frozen at 11 September 2026 in `lib/exchange.js`, sourced from the Central Bank of the UAE. Foreign currency amounts are approximate displays. Order records and WhatsApp messages remain in AED.

## Tier choices and ordering

Multi-tier product pages allow edible cake or display (dummy) tiers, plus a sponge and filling for every edible tier. Tier 1 is the bottom tier. Choices are validated on the server and carried into the cart, editable product selection, order record and WhatsApp message. Dummy tiers do not receive an invented automatic discount; altered construction and flavours require confirmation in the final quote.

Each tier is a collapsible panel with a saved flavour summary and a next-tier button. Optional personal touches and required colour/allergen choices have separate collapsible sections. Invalid submissions reveal the missing field. The three sponge and fourteen cream options come directly from the original imported wedding menu (product 8028660433121); the browser and server share these options. Reviewed public title and description corrections are in `data/product-copy.json`, preserving the imported archive and product URLs.

Tier panels, product sections, FAQs, filters, navigation and mobile footer panels use measured, reversible transitions. Dialogs animate on both desktop and touch devices. Reduced-motion preferences switch these interactions to immediate changes; validation reveals missing fields immediately. Desktop product dropdown and weight values use 12px text below 13px labels.

Cart actions are Submit (continue to checkout) and Review your cart. Gift-message and sender-display choices have been removed, including from stored cart details and WhatsApp messages. Checkout collects name, required email and phone, plus delivery or pickup details. Preferred time retains validation without a visible asterisk.

The homepage collections section uses six cards with category descriptions. Collection and product images enlarge gently on pointer hover, with reduced-motion support. Tier labels and selection controls use upright Manrope.

Homepage, contact and bespoke pages share `assets/css/maison-pages.css` for coordinated styling; homepage sections alternate beige ivory and cream, with burgundy accents. The homepage has coordinated hero, wedding, collections, luxury, bespoke and process sections. Both cake galleries advance every 5.6 seconds while visible; hover, focus, manual navigation, Escape, hidden tabs and reduced-motion preferences stop automatic movement. Contact and bespoke forms use numbered fieldsets, help links and responsive layouts, retaining server validation, reference uploads and downloadable enquiry records.

Order requests offer a WhatsApp handoff to `971545974005`, configured in `store.config.json`. No online payment is collected. Contact and custom enquiries also use WhatsApp. On submission, a tab opens with the validated message; the customer must press Send. Popup-blocked browsers retain a manual link, a full-message copy action and a downloadable summary. No email submission action is offered.

Delivery: **AED 100 in Dubai**, **AED 200 in the other six emirates**, once per order. Pickup is free. Custom forms support up to three private JPG/PNG/WebP reference uploads (5 MB each).

`submissionMode: "whatsapp"` prepares validated requests without filesystem writes. Customer data is not logged or archived by this flow. Reference files remain in the browser; only validated metadata is posted, and customers attach the originals in WhatsApp or use native file sharing where supported. Click-to-chat cannot attach photos automatically. Earlier local records remain under `private/` and can be inspected with `npm.cmd run orders` or `npm.cmd run enquiries`.

## Pages and SEO

The site includes the homepage, active category pages and relevant sidebar filters, individual cake URLs, embedded header search, cart, checkout, wishlist, custom enquiries, delivery, privacy, FAQ and footer policy pages. No careers page is included.

Set `PUBLIC_SITE_URL` or `siteUrl` in `store.config.json` to the real public HTTPS origin for absolute canonical URLs and `/sitemap.xml`. Public pages permit indexing. Search, wishlist, cart and checkout pages are excluded from indexing. The sitemap returns 503 until a public origin is configured, avoiding publication of a placeholder domain. Ranking positions cannot be guaranteed.

## Vercel deployment

`vercel.json` selects the custom `npm run build:vercel` command. It produces a Node.js 22 request handler and static assets using Vercel's Build Output API. Import this repository with the **Other** framework preset and leave the Output Directory override disabled. The build output includes the catalogue and rendering modules inside the function, while photos, videos, fonts and browser assets are served separately by the CDN. Private requests, source CSV files and local review artifacts are not deployed. Retired image URLs remain unavailable.

Set `PUBLIC_SITE_URL` in Vercel to the site's public HTTPS address for the sitemap and canonical URLs.

The configured WhatsApp flow works without durable filesystem storage on Vercel. API responses explicitly report `awaiting-customer-send`, not delivery success. Automatic business-side delivery would require a separate WhatsApp Business API integration and credentials. If archive mode is enabled later, connect persistent private storage before relying on it in production.

## Public source and verification

The shared page head includes the owner's Google site verification tag. Google must be able to read this public tag; confirm ownership in Search Console after deployment.

The canonical public origin is `https://www.weddingcakes.ae`, with an optional `PUBLIC_SITE_URL` deployment override. `/robots.txt` permits all crawlers to browse public pages while excluding API and private paths. `/sitemap.xml` lists unique public pages. `/llms.txt` is a plain-text, catalogue-generated guide to public collections, cake pages and policies; it is not an executable script or a guarantee of AI inclusion. Search, cart, checkout and wishlist pages retain `noindex`. Search and AI services decide independently whether to crawl, index or cite the site. Hosting-level authentication or bot restrictions must also permit public crawler access.

Browser HTML, CSS, JavaScript and images remain inspectable and downloadable, including through View Source. Disabling keyboard shortcuts does not protect them. Keep secrets and private business logic on the server. The public asset allowlist excludes internal JSON manifests, source maps, dotfiles and backups on both the local server and the Vercel CDN build. Security headers apply to both HTML and deployed static assets. Customer records, environment files and server source are not public routes. These safeguards do not constitute a full security audit or guarantee anonymity. Repository visibility is separate from website access.

## Validation commands

`npm.cmd test` validates restored inventory, original pricing and image files, regional fees, private storage and HTTP routes. Stable archived fixtures preserve earlier business-rule checks.

`npm.cmd run test:browser` uses Playwright with Microsoft Edge to check navigation, matching card/product prices, currency persistence, tier editing, WhatsApp content, search, category filters, uploads, carousel controls and layouts from 320 to 1440 pixels.
