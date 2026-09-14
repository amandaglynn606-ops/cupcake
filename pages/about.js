'use strict';
const {esc,img,link,shell}=require('../lib/ui');
const {cakeImageClass}=require('../lib/cake-images');
const {whatsappUrl}=require('../lib/contact');
function about(ctx){
 const cake=ctx.byId.get('9900000000032')||ctx.catalog.products[0];
 const chat=whatsappUrl(ctx.config,'Hello Maison Zavi, I would like to discuss a cake for my celebration.');
 const body=`<main id="main" class="about-page">
  <header class="about-heading wrap"><p class="eyebrow">OUR STORY</p><h1>About <em>Maison Zavi.</em></h1><p>Born in the heart of Dubai.<br>Cakes for the people you love.</p></header>
  <section class="about-story wrap" aria-labelledby="about-story-heading">
   ${cake?`<figure class="about-photo"><img class="${cakeImageClass(cake)}" src="${esc(img(cake.image,1000))}" alt="${esc(cake.imageAlt||cake.title)}" width="1000" height="1000" fetchpriority="high"><figcaption>Flowers, colour and the details you choose.</figcaption></figure>`:''}
   <div class="about-story-copy"><p class="eyebrow">A LITTLE ABOUT US</p><h2 id="about-story-heading">A cake for<br><em>someone you love.</em></h2><p>Maison Zavi was born in the heart of Dubai, with a love for the gatherings that bring people together. Weddings, engagements and family celebrations all have a story behind them. We want to hear yours.</p><p>It might be a favourite flower, the colours in your wedding invitation or a flavour everyone in the family loves. Those are the details we start with when planning your cake.</p><p>You can choose a design from our collections or share an idea of your own. We’ll talk through the size, flavours and budget with you, and agree the details before your order.</p>${chat?`<a class="text-link" href="${esc(chat)}" target="_blank" rel="noopener">Talk to us on WhatsApp <span aria-hidden="true">↗</span></a>`:link('/contact','Talk to us')}</div>
  </section>
  <section class="about-details" aria-labelledby="about-details-heading"><div class="wrap"><div class="about-section-heading"><p class="eyebrow">PLANNING YOUR CAKE</p><h2 id="about-details-heading">The details<br><em>we choose together.</em></h2></div><div class="about-detail-grid"><article><h3>Event details</h3><p>Tell us your date, venue and guest count. We’ll use these to discuss the size and delivery arrangements.</p></article><article><h3>Your design</h3><p>Share the colours, flowers and decorations you have in mind. Reference photos are welcome too.</p></article><article><h3>Your flavours</h3><p>Choose your sponge and filling, with separate flavour choices for each edible tier. Tell us about any dietary requirements.</p></article></div></div></section>
  <section class="about-closing wrap"><p class="eyebrow">LET’S TALK</p><h2>Tell us about<br><em>your celebration.</em></h2><p>Tell us what you have in mind, and let us take the organising off your hands. We want you to spend less time chasing details and more time enjoying the occasion with the people you love.</p><p>If we’re unable to fulfil your request ourselves, we’ll work with a fulfilment partner and handle the arrangements for you. We’ll keep you informed and agree the details together, so you don’t have to coordinate everything yourself.</p><div class="about-actions">${link('/bespoke','Design your own cake','button')}${link('/collections','Explore our cakes')}</div></section>
 </main>`;
 return shell(ctx,{title:'About Maison Zavi',body,path:'/atelier',styles:['about']});
}
module.exports={about};
