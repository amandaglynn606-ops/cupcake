'use strict';
const {shell,crumb,icon}=require('../lib/ui');
const {EMIRATES}=require('../lib/pricing');
const emirates=EMIRATES.map(e=>'<option>'+e+'</option>').join('');
function checkout(ctx,path='/checkout'){
 const body=`<main id="main" class="wrap checkout-page streamlined-checkout">
 <header class="checkout-heading"><div><p class="eyebrow">YOUR CAKE REQUEST</p><h1>${path==='/cart'||path==='/bag'?'Your <em>cart.</em>':'Contact &amp; <em>delivery.</em>'}</h1></div><p>Review your cakes. All details are optional.<br>Continue directly to WhatsApp.</p></header>
 <div id="checkout-empty" class="empty-state" hidden><h2>Your cart is empty.</h2><p>Choose a cake to discuss on WhatsApp.</p><a class="button" href="/collections/all">Browse cakes &rarr;</a></div>
 <section id="checkout-layout" class="checkout-layout"><form id="checkout-form" novalidate>
 <details class="checkout-section" open data-checkout-contact><summary><span><span class="step-number">01</span> Contact details</span><span class="section-chevron" aria-hidden="true">+</span></summary><div class="checkout-section-body">
 <div class="form-grid"><label>First name<input name="name" autocomplete="given-name" maxlength="60"></label><label>Last name<input name="lastName" autocomplete="family-name" maxlength="60"></label></div>
 <label>Email address<input name="email" type="email" autocomplete="email" maxlength="160" placeholder="you@example.com"></label><label>Phone / WhatsApp number<input name="phone" type="tel" autocomplete="tel" maxlength="30" placeholder="+971"></label>
 <button type="button" class="text-link checkout-next" data-next-delivery>Continue to delivery ${icon('arrow')}</button></div></details>
 <details class="checkout-section" data-checkout-delivery><summary><span><span class="step-number">02</span> Delivery or pickup</span><span class="section-chevron" aria-hidden="true">+</span></summary><div class="checkout-section-body">
 <p class="field-help">Dubai delivery: AED 100. Other emirates: AED 200. Pickup is free.</p>
 <div class="fulfilment-options"><label><input type="radio" name="fulfilment" value="delivery" checked>Delivery</label><label><input type="radio" name="fulfilment" value="pickup">Pickup</label></div>
 <div id="shipping-fields"><div class="form-grid"><label>Emirate<select name="emirate" autocomplete="shipping address-level1">${emirates}</select></label><label>City<input name="city" autocomplete="shipping address-level2" maxlength="100"></label></div><label>Area<input name="area" autocomplete="shipping address-level3" maxlength="120" placeholder="For example: Jumeirah"></label><label>Street, building &amp; apartment<textarea name="address" autocomplete="shipping street-address" maxlength="500" rows="2"></textarea></label></div>
 <p id="pickup-note" class="field-help" hidden>We will confirm the pickup location and time on WhatsApp.</p>
 <div class="form-grid"><label>Preferred date<input type="date" name="date"></label><label>Preferred time<select name="time"><option value="">To confirm on WhatsApp</option><option value="10am-7pm">Between 10 am and 7 pm</option><option value="10am-10pm" data-pickup-time hidden disabled>Pickup: 10 am to 10 pm</option></select></label></div>
 <label>Additional details <small>Optional</small><textarea name="notes" maxlength="1000" rows="2" placeholder="Delivery directions or cake requests"></textarea></label>
 <div class="delivery-method"><span id="delivery-method-label">Delivery</span><strong id="delivery-method-price">AED 100</strong></div>
 </div></details>
 <label class="consent"><input type="checkbox" name="saveInfo"><span>Remember my contact and address on this device.</span></label>
 <label class="consent"><input name="consent" type="checkbox"><span>I agree to being contacted about this request. My cake, price and date require confirmation. <a href="/privacy">Privacy information</a></span></label>
 <p class="form-error" role="alert"></p><button class="button full-width" type="submit" id="submit-order">Proceed to WhatsApp ${icon('arrow')}</button>
 <p class="form-footnote">WhatsApp opens with your complete request. Press Send there to deliver it to Maison Zavi.</p>
 </form><aside class="checkout-summary" id="checkout-summary"><p>Loading your cart…</p></aside></section>
 <section id="order-success" class="order-success" hidden></section></main>`;
 return shell(ctx,{title:path==='/checkout'?'Checkout':'Your cart',body,path,styles:['checkout-refinement'],scripts:['checkout']});
}
module.exports={checkout};
