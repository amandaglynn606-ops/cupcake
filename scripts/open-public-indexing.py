from pathlib import Path
def edit(file,old,new):
 p=Path(file);s=p.read_text(encoding='utf-8')
 if old not in s:raise RuntimeError(file+' '+old[:70])
 p.write_text(s.replace(old,new),encoding='utf-8')
edit('pages/product.js',"noindex:!!p.imageReference,",'')
edit('pages/collection.js',"noindex:[...params.keys()].some(key=>key!=='page'),",'')
edit('tests/studio.test.js',"html.includes('name=\"robots\" content=\"index, follow\"')","html.includes('name=\"robots\" content=\"index, follow, max-image-preview:large\"')")
edit('tests/studio.test.js',"assert.ok(oldHtml.includes('noindex, follow'));","assert.ok(!oldHtml.includes('noindex'));")
edit('tests/studio.test.js',"assert.ok(filtered.includes('noindex, follow'));","assert.ok(!filtered.includes('noindex'));")
edit('tests/studio.test.js',"assert.ok(!sitemap.includes(raw.products[0].handle));","assert.ok(sitemap.includes(raw.products[0].handle));")
