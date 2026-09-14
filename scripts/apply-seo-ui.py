from pathlib import Path
def edit(file,old,new):
 p=Path(file);s=p.read_text(encoding='utf-8')
 if old not in s:raise RuntimeError(file+' '+old[:70])
 p.write_text(s.replace(old,new),encoding='utf-8')
edit('lib/ui.js',"'<link rel=\"icon\"", "'<link rel=\"icon\"") if False else None
edit('lib/ui.js','<link rel="icon" href="/favicon.svg?v=xavi">',"'+require('./seo').seoHead(config,{path,canonicalPath,noindex},esc)+'<link rel=\"icon\" href=\"/favicon.svg?v=xavi\">")
edit('lib/ui.js','<link rel="stylesheet" href="/assets/css/atelier.css">','<link rel="stylesheet" href="/assets/css/atelier.css"><link rel="stylesheet" href="/assets/css/floral.css">')
edit('assets/css/floral.css','var(--font-sans)','var(--sans)')
edit('pages/collection.js',"return shell(ctx,{title,description,body,path,scripts:","return shell(ctx,{title:result.page>1?title+' — Page '+result.page:title,description,body,path,canonicalPath:path+(result.page>1?'?page='+result.page:''),noindex:[...params.keys()].some(key=>key!=='page'),scripts:")
