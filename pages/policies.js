'use strict';
const {esc,crumb,link,shell}=require('../lib/ui');
const policies={
 '/policies/refund-policy':{title:'Refunds & cancellations',intro:'Support with changes, cancellations and concerns about your Maison Zavi order.',sections:[
  ['Before your order is confirmed','Adding a cake to your cart or preparing a WhatsApp request does not confirm an order. You can change or withdraw an unconfirmed request. Orders become confirmed only when Maison Zavi agrees the design, date, total and arrangements with you on WhatsApp.'],
  ['Cancelling a confirmed order','Contact Maison Zavi as soon as possible with your order reference. Cakes and personalised treats are made for your occasion, so a change-of-mind cancellation may not be possible after preparation or custom work has begun. Any cancellation terms and committed costs must be explained and agreed before you confirm your order.'],
  ['Incorrect, damaged or defective items','Please tell us promptly if an item arrives damaged, is incorrect or does not meet the agreed specification. Include your order reference, a description and photographs where practical. We will review the issue and arrange an appropriate remedy, including replacement or refund where applicable. Do not consume food you believe is unsafe.'],
  ['Refund arrangements','This website does not collect payment. Where a refund is due for a payment arranged separately, Maison Zavi will confirm the amount, method and expected processing time in writing. You will not be required to accept store credit instead of a refund where a refund is required by law.'],
  ['Your rights','These terms do not exclude or restrict rights or remedies available under applicable UAE consumer protection law. Contact us through the Contact & enquiries page or your existing WhatsApp order conversation.']
 ]},
 '/policies/terms-of-service':{title:'Terms & conditions',intro:'The terms for using Maison Zavi and requesting a cake for your occasion.',sections:[
  ['Our service','Maison Zavi presents cake designs and accepts order enquiries for delivery within the United Arab Emirates. You must be able to enter into a binding agreement and provide accurate contact and order information.'],
  ['Orders through WhatsApp','The website provides browsing, personalisation, a cart and an order-request summary. It has no online payment service. A saved request, selected date or WhatsApp draft is not an accepted order. Confirmation, availability and any separate payment arrangements are agreed with Maison Zavi on WhatsApp.'],
  ['Prices and specifications','Prices are displayed in AED for the selected variation. Designs labelled with a starting price require a final written quotation. Review the quantity, flavour, size, decorations, delivery fee and complete payable total before confirming. Any tax treatment or additional agreed services must be stated in that confirmation; no unlisted charge is automatically added by this website.'],
  ['Design images and custom work','The catalogue photographs are cake design references, not photographs of completed Maison Zavi orders. Agree the actual design, scale, edible and structural elements, flower materials and any adaptations before ordering. Colour and handmade details can vary; material substitutions require your agreement.'],
  ['Your content','Upload or send reference images only when you are entitled to share them. Maison Zavi uses your brief and references to discuss and fulfil your request. Sending a reference does not give us permission to publish your personal images or promise an exact copy of another designer’s work.'],
  ['Delivery, changes and cake care','Our delivery, refund, substitution and edible-items policies explain the relevant arrangements. Please review them before confirming. Dietary requirements, venue access and preparation time must be discussed in advance.'],
  ['Using this website','Do not submit unlawful material, interfere with the service or attempt to access private records. Third-party services such as WhatsApp have their own terms. Contact Maison Zavi if you notice an error in a listing.'],
  ['Applicable law and updates','Applicable UAE law governs these terms, without limiting mandatory consumer rights. Changes to published terms apply prospectively and do not remove rights under an already confirmed order. Raise a concern with Maison Zavi first; your right to contact the competent consumer authority is unaffected.']
 ]},
 '/policies/substitution-policy':{title:'Substitution policy',intro:'How changes to cake flowers and decorations are discussed and agreed.',sections:[
  ['If a detail is unavailable','Maison Zavi will contact you if a specified decoration, flower, topper or packaging element cannot be supplied. We will explain the proposed alternative and any effect on appearance or price before making a material change.'],
  ['Your agreement','We aim to retain the agreed palette, design and value. A different flavour, ingredient affecting dietary requirements, tier count or significant floral change will not be treated as an automatic substitution. These details require your agreement.'],
  ['When an alternative does not suit','If no suitable alternative can be agreed, we will discuss revising or cancelling the affected part of the order and any refund due. Applicable consumer rights remain unaffected.']
 ]},
 '/policies/edible-items-policy':{title:'Edible items & cake care',intro:'A few practical details for enjoying your Maison Zavi cake.',sections:[
  ['Ingredients and allergies','Cakes may contain wheat or gluten, eggs, milk and nuts. Recipes, fillings and decorations vary, and cross-contact may occur. Tell us about allergies and dietary needs before confirming; a flavour name or natural-colour preference does not establish that a cake is suitable for an allergy.'],
  ['Storage and serving','Follow the storage instructions and use-by guidance supplied for your specific cake. Keep the cake away from heat and direct sunlight, and arrange suitable storage at the venue. Ask us for the correct serving and refrigeration arrangements before the event.'],
  ['Decorations and supports','Flowers, wires, dowels, boards, stands, candles and some toppers are not edible. Confirm which elements must be removed before serving. Large wedding designs may combine edible cake with display or support elements; their specification must be agreed in writing.'],
  ['Collection and handover','Keep the cake level during transport and follow the agreed handling instructions. Inspect the cake at handover where practical. Report a concern promptly; accepting delivery does not waive rights relating to a defect.'],
  ['Food colouring','Some edible colourings may temporarily stain the mouth or tongue. Choose your colouring preference on the product page and discuss any concern before ordering.']
 ]}
};
const policyLinks=[['/delivery','Shipping & delivery'],['/policies/refund-policy','Refunds & cancellations'],['/policies/substitution-policy','Substitution policy'],['/privacy','Privacy policy'],['/policies/terms-of-service','Terms & conditions'],['/policies/edible-items-policy','Edible items & cake care']];
function policy(ctx,path){
 const p=policies[path];if(!p)return null;
 const body='<main id="main" class="wrap policy-page">'+crumb([[p.title]])+'<section class="information-layout"><aside><p class="eyebrow">CLIENT CARE</p><nav aria-label="Policy navigation">'+policyLinks.map(([href,title])=>'<a href="'+href+'"'+(href===path?' aria-current="page"':'')+'>'+esc(title)+'</a>').join('')+'</nav></aside><article><p class="eyebrow">MAISON ZAVI · UPDATED 12 SEPTEMBER 2026</p><h1>'+esc(p.title)+'</h1><p class="intro">'+esc(p.intro)+'</p>'+p.sections.map(([h,t])=>'<section><h2>'+esc(h)+'</h2><p>'+esc(t)+'</p></section>').join('')+link('/contact','Contact Maison Zavi','button')+'</article></section></main>';
 return shell(ctx,{title:p.title,description:p.intro,body,path});
}
module.exports={policy,policies,policyLinks};
