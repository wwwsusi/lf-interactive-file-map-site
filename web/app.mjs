const themeButton=document.getElementById('theme-toggle');
function applyTheme(theme){document.documentElement.dataset.theme=theme;themeButton.textContent=theme==='dark'?'☀ Svetlý režim':'☾ Tmavý režim';themeButton.setAttribute('aria-pressed',String(theme==='dark'));}
let savedTheme='dark';try{savedTheme=localStorage.getItem('lf-control-center-theme')||'dark';}catch{}
applyTheme(savedTheme==='light'?'light':'dark');
themeButton.onclick=()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';applyTheme(next);try{localStorage.setItem('lf-control-center-theme',next);}catch{}};
import {parseSnapshot} from './snapshot.mjs';
import {createDashboard} from './dashboard.mjs?v=20261008-compact-v3';
import {AREAS,normalizeGraph,ActivityStore,safeUrl,matchesSearch} from './model.mjs';
const $=id=>document.getElementById(id), ns='http://www.w3.org/2000/svg';
let graph=normalizeGraph({nodes:[],edges:[],coverage:{}}), demoGraph=null, selected=null, selectedEdge=null, page=0,zoom=1,dx=0,dy=0;
let endpoint='',stream=null,retry=null,closed=true,lastSequence=0,lastSync=null,sessionToken='',transport='sse',eventPolling=false,eventTimer=null,eventCursor=null,connectionEpoch=0,historyCatchingUp=false,eventStreamStale=false;
let importedAt=null,importFilename='',storageNote='',persisted=false;
const storageKey=new URL('.',location.href).pathname;
function openStorage(){return new Promise((resolve,reject)=>{const r=indexedDB.open('lf-file-map-local',1);r.onupgradeneeded=()=>r.result.createObjectStore('imports');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Úložisko je blokované inou kartou.'));});}
async function localGraph(mode,value){const db=await openStorage();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('imports',mode==='get'?'readonly':'readwrite'),store=tx.objectStore('imports');const r=mode==='get'?store.get(storageKey):mode==='delete'?store.delete(storageKey):store.put(value,storageKey);let result;r.onsuccess=()=>result=r.result;tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Uloženie prerušené.'));});}finally{db.close();}}
function importInfo(){$('import-info').textContent=importedAt?'Posledný import: '+new Date(importedAt).toLocaleString('sk-SK',{timeZone:'Europe/Prague'})+' · '+importFilename+' · '+(persisted?'uložené v tomto prehliadači':'iba táto relácia')+(storageNote?' · '+storageNote:''):'Posledný import: zatiaľ nebol uložený v tomto prehliadači'+(storageNote?' · '+storageNote:'');$('forget').hidden=!importedAt&&!persisted;}
const real=new ActivityStore(),demo=new ActivityStore(),collapsed=new Set(),flashes=new Map(),resultFlows=new Map();
const areas=()=>[...AREAS,...new Set(current().nodes.map(n=>n.area).filter(a=>!AREAS.includes(a)))];
const colors={'GitHub':'#46506b','Google Drive':'#d99b23','Google Sheets':'#22926d','Agenti':'#ca2468'};
const current=()=>$('demo-mode').checked&&demoGraph?demoGraph:graph;
const activities=()=>$('demo-mode').checked?demo:real;
const nodeById=id=>current().nodes.find(n=>n.id===id);
const allowed=n=>(!$('source').value||n.area===$('source').value)&&(!$('type').value||n.type===$('type').value)&&($('archive').checked||!n.history)&&matchesSearch(n,$('search').value);
const query=()=>$('search').value.toLocaleLowerCase('sk').trim();
const svg=(tag,attrs,parent)=>{const e=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);parent.append(e);return e;};
const el=(tag,value,parent)=>{const e=document.createElement(tag);if(value!=null)e.textContent=value;parent?.append(e);return e;};
const btn=(label,fn,parent)=>{const b=el('button',label,parent);b.addEventListener('click',fn);return b;};
function status(value,kind=''){$('connection').textContent=value;$('connection').className='badge '+kind;}
function setGraph(input){graph=normalizeGraph(input);page=0;selected=null;selectedEdge=null;options();render();}
function options(){const oldArea=$('source').value;$('source').replaceChildren(new Option('Všetky oblasti',''));for(const a of areas())$('source').append(new Option(a,a));$('source').value=oldArea;const old=$('type').value;$('type').replaceChildren(new Option('Všetky typy',''));for(const t of [...new Set(current().nodes.map(n=>n.type))].sort())$('type').append(new Option(t,t));$('type').value=old;}
function select(id){selected=id;selectedEdge=null;page=0;$('search').value='';render();}
function transform(){$('scene').setAttribute('transform',`translate(${dx} ${dy}) scale(${zoom})`);}
function render(){
 const data=current(),sc=$('scene'),width=Math.max(320,$('graph').clientWidth),height=$('graph').clientHeight||560;sc.replaceChildren();$('graph').setAttribute('viewBox',`0 0 ${width} ${height}`);
 document.body.classList.toggle('no-motion',(!$('demo-mode').checked&&(closed||(eventPolling&&(historyCatchingUp||eventStreamStale))))||!$('animate').checked||matchMedia('(prefers-reduced-motion: reduce)').matches);
 let nodes=data.nodes.filter(allowed),neighborIds=null;
 if(selected){neighborIds=new Set([selected,...data.edges.filter(e=>e.source===selected||e.target===selected).flatMap(e=>[e.source,e.target]),...activities().history.filter(e=>e.source_id===selected||e.target_id===selected).flatMap(e=>[e.source_id,e.target_id])]);nodes=nodes.filter(n=>neighborIds.has(n.id));const own=nodeById(selected);if(own&&!nodes.some(n=>n.id===selected))nodes.unshift(own);}
 const visibleResults=[...resultFlows.values()].filter(x=>x.until>Date.now()&&x.event.demo===Boolean($('demo-mode').checked)).map(x=>x.event);const activeIds=new Set([...activities().active.values(),...visibleResults].flatMap(e=>[e.source_id,e.target_id]));for(const n of data.nodes)if(activeIds.has(n.id)&&allowed(n)&&!nodes.some(x=>x.id===n.id))nodes.push(n);
 const radial=$('view').value==='graph';
 const shownAreas=$('source').value?[$('source').value]:(selected?areas().filter(a=>nodes.some(n=>n.area===a)):areas()),positions=new Map(),areaWidth=(width-36)/Math.max(1,shownAreas.length);
 $('groups').replaceChildren();
 let pages=1;
 if(radial){
  let candidates=nodes;
  const home=!selected&&!query()&&!$('source').value&&!$('type').value;
  if(home){const roots=new Set(data.roots||[]);candidates=nodes.filter(n=>roots.has(n.id));if(!candidates.length)candidates=nodes.filter(n=>n.type==='Priečinok'&&((n.id.startsWith('github:')&&n.id.endsWith(':'))||!(n.parents||[]).length)).slice(0,6);if(!candidates.length)candidates=nodes.slice(0,6);}
  const center=selected?nodeById(selected):null,others=candidates.filter(n=>n.id!==selected);
  pages=Math.max(1,Math.ceil(others.length/24));page=Math.min(page,pages-1);
  const visible=others.slice(page*24,page*24+24);
  for(const n of nodes.filter(n=>activeIds.has(n.id)))if(!visible.some(v=>v.id===n.id)&&n.id!==selected)visible.push(n);
  if(center)positions.set(center.id,{x:width/2,y:height/2,w:0,h:0,center:true});
  visible.forEach((n,i)=>{const angle=-Math.PI/2+2*Math.PI*i/Math.max(1,visible.length);const x=home&&visible.length===2?width*(i?0.7:0.3):width/2+Math.cos(angle)*Math.max(70,width/2-145),y=home&&visible.length===2?height/2:height/2+Math.sin(angle)*(height/2-65);positions.set(n.id,{x,y,w:0,h:0});});
  const hint=el('small',home?'Úvod: klikni na koreň a rozbaľ jeho prepojenia.':selected?'Vybraný súbor je uprostred; kliknutím prechádzaš jeho prepojenia.':'Výsledky hľadania a filtrov — klikni na súbor pre jeho prepojenia.',$('groups'));
 }else{
 for(const[ai,area]of shownAreas.entries()){
  const all=nodes.filter(n=>n.area===area),x=18+ai*areaWidth;
  const b=btn(`${collapsed.has(area)?'＋':'−'} ${area} · ${all.length}`,()=>{collapsed.has(area)?collapsed.delete(area):collapsed.add(area);render();},$('groups'));b.classList.toggle('collapsed',collapsed.has(area));
  svg('rect',{x,y:12,width:areaWidth-9,height:height-25,rx:10,class:'lane'},sc);
  const title=svg('text',{x:x+10,y:34,class:'lane-label'},sc);title.textContent=area;
  if(collapsed.has(area))continue;
  const visible=all.slice(page*8,page*8+8),special=all.filter(n=>activeIds.has(n.id)||n.id===selected);
  for(const n of special)if(!visible.some(v=>v.id===n.id))visible.unshift(n);
  const unique=[...new Map(visible.map(n=>[n.id,n])).values()].slice(0,14);
  unique.forEach((n,i)=>positions.set(n.id,{x:x+9,y:52+i*Math.min(57,(height-95)/Math.max(1,unique.length)),w:areaWidth-28,h:44}));
 }
 pages=Math.max(1,Math.ceil(Math.max(...shownAreas.map(a=>nodes.filter(n=>n.area===a).length),0)/8));
 }
 for(const e of data.edges){const a=positions.get(e.source),b=positions.get(e.target);if(!a||!b)continue;const path=pathBetween(a,b);const line=svg('path',{d:path,class:'edge '+e.kind,tabindex:0,role:'button','aria-label':`Väzba ${e.kind}: ${nodeById(e.source)?.name} → ${nodeById(e.target)?.name}`},sc);const hit=svg('path',{d:path,class:'edge-hit'},sc);for(const target of [line,hit]){target.addEventListener('click',()=>{selectedEdge=e;details();});target.addEventListener('keydown',ev=>{if(ev.key==='Enter'){selectedEdge=e;details();}});}}
 for(const e of activities().active.values()){const a=positions.get(e.source_id),b=positions.get(e.target_id);if(a&&b)svg('path',{d:pathBetween(a,b),class:'event-path '+e.operation,'marker-end':'url(#arrow)','data-operation':e.operation_id},sc);}
 for(const e of visibleResults){const a=positions.get(e.source_id),b=positions.get(e.target_id);if(a&&b){const path=svg('path',{d:pathBetween(a,b),class:'event-result '+e.status,'marker-end':'url(#arrow)','data-operation':e.operation_id},sc);svg('title',{},path).textContent=e.operation+' / '+e.status+' · '+e.timestamp;}}
 for(const n of nodes){const p=positions.get(n.id);if(!p)continue;let cls='node'+(n.id===selected?' selected':'');
  for(const e of activities().active.values())if([e.source_id,e.target_id].includes(n.id))cls+=' busy-'+e.operation;
  const flash=flashes.get(n.id);if(flash&&flash.until>Date.now())cls+=' '+flash.status;
  const g=svg('g',{transform:`translate(${p.x} ${p.y})`,class:cls,tabindex:0,role:'button','aria-label':n.name,'data-node-id':n.id},sc);
  if(radial){const palette={'MD dokument':'#bd185a','Register':'#287e72','Priečinok':'#8791a5','Obrázok':'#b37c19'};svg('circle',{cx:0,cy:0,r:p.center?14:10,fill:palette[n.type]||colors[n.area]||'#8791a5',class:'graph-dot'},g);const left=p.x>width*.67;const label=svg('text',{x:left?-17:17,y:4,'text-anchor':left?'end':'start',class:'graph-label'},g);label.textContent=truncate(n.name,width<600?22:38);svg('title',{},g).textContent=n.name+'\n'+n.id;g.addEventListener('click',()=>select(n.id));g.addEventListener('keydown',ev=>{if(['Enter',' '].includes(ev.key)){ev.preventDefault();select(n.id);}});continue;}
  svg('rect',{x:0,y:0,width:p.w,height:p.h},g);svg('circle',{cx:9,cy:13,r:3,fill:colors[n.area]||'#68758a'},g);
  const t=svg('text',{x:17,y:16},g);t.textContent=truncate(n.name,Math.max(12,Math.floor(p.w/6)));
  const sub=svg('text',{x:9,y:33,class:'sub'},g);sub.textContent=truncate((n.history?'ARCHÍV · ':'')+n.type+' · '+coverageLabel(n.coverage),Math.floor(p.w/5));
  svg('title',{},g).textContent=n.name+'\n'+n.id;
  g.addEventListener('click',()=>select(n.id));g.addEventListener('keydown',ev=>{if(['Enter',' '].includes(ev.key)){ev.preventDefault();select(n.id);}});
 }
 if(!nodes.length)svg('text',{x:width/2,y:height/2,'text-anchor':'middle',class:'empty-label'},sc).textContent=data.nodes.length?'Žiadne výsledky pri aktuálnych filtroch.':'Načítaj graf alebo pripoj zabezpečenú službu.';
 $('count').textContent=`${data.nodes.length} uzlov · ${data.edges.length} väzieb · ${nodes.length} pri filtroch`;
 $('coverage').textContent=data.nodes.length===0?'Snapshot: žiadne dáta — importuj graf':Number.isFinite(Date.parse(data.updated_at))?'Snapshot: '+new Date(data.updated_at).toLocaleString('sk-SK',{timeZone:'Europe/Prague'}):'Snapshot: čas zdrojových dát nie je známy';
 $('results').replaceChildren();
 if(pages>1){btn('←',()=>{page=Math.max(0,page-1);render();},$('results')).disabled=page===0;el('small',`Strana ${page+1} / ${pages}`,$('results'));btn('→',()=>{page=Math.min(pages-1,page+1);render();},$('results')).disabled=page>=pages-1;}
 if(query())for(const n of nodes.slice(0,12))btn(n.name,()=>select(n.id),$('results'));
 if($('demo-mode').checked)$('notice').textContent='DEMO — syntetický graf a udalosti. Nejde o skutočné Lady Fitness operácie.';
 else $('notice').textContent=data.coverage?.original_imported===false?'Pôvodný úplný graf z Macu ešte nebol importovaný. '+(data.coverage?.scope||'Zobrazené dáta nie sú jeho úplnou náhradou.'):(data.coverage?.scope||'Interný inventár; detaily pokrytia sú pri jednotlivých zdrojoch.');
 importInfo();transform();details();timeline();
}
const truncate=(s,n)=>s.length>n?s.slice(0,n-1)+'…':s;
const pathBetween=(a,b)=>{const x1=a.x+a.w/2,y1=a.y+a.h/2,x2=b.x+b.w/2,y2=b.y+b.h/2;return `M${x1} ${y1} C${(x1+x2)/2} ${y1},${(x1+x2)/2} ${y2},${x2} ${y2}`;};
const coverageLabel=s=>({content:'obsah načítaný',metadata:'iba metadata',unverified:'neoverený cieľ'}[s]||s);
function proof(value,parent){const box=el('div',typeof value==='string'?value:JSON.stringify(value,null,2),parent);box.className='evidence';}
function details(){const box=$('detail');box.replaceChildren();el('p','DETAIL',box).className='eyebrow';
 if(selectedEdge){el('h2','Dôkaz väzby',box);el('p',`${selectedEdge.source} → ${selectedEdge.target}`,box);el('p','Typ: '+selectedEdge.kind,box);for(const p of selectedEdge.evidence)proof(p,box);if(selectedEdge.stale)el('p','Historická väzba; v poslednej obnove nepotvrdená.',box);return;}
 const n=nodeById(selected);if(!n){el('h2','Vyber zdroj',box);el('p','Rozbaľ oblasť, hľadaj alebo otvor konkrétny uzol. Priame odkazy a umiestnenie nie sú dôkazom synchronizácie.',box);return;}
 el('h2',n.name,box);el('p',n.area+' / '+n.type,box);el('div',n.id,box).className='meta';el('div',n.path||'',box).className='meta';el('p',coverageLabel(n.coverage),box);
 if(n.last_success_at)el('p','Posledné úspešné načítanie: '+n.last_success_at,box);if(n.modified)el('p','Čas úpravy metadata (nie sledovaná udalosť): '+n.modified,box);if(n.access_error)el('p','Prístup: '+n.access_error,box);
 const url=safeUrl(n.url);if(url){const a=el('a','Otvoriť zdroj ↗',box);a.href=url;a.target='_blank';a.rel='noopener noreferrer';}
 const connections=current().edges.filter(e=>[e.source,e.target].includes(n.id));el('h3',`Prepojenia (${connections.length})`,box);
 for(const e of connections.slice(0,40)){const other=e.source===n.id…3562 tokens truncated…t fetch('./config.json')).json();$('tracking-scope').textContent=config.scope;if(config.eventServiceUrl){$('endpoint').value=endpointSafe(config.eventServiceUrl);$('connect').hidden=false;}else if(['127.0.0.1','localhost'].includes(location.hostname))$('endpoint').value=location.origin;}catch{$('tracking-scope').textContent='Živé napojenie nie je dostupné.';}
// Len diagnostika pre browser QA; žiadne tajné údaje ani plné dokumenty.
window.lfMapDiagnostics=()=>({nodes:current().nodes.length,edges:current().edges.length,active:activities().active.size,history:activities().history.length,lastSequence,lastSync,importedAt,persisted,demo:$('demo-mode').checked});

window.lfDashboardDiagnostics=dashboard.diagnostics;
