import {SECTIONS,DashboardState,views,freshness,publicationLabel,taskLabel,dateValue} from './dashboard-model.mjs';
import {demoProjection} from './dashboard-demo.mjs';
import {safeUrl,searchText} from './model.mjs';
const make=(tag,text,parent,className)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(className)n.className=className;parent?.append(n);return n;};
const action=(text,fn,parent)=>{const n=make('button',text,parent);n.type='button';n.onclick=fn;return n;};
const labels={approval_evidence:'Dôkaz schválenia (zdroj / dátum / verzia)',registry_lifecycle:'Lifecycle podľa registra',registry_approval:'Schválenie podľa registra',registry_publication:'Publikovanie podľa registra',role:'Rola assetu',file_id:'Drive file ID',version:'Verzia',priority:'Priorita',task_status:'Úloha',next_step:'Ďalší krok',owner:'Zodpovednosť',due:'Termín / kontext',added_at:'Dátum pridania',lifecycle:'Lifecycle',placement:'Umiestnenie',objective:'Cieľ',start:'Začiatok',end:'Koniec',creative:'Kreatíva',approval:'Schválenie',publication:'Publikovanie',platform_verification:'Platformová evidencia',channel:'Kanál',publish_at:'Publikačný termín',availability:'Dostupnosť',price:'Aktuálna cena',evidence_status:'Stav evidencie',summary:'Stručný obsah',open_questions:'Otvorené otázky',blocking:'Blokuje ďalšiu prácu',date:'Dátum',results:'Výsledky',pending:'Lokálne pending actions'};
export function createDashboard({focusMap}){
 const state=new DashboardState(),nav=document.getElementById('dashboard-nav'),root=document.getElementById('dashboard'),map=document.getElementById('map-workspace'),panel=document.getElementById('dashboard-detail');
 let section='overview',query='',filter='',connected=false;
 const stamp=value=>dateValue(value)===null?'TBD':new Date(value).toLocaleString('sk-SK');
 function navigate(next){section=next;query='';filter='';panel.close();render();}
 for(const [key,label]of SECTIONS){const b=action(label,()=>navigate(key),nav);b.dataset.section=key;}
 function sourceFor(item){return state.data?.sources.find(s=>s.id===item.source_id);}
 function canonical(item,parent){const s=sourceFor(item),url=safeUrl(s?.url);if(url){const a=make('a','Canonical zdroj ↗',parent);a.href=url;a.target='_blank';a.rel='noopener noreferrer';}}
 function itemCard(item,parent){
  const card=make('article',null,parent,'dash-card');const top=make('div',null,card,'card-meta');
  const badge=item.kind==='task'?item.fields.priority||'TBD':item.fields.evidence_status||item.fields.lifecycle||item.fields.creative||'TBD';make('span',badge,top,'dash-badge');
  if(item.conflicts.length)make('span','Konflikt zdrojov',top,'conflict-label');
  action(item.title,()=>detail(item),card).className='card-title';
  const f=item.fields;
  if(item.kind==='task'){make('p',taskLabel(f.task_status),card);make('p',f.next_step||'Ďalší krok: TBD',card);}
  else if(item.kind==='output'){make('p',`${f.creative||'TBD'} · approval: ${f.approval||'TBD'}`,card);make('p',publicationLabel(item),card);make('small','Publikačný termín: '+(f.publish_at||'TBD'),card);}
  else if(['product','service'].includes(item.kind)){make('p',`${f.price||'TBD'} · dostupnosť: ${f.availability||'TBD'}`,card);}
  else make('p',f.summary||f.objective||f.open_questions||'Detail v canonical zdroji.',card);
  make('small',freshness(sourceFor(item)||{}).label+(sourceFor(item)?.status!=='ok'?' · obnova nedostupná':''),card);canonical(item,card);
 }
 function detail(item){
  panel.replaceChildren();action('Zavrieť',()=>panel.close(),panel).className='detail-close';make('p','READ-ONLY / CANONICAL EVIDENCIA',panel,'eyebrow');make('h2',item.title,panel);
  make('p',`ID: ${item.id}`,panel,'detail-id');const dl=make('dl',null,panel,'dash-fields');
  for(const [key,value]of Object.entries(item.fields)){make('dt',labels[key]||key,dl);make('dd',key==='task_status'?taskLabel(value):key==='publication'?publicationLabel(item):String(value??'TBD'),dl);}
  if(item.conflicts.length){make('h3','Konflikty — potrebné rozhodnutie',panel);for(const c of item.conflicts){make('p',labels[c.field]||c.field,panel);for(const v of c.values)make('p',`${v.value} · ${state.data.sources.find(s=>s.id===v.source_id)?.title||v.source_id}`,panel);}}
  make('h3','Pôvod a čerstvosť',panel);const s=sourceFor(item);make('p',`${item.provenance.owner} · ${item.provenance.identity} · ${item.provenance.anchor}`,panel);if(item.provenance.field_sources)for(const [field,id]of Object.entries(item.provenance.field_sources))make('small',`${labels[field]||field}: ${state.data.sources.find(s=>s.id===id)?.title||id}`,panel,'detail-link');make('p',freshness(s||{}).label,panel);make('p','Úprava zdroja: '+stamp(s?.modified_at),panel);canonical(item,panel);
  for(const link of item.links){const url=safeUrl(link.url);if(url){const a=make('a',(link.label||link.role)+' ↗',panel,'detail-link');a.href=url;a.target='_blank';a.rel='noopener noreferrer';}}
  make('h3','Súvisiace položky a zdroje',panel);for(const id of item.related_ids){const related=state.data.items.find(i=>i.id===id);if(related)action(related.title,()=>detail(related),panel);else make('p',id+' · MISSING / nenájdené v načítanom rozsahu',panel);}
  if(!state.demo)action('Zobraziť zdroj v mape',()=>{panel.close();navigate('map');focusMap(item.provenance.file_id,item.source_id,s?.url);},panel);
  panel.showModal();
 }
 function group(title,items,parent,limit=null,note=''){
  const box=make('section',null,parent,'dash-group');make('h3',title,box);if(note)make('p',note,box,'section-note');
  if(!items.length){make('p',state.data?.sources.some(s=>s.status!=='ok')?'V dostupnej evidencii nič nenájdené; časť zdrojov je nedostupná.':'V načítanom rozsahu nie je evidovaná položka.',box,'empty-row');return;}
  if(limit&&items.length>limit){make('p',`Zobrazených ${limit} z ${items.length} položiek.`,box,'dash-total');if(items[0]?.kind==='task'){const showAll=action('Zobraziť všetky NOW položky',()=>{showAll.remove();const list=make('div',null,box,'dash-grid');for(const item of items.slice(limit))itemCard(item,list);},box);}else action('Všetky položky →',()=>navigate(items[0]?.kind==='decision'?'direction':items[0]?.kind==='campaign'||items[0]?.kind==='output'?'campaigns':'sources'),box);}
  const grid=make('div',null,box,'dash-grid');for(const i of(limit?items.slice(0,limit):items))itemCard(i,grid);
 }
 function sourceView(){
  const box=make('section',null,root,'dash-group');make('h3','Pokrytie a čerstvosť',box);make('p','Čas úspešného čítania, úpravy dokumentu a zostavenia projekcie majú odlišný význam. Chyba zdroja neznamená prázdny zoznam.',box);
  for(const s of state.data.sources){const card=make('article',null,box,'source-row');make('h4',s.title,card);make('p',`${s.status.toUpperCase()} · ${freshness(s).label}`,card);make('p','Posledné úspešné čítanie: '+stamp(s.last_success_at)+' · Úprava zdroja: '+stamp(s.modified_at),card);if(s.error)make('p',s.error,card,'conflict-label');if(s.warning)make('p',s.warning,card);const url=safeUrl(s.url);if(url){const a=make('a','Otvoriť zdroj ↗',card);a.href=url;a.target='_blank';a.rel='noopener noreferrer';}}
  const conflicts=state.data.items.filter(i=>i.conflicts.length);group('Nevyriešené konflikty',conflicts,root);make('p','Projekcia zostavená: '+stamp(state.data.generated_at),root);
 }
 function render(){
  root.hidden=section==='map';map.hidden=section!=='map';for(const b of nav.querySelectorAll('button'))b.setAttribute('aria-current',b.dataset.section===section?'page':'false');if(section==='map'){window.dispatchEvent(new Event('resize'));return;}
  root.replaceChildren();const heading=make('div',null,root,'dash-heading');make('div',null,heading,'dash-heading-copy');make('p','LADY FITNESS / OPERATING DASHBOARD',heading.firstChild,'eyebrow');make('h2',SECTIONS.find(s=>s[0]===section)[1],heading.firstChild);
  if(connected)action('Obnoviť údaje',()=>document.dispatchEvent(new Event('lf-dashboard-refresh')),heading);
  action(state.demo?'Zavrieť demo':'Pozrieť syntetické demo',()=>{},heading).onclick=()=>{const wasDemo=state.demo;state.clear();if(!wasDemo){state.demo=true;state.accept(demoProjection());}else if(connected)document.dispatchEvent(new Event('lf-dashboard-refresh'));render();};
  if(state.demo)make('p','DEMO · Všetky položky sú syntetické. Nejde o aktuálny stav Lady Fitness.',root,'dash-alert demo-alert');
  if(state.error)make('p',state.error+(state.data?' Posledný úspešný snapshot zostáva označený svojím vekom.':''),root,'dash-alert');
  if(!state.data){make('h3',connected?'Business údaje zatiaľ nie sú dostupné.':'Pripoj zabezpečenú službu.',root);make('p','Interné údaje sa načítajú až po prihlásení. Táto stránka obsahuje iba rozhranie a syntetické demo; dashboard nič nemení v canonical zdrojoch.',root);action('Pripojiť službu',()=>document.getElementById('connection-dialog').showModal(),root);return;}
  const missing=state.data.sources.filter(s=>s.status!=='ok'),stale=state.data.sources.filter(s=>freshness(s).stale);
  make('p',`${state.data.sources.length-missing.length}/${state.data.sources.length} zdrojov dostupných · ${stale.length} vyžaduje kontrolu čerstvosti · ${state.demo?'DEMO':'Read-only'}`,root,'dash-freshness');
  if(missing.length)make('p','Nedostupné zdroje: '+missing.map(s=>s.title).join(', '),root,'dash-alert');
  if(section==='sources'){sourceView();return;}
  let v=views(state.data);
  if(section!=='overview'){
   const controls=make('div',null,root,'dash-filters'),input=make('input',null,controls);input.type='search';input.placeholder='Hľadať v tomto pohľade…';input.setAttribute('aria-label','Hľadať položky dashboardu');input.value=query;input.oninput=()=>{query=input.value;const pos=input.selectionStart;render();const next=root.querySelector('.dash-filters input');next.focus();next.setSelectionRange(pos,pos);};
   const sel=make('select',null,controls);sel.setAttribute('aria-label','Filter stavu');const statuses=[...new Set(state.data.items.flatMap(i=>[i.fields.lifecycle,i.fields.evidence_status,i.fields.creative,i.fields.approval]).filter(Boolean))].sort();sel.append(new Option('Všetky stavy',''));for(const x of statuses)sel.append(new Option(x,x));sel.value=filter;sel.onchange=()=>{filter=sel.value;render();};
   const match=i=>searchText(i.title+' '+i.id).includes(searchText(query))&&(!filter||Object.values(i.fields).includes(filter));v=Object.fromEntries(Object.entries(v).map(([k,a])=>[k,a.filter(match)]));
  }
  if(section==='overview'){
   group('Aktuálny smer',v.direction,root,2,'Zaznamenaný smer; návrhy sú samostatne v Smer a nápady.');
   group('Dôležité teraz',v.now,root,5,'Poradie podľa doloženej priority. Neznáma priorita zostáva TBD.');
   group('Čaká na rozhodnutie',v.decisions,root,5,'Otvorené body príslušných vlastníkov; žiadny nový decision register.');
   group('Kampane v príprave a v behu',v.campaigns.filter(i=>['PREPARING','RUNNING'].includes(i.fields.lifecycle)||i.conflicts.length),root,4);
   group('Najbližšie Facebook výstupy',v.outputs.filter(i=>/NOT_PUBLISHED|TBD/.test(i.fields.publication||'TBD')),root,4,'Nepotvrdený termín sa neprepočítava ani nedopĺňa.');
   const nextBox=make('section',null,root,'dash-group');make('h3','Ďalšie kroky',nextBox);make('p','Rovnaké NOW položky ako Dôležité teraz; nie druhý zoznam úloh.',nextBox,'section-note');const nextList=make('ol',null,nextBox,'next-list');for(const i of v.next.slice(0,5)){const row=make('li',null,nextList);action(i.title,()=>detail(i),row);make('p',i.fields.next_step||'TBD',row);}
   group('Ponuky súvisiace s prioritami',v.relevantOffers,root,4,'Iba doložené väzby cez stabilné IDs.');group('Posledné doložené zmeny',v.changes,root,3);
  }else if(section==='campaigns'){group('Kampane',v.campaigns,root);group('Facebook výstupy',v.outputs,root);}
  else if(section==='offers')group('Služby a produkty',v.offers,root);
  else{group('Zaznamenaný smer a ciele',v.direction,root);group('Nápady a návrhy',v.ideas,root,null,'Návrh nie je schválený realizačný plán.');group('Otvorené rozhodnutia',v.decisions,root);}
 }
 render();return {navigate,clear(){connected=false;state.clear();panel.close();panel.replaceChildren();render();},async load(endpoint,token){connected=true;const epoch=state.epoch;try{const r=await fetch(endpoint+'/api/dashboard',{headers:{Authorization:'Bearer '+token},credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(30000)});if(epoch!==state.epoch)return;if(!r.ok){if(r.status===401){document.dispatchEvent(new Event('lf-session-expired'));return;}throw Error(r.status===404||r.status===405?'Dashboard API ešte nie je nasadené.':'Načítanie business údajov zlyhalo (HTTP '+r.status+').');}const data=await r.json();if(epoch!==state.epoch)return;state.demo=false;state.accept(data,epoch);}catch(e){if(epoch===state.epoch)state.fail(e.message);}render();},diagnostics:()=>({items:state.data?.items.length||0,demo:state.demo,error:state.error,section})};
}
