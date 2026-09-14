'use strict';
const fs=require('node:fs');
function replace(file,pairs){
 let source=fs.readFileSync(file,'utf8');
 for(const [from,to]of pairs){if(!source.includes(from))throw Error(file+' missing '+from);source=source.replaceAll(from,to);}
 fs.writeFileSync(file,source);
}
const whatsappMarkup=` const whatsapp=require('./contact').whatsappUrl(config,data.product?'Hello Maison Zavi, I would like to discuss '+data.product.title+' (design '+data.product.id+').':undefined);
 const whatsappButton=whatsapp?'<a class="whatsapp-float" href="'+esc(whatsapp)+'" target="_blank" rel="noopener" aria-label="Chat with Maison Zavi on WhatsApp" title="Chat on WhatsApp"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.52 3.48A11.9 11.9 0 0 0 12.05 0C5.47 0 .12 5.35.12 11.93c0 2.1.55 4.16 1.59 5.98L0 24l6.25-1.64a11.94 11.94 0 0 0 5.8 1.48h.01C18.64 23.84 24 18.49 24 11.92c0-3.19-1.24-6.18-3.48-8.44ZM12.06 21.83a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.71.97.99-3.62-.23-.37a9.9 9.9 0 0 1-1.52-5.29c0-5.47 4.45-9.92 9.92-9.92 2.65 0 5.14 1.03 7.01 2.91a9.86 9.86 0 0 1 2.9 7.01c0 5.47-4.45 9.9-9.96 9.9Zm5.44-7.43c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.78-1.48-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.47 1.07 2.88 1.22 3.08.15.2 2.1 3.21 5.09 4.5.71.3 1.27.48 1.7.62.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z"/></svg></a>':'';
`;
replace('lib/ui.js',[
 [" const name=config.name||'Maison Zavi';"," const name=config.name||'Maison Zavi';\n"+whatsappMarkup],
 ['<link rel="stylesheet" href="/assets/css/product-typography.css">','<link rel="stylesheet" href="/assets/css/product-typography.css"><link rel="stylesheet" href="/assets/css/whatsapp.css">'],
 ["+'</head><body data-page=","+'</head><body data-page="],
 ["+'</script><noscript>","+'</script>'+whatsappButton+'<noscript>"]
]);
replace('pages/forms.js',[
 [" const title=isContact?'Contact the maison':'Your custom cake';"," const title=isContact?'Contact the maison':'Your custom cake';\n const whatsapp=require('../lib/contact').whatsappUrl(ctx.config);\n const whatsappLink=whatsapp?'<a href=\"'+esc(whatsapp)+'\" target=\"_blank\" rel=\"noopener\"><span>WhatsApp <span dir=\"ltr\">+971 54 597 4005</span></span>'+icon('arrow')+'</a>':'';"],
 ['aria-label="Enquiry help">\'+(isContact?','aria-label="Enquiry help">\'+whatsappLink+(isContact?']
]);
replace('assets/js/enquiry.js',[
 ['Send your enquiry to the maison','Send your enquiry on WhatsApp']
]);
replace('pages/home-content.js',[
 ['Browse wedding and celebration cakes, or request a custom design.<br>Design, price and delivery are confirmed before ordering.','Born in the heart of Dubai, Maison Zavi is here for the people and occasions that matter to you. Tell us who you’re celebrating, the flowers they love and the flavours you want to share.</p><p>If we’re unable to fulfil your request ourselves, we’ll work with a fulfilment partner and coordinate the details with you, helping make your occasion special.'],
 ['How we handle your request','Our story']
]);
replace('pages/editorial.js',[
 ['Maison Zavi offers wedding, engagement and celebration cake designs. Browse the collection or send a request with your preferred size, colours, flowers and event date.','Born in the heart of Dubai, Maison Zavi began with a simple idea: a cake should feel personal to the people sharing it. A wedding, an engagement or a family celebration — we want to know who it’s for and what would make them smile.'],
 ['THE MAISON APPROACH','OUR STORY'],
 ['THE COLLECTION, AND BEYOND','YOUR CELEBRATION'],
 ['Start with a design.<br><em>Make it personal.</em>','Tell us<br><em>who you’re celebrating.</em>'],
 ['Choose a design from the collection and select the available flavours and fillings. Add a cake message or request changes to the colours and decorations. For a new design, use the custom cake enquiry form.','Maybe it’s their favourite flower, a colour from your wedding invitation or a flavour everyone in the family loves. Share those details with us. We’ll talk through your ideas, guest count and budget, and agree the design with you.'],
 ['<h3>The occasion</h3><p>Include your event date, delivery address and cake message. The design, price and delivery arrangements are confirmed before ordering.</p>','<h3>When we need a partner</h3><p>If we’re unable to fulfil your request ourselves, we’ll work with a fulfilment partner. We’ll explain the arrangements and coordinate the details with you, so your occasion receives the care it deserves.</p>']
]);
const meta=JSON.parse(fs.readFileSync('data/page-metadata.json','utf8'));
meta['/atelier']={title:'Our Story: Born in Dubai',description:'Meet Maison Zavi, born in the heart of Dubai. Personal wedding and celebration cakes, with fulfilment partners when needed to help bring your plans together.'};
meta['/contact'].description='Message Maison Zavi on WhatsApp at +971 54 597 4005 for cake enquiries, custom designs and order discussions, or send your details through our contact form.';
fs.writeFileSync('data/page-metadata.json',JSON.stringify(meta,null,2)+'\n');
console.log('Connected WhatsApp and updated the homepage and About Us story.');
