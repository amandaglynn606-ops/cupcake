'use strict';
const {siteOrigin}=require('./seo');

function robots(config){
 const origin=siteOrigin(config);
 // One universal policy includes search crawlers and AI crawlers.
 return 'User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /private/\nDisallow: /.git/\n'+(origin?'Sitemap: '+origin+'/sitemap.xml\n':'');
}

function llms(ctx){
 const origin=siteOrigin(ctx.config);
 const label=value=>String(value).replace(/[\r\n\[\]<>]/g,' ').trim();
 const link=(title,route,description='')=>'- ['+label(title)+']('+origin+route+')'+(description?': '+label(description):'');
 return [
  '# Maison Zavi',
  '',
  '> Wedding, luxury and celebration cake designs, with custom cake enquiries and delivery across the United Arab Emirates.',
  '',
  'The public website is the source for current design details and quoted or starting prices. Prices are in AED. Final pricing, availability, customisation and delivery dates require confirmation with Maison Zavi. Sending an enquiry does not confirm an order. No online payment is collected on the website.',
  '',
  'Catalogue photographs are design references. Dietary requirements and allergens must be discussed with Maison Zavi before ordering.',
  '',
  '## Main pages',
  link('Home','/'),link('All cake designs','/collections/all'),link('Our story','/atelier'),link('Custom cake enquiries','/bespoke'),link('Contact','/contact'),link('Delivery','/delivery'),link('Frequently asked questions','/faq'),
  '',
  '## Collections',
  ...ctx.collections.map(c=>link(c.name||c.title||c.slug,'/collections/'+c.slug)),
  '',
  '## Cake designs',
  ...ctx.catalog.products.map(p=>link(p.title,'/cakes/'+p.handle,p.metaDescription)),
  '',
  '## Policies',
  link('Privacy','/privacy'),link('Terms and conditions','/policies/terms-of-service'),link('Refunds and cancellations','/policies/refund-policy'),
  '',
  '## Discovery',
  link('XML sitemap','/sitemap.xml'),link('Crawler access policy','/robots.txt'),
  ''
 ].join('\n');
}

module.exports={robots,llms};
