import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'dist');fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(path.join(out,'data'),{recursive:true});
// Pevný allowlist. .runtime, private-data, sources, exporty a secrets sa nikdy nekopírujú.
for(const f of['index.html','app.mjs','model.mjs','style.css','README.html','config.json'])fs.copyFileSync(path.join(root,'web',f),path.join(out,f));
fs.writeFileSync(path.join(out,'data/graph.json'),JSON.stringify({schema_version:1,nodes:[],edges:[],coverage:{original_imported:false,scope:'Verejný shell bez interných dát.'}}));
fs.writeFileSync(path.join(out,'.nojekyll'),'');console.log('Build: public shell only; no private inventory/events.');
