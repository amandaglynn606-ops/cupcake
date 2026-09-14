'use strict';
const fs=require('node:fs');
function replace(file,pairs){
 let text=fs.readFileSync(file,'utf8');
 for(const [from,to]of pairs){if(!text.includes(from))throw Error(file+' missing: '+from);text=text.replaceAll(from,to);}
 fs.writeFileSync(file,text);
}
replace('pages/home-content.js',[
 ['Extraordinary.<br><em>Entirely yours.</em>','Wedding cakes.<br><em>Made to order.</em>'],
 ['Beautifully considered cakes for the moments you’ll always remember.','Wedding, engagement and celebration cakes. Choose a design, select your flavours and request a quote.'],
 ['FROM THE FIRST IDEA TO THE FINAL FLOURISH','CHOOSE A DESIGN · SELECT FLAVOURS · REQUEST A QUOTE'],
 ['Designed around you','Custom colours, flowers and flavours'],
 ['A day like no other.<br><em>A cake to match.</em>','Wedding cakes<br><em>with floral designs.</em>'],
 ['Soft florals, sculptural tiers and personal details. Find a design that belongs at the heart of your celebration.','Browse wedding cakes with fresh flowers, sugar flowers, piped details and tiered arrangements.'],
 ['Choose your flowers, flavours and favourite details. We’ll shape the final design with you.','Select flowers and flavours, then confirm the cake size and decorations with us.'],
 ['Find your<br><em>extraordinary.</em>','Browse our<br><em>cake collections.</em>'],
 ['One occasion. Your own sense of style. Explore six collections, each with a different point of view.','Browse by occasion, tier count or flower type. Each cake page includes design details and flavour options.'],
 ['Made to be<br><em>remembered.</em>','Tall tiers.<br><em>Sculpted designs.</em>'],
 ['Extraordinary shapes. Intricate finishes.<br>Cakes with a presence all their own.','Explore tall cakes, sculpted decorations,<br>metallic finishes and detailed floral designs.'],
 ['Extraordinary by design','Luxury cake designs'],
 ['Your inspiration.<br><em>Our starting point.</em>','Custom cake<br><em>designs.</em>'],
 ['A colour from the invitation. A favourite flower. A detail that means everything. Let’s make a cake that feels entirely yours.','Share your preferred colours, flowers, guest count and event date. We’ll discuss the design and prepare a quote.'],
 ['CONSIDERED FROM EVERY ANGLE','COLOURS AND DECORATIONS CONFIRMED WITH YOU'],
 ['A few details.<br><em>Something wonderful.</em>','How to<br><em>request a cake.</em>'],
 ['From inspiration to your personal quotation,<br>we’ll take it one step at a time.','Choose a cake and send your event details.<br>We’ll confirm availability and price.'],
 ['Make it personal','Choose your options'],
 ['Speak to the maison','Contact us'],
 ['Good taste.<br><em>In every detail.</em>','About<br><em>Maison Zavi.</em>'],
 ['The silhouette. The first slice. The moment everyone gathers.<br>Each detail, part of your occasion.','Browse wedding and celebration cakes, or request a custom design.<br>Design, price and delivery are confirmed before ordering.'],
 ['Inside the atelier','How we handle your request']
]);
replace('pages/home.js',[
 ['A centrepiece for your wedding day.','Floral, piped and tiered wedding designs.'],
 ['Sculptural details. Extraordinary presence.','Tall cakes and sculpted decorations.'],
 ['For the beginning of your forever.','Cakes for proposals and engagement parties.'],
 ['Beautiful proportions, from two tiers up.','Two tiers and above, with flavours by tier.'],
 ['Fresh blooms and natural romance.','Fresh flowers in single or mixed arrangements.'],
 ['Intricate flowers, crafted in sugar.','Sugar roses, peonies and other flowers.'],
 ['A collection for<br><em>your occasion.</em>','Browse our<br><em>cake collections.</em>'],
 ['Explore celebration cakes by occasion, design or finishing touch.','Find wedding, luxury and engagement cakes, plus tiered, fresh floral and sugar flower designs.']
]);
replace('lib/storefront-selection.js',[
 ['Sculptural tiers, delicate piping and considered finishes for your wedding table.','Wedding cakes with floral arrangements, piped decoration and tiered designs.'],
 ['Elegant celebration cakes with considered finishes, sculptural details and a sense of occasion.','Luxury cakes with tall tiers, sculpted decorations, metallic finishes and detailed flower arrangements.'],
 ['Romantic designs for proposals, engagement parties and the beginning of your next chapter.','Cakes for proposals and engagement parties, with floral, ring and engagement topper designs.'],
 ['Statement cakes with two or more tiers, from intimate celebrations to grand centrepieces.','Cakes with two or more tiers. Choose sponge and filling options for each edible tier.'],
 ['Cakes decorated with fresh flowers, thoughtfully arranged for your celebration.','Cakes decorated with fresh roses, peonies, dahlias and mixed flower arrangements.'],
 ['Delicate handcrafted sugar flowers, from individual blooms to cascading floral designs.','Cakes decorated with sugar roses, peonies, magnolias and other flowers, in clusters or cascades.']
]);
replace('lib/ui.js',[
 ['Extraordinary statement cakes','Tall and sculpted cake designs'],['Celebrate your beginning','Proposals and engagement parties'],['Beautifully balanced tiers','Two tiers and above'],
 ['Let’s find your perfect cake','Ask about a cake design'],['THE BESPOKE EXPERIENCE','CUSTOM CAKES'],['Made for your moment.','Custom cake designs.'],
 ['Tell us about your occasion','Custom cake enquiries'],['MAKE IT A MAISON ZAVI OCCASION','CUSTOM CAKE ENQUIRIES'],
 ['Something wonderful<br><em>starts here.</em>','Request a<br><em>cake quote.</em>'],
 ['For the occasions you choose<br>to make your own.','Wedding and celebration cakes.<br>Delivery across the UAE.'],
 [" const config=ctx.config||{};"," const meta=require('./seo').pageMetadata({title,description,path,canonicalPath});\n const config=ctx.config||{};"],
 ["esc(title)+' | '+esc(name)","esc(meta.title)+' | '+esc(name)"],
 ["esc(description||'Bespoke cakes, wedding collections and celebration pâtisserie. Explore designs, choose your flavours, and enquire about a custom cake.')","esc(meta.description)"]
]);
replace('pages/product.js',[
 ['THE DETAILS MAKE THE OCCASION.','CAKE PHOTOS'],
 ['Make it yours below. We’ll confirm your design and final quotation with you.','Choose flavours and decorations below. We’ll confirm size, price and delivery in your quote.'],
 ['Request a bespoke adaptation','Request design changes'],['CONTINUE EXPLORING','SIMILAR DESIGNS'],['In the same <em>spirit.</em>','Related <em>cakes.</em>'],
 ["title:p.title,description:p.title+' — '+money(p.minPriceFils)+'. Choose your variation and personalise your cake.'","title:p.metaTitle||p.title,description:p.metaDescription||p.description"]
]);
replace('pages/collection.js',[
 ['Find cakes, petite treats and celebration accessories.','Search cake designs by colour, flowers or style.'],
 ['Explore celebration cakes and statement designs. Refine the collection to find your occasion’s centrepiece.','Browse wedding, luxury and engagement cakes. Filter designs by tiers, flowers, flavour and price.'],
 ['Something more personal?','Need a custom design?'],['A DIFFERENT DIRECTION','NO MATCHING CAKES']
]);
replace('pages/forms.js',[
 ['Made around your occasion.','Design and price confirmed before ordering.'],
 ['Let’s talk about<br><em>your occasion.</em>','Contact<br><em>Maison Zavi.</em>'],
 ['Your vision.<br><em>Made personal.</em>','Request a<br><em>custom cake.</em>'],
 ['Start with a favourite flower, a colour or a feeling. Share your ideas and we’ll help shape a cake for your occasion.','Tell us your preferred cake size, flowers, colours and event date. Add reference photos if you have them.'],
 ['Your enquiry starts a conversation. Your design, date and price are confirmed separately.','Submitting an enquiry does not confirm an order. We’ll confirm the design, price and date with you.'],
 ['A personal edit of the designs you love.','Cakes you’ve saved for later.']
]);
replace('pages/editorial.js',[
 ['A considered<br><em>celebration.</em>','About<br><em>Maison Zavi.</em>'],
 ['A cake has a place in the room before it has a place on the plate. The colour, the silhouette, the details — each is part of the occasion you are creating.','Maison Zavi offers wedding, engagement and celebration cake designs. Browse the collection or send a request with your preferred size, colours, flowers and event date.'],
 ['The collection gives you a starting point: a sculptural tier, a ribbon, a carefully piped border. From there, choose your flavour and the words you want to say. For an occasion that calls for a different approach, begin with a bespoke brief.','Choose a design from the collection and select the available flavours and fillings. Add a cake message or request changes to the colours and decorations. For a new design, use the custom cake enquiry form.'],
 ['Consider the setting, the palette and the scale. Explore the collections to find a shape and finish that belong to your occasion.','Browse by occasion, tier count or flower type. Share your guest count and any venue requirements when requesting a quote.'],
 ['A personal message, a preferred date, a specific request. Share the details that make the cake yours.','Include your event date, delivery address and cake message. The design, price and delivery arrangements are confirmed before ordering.'],
 ['A considered arrival, arranged around your occasion.','Cake delivery across the UAE, with collection available by arrangement.'],
 ['A few things<br><em>to know.</em>','Cake ordering<br><em>questions.</em>'],
 ['Let’s find<br><em>your occasion.</em>','Page<br><em>not found.</em>'],
 ['This page could not be found. Explore the collection or return to the maison.','This page could not be found. Browse the cakes or return to the homepage.']
]);
replace('pages/photography.js',[
 ['Your cake,<br><em>your details.</em>','About our<br><em>cake photos.</em>'],['Explore the possibilities','Design references']
]);
console.log('Updated public copy and connected page metadata.');
