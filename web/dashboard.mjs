import {SECTIONS,DashboardState,views,freshness,publicationLabel,taskLabel,dateValue,metrics,campaignCoverage,ideaBucket} from './dashboard-model.mjs';
import {snapshotAge} from './snapshot.mjs';
import {demoProjection} from './dashboard-demo.mjs';
import {safeUrl,searchText} from './model.mjs';
const make=(tag,text,parent,className)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(className)n.className=className;parent?.append(n);return n;};
const action=(text,fn,parent)=>{const n=make('button',text,parent);n.type='button';n.onclick=fn;return n;};
const labels={approval_evidence:'Dôkaz schválenia (zdroj / dátum / verzia)',registry_lifecycle:'Lifecycle podľa registra',registry_approval:'Schválenie podľa registra',registry_publication:'Publikovanie podľa registra',role:'Rola assetu',file_id:'Drive file ID',version:'Verzia',priority:'Priorita',task_status:'Úloha',next_step:'Ďalší krok',owner:'Zodpovednosť',due:'Termín / kontext',added_at:'Dátum pridania',lifecycle:'Lifecycle',placement:'Umiestnenie',objective:'Cieľ',start:'Začiatok',end:'Koniec',creative:'Kreatíva',approval:'Schválenie',publication:'Publikovanie',platform_verification:'Platformová evidencia',channel:'Kanál',publish_at:'Publikačný termín',availability:'Dostupnosť',audience:'Publikum / cenová skupina',creation_audience:'Publikum tvorby',value:'Hodnota pre publikum',included:'Zahrnuté',booking:'Booking / CTA',capacity:'Kapacita',units:'Počet jednotiek',unit:'Jednotka',unit_price:'Cena / jednotka',price:'Aktuálna cena',proposed_price:'Navrhovaná nová cena',price_effective:'Účinnosť ceny',evidence_status:'Stav evidencie',summary:'Stručný obsah',open_questions:'Otvorené otázky',blocking:'Blokuje ďalšiu prácu',date:'Dátum',results:'Výsledky',pending:'Lokálne pending actions'};
export function createDashboard({focusMap}){
 const state=new DashboardState(),nav=document.getElementById('dashboard-nav'),root=document.getElementById('dashboard'),map=document.getElementById('map-workspace'),panel=document.getElementById('dashboard-detail');
 let section='overview',query='',filter='',importRecord=null,savedSnapshot=null,recalculatedAt=null,fieldFilters={};
 const stamp=value=>dateValue(value)===null?'TBD':new Date(value).toLocaleString('sk-SK',{timeZone:'Europe/Prague'});
 function navigate(next){section=next;query='';filter='';fieldFilters={};panel.close();render();}
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
  else if(['product','service'].includes(item.kind)){make('p',`${f.price||'TBD'} · dostupnosť: ${f.availability||'TBD'}`,card);if(f.summary)make('p',f.summary,card);}
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
  if(limit&&items.length>limit){make('p',`Zobrazených ${limit} z ${items.length} položiek.`,box,'dash-total');if(items[0]?.kind==='task'){const showAll=action('Zobraziť všetky NOW položky',()=>{navigate('now');},box);}else action('Všetky položky →',()=>navigate(items[0]?.kind==='decision'?'decisions':items[0]?.kind==='campaign'||items[0]?.kind==='output'?'campaigns':'sources'),box);}
  const grid=make('div',null,box,'dash-grid');for(const i of(limit?items.slice(0,limit):items))itemCard(i,grid);
 }
 function metricsView(parent){
  const m=metrics(state.data),box=make('section',null,parent,'metric-panel');make('h3','Stav načítanej evidencie',box);
  const tiles=make('div',null,box,'metric-tiles');for(const [label,count,target]of [['Nápady',m.ideas,'direction'],['NOW úlohy',m.tasks,'now'],['Kampane',m.campaigns,'campaigns'],['FB výstupy',m.outputs,'campaigns'],['Aktívne služby',views(state.data).activeServices.length,'offers'],['Návrhy služieb',views(state.data).serviceIdeas.length,'offers']])action(count+' · '+label,()=>navigate(target),tiles);
  make('h4','Nápady podľa stavu evidencie',box);const chart=make('div',null,box,'idea-chart');
  const colors=['#ED0D5B','#0F1D30','#8A0224','#526073','#FDF1F5'];let at=0;const stops=[];for(const [i,[label,count]]of m.stages.entries()){const end=at+count/Math.max(1,m.ideas)*100;stops.push(`${colors[i%colors.length]} ${at}% ${end}%`);at=end;}
  const donut=make('div',null,chart,'idea-donut');donut.style.background=m.ideas?`conic-gradient(${stops.join(',')})`:'#F4F5F9';donut.setAttribute('role','img');donut.setAttribute('aria-label',m.stages.map(([s,n])=>s+': '+n).join(', ')||'Žiadny evidovaný nápad');make('strong',String(m.ideas),donut);
  const legend=make('ul',null,chart,'chart-legend');for(const [i,[label,count]]of m.stages.entries()){const row=make('li',null,legend);make('span',null,row,'chart-key').style.background=colors[i%colors.length];action(label+' · '+count,()=>{navigate('direction');filter=label;render();},row);}
  make('p',m.partial?'Čiastočné pokrytie: niektoré zdroje sú nedostupné.':'Počty položiek v načítanom rozsahu.',box,'section-note');make('p',`Konflikty: ${m.conflicts} · Stavy nápadov neznamenajú approval.`,box,'section-note');make('small','Projekcia: '+stamp(state.data.generated_at),box);
 }
 function priceTable(items,parent,limit=null){
  const box=make('section',null,parent,'price-panel');make('h3','Cenník · aktuálny vs. navrhovaný',box);make('p','Nová cena je iba explicitne evidovaný návrh. Historická cena nie je návrh; TBD znamená chýbajúcu evidenciu.',box,'section-note');
  const wrap=make('div',null,box,'price-scroll'),table=make('table',null,wrap,'price-table'),head=make('tr',null,make('thead',null,table));for(const h of ['Služba / produkt','Aktuálna','Navrhovaná nová'])make('th',h,head).scope='col';const body=make('tbody',null,table);
  for(const i of(limit?items.slice(0,limit):items)){const row=make('tr',null,body);action(i.title,()=>detail(i),make('td',null,row));make('td',i.fields.price||'TBD',row);make('td',i.fields.proposed_price||'TBD',row);}
  if(!items.length)make('p','Ceny v načítanom rozsahu nie sú dostupné.',box);if(limit&&items.length>limit)action(`Celý cenník (${items.length}) →`,()=>navigate('offers'),box);
 }
 function sourceView(){
  const box=make('section',null,root,'dash-group');make('h3','Pokrytie a čerstvosť',box);make('p','Čas úspešného čítania, úpravy dokumentu a zostavenia projekcie majú odlišný význam. Chyba zdroja neznamená prázdny zoznam.',box);
  for(const s of state.data.sources){const card=make('article',null,box,'source-row');make('h4',s.title,card);make('p',`${s.status.toUpperCase()} · ${freshness(s).label}`,card);make('p','Posledné úspešné čítanie: '+stamp(s.last_success_at)+' · Úprava zdroja: '+stamp(s.modified_at),card);if(s.error)make('p',s.error,card,'conflict-label');if(s.warning)make('p',s.warning,card);const url=safeUrl(s.url);if(url){const a=make('a','Otvoriť zdroj ↗',card);a.href=url;a.target='_blank';a.rel='noopener noreferrer';}}
  group('Dátové medzery',views(state.data).dataGaps,root);metricsView(root);const conflicts=state.data.items.filter(i=>i.conflicts.length);group('Nevyriešené konflikty',conflicts,root);make('p','Projekcia zostavená: '+stamp(state.data.generated_at),root);
 }
 function render(){
  root.hidden=section==='map';map.hidden=section!=='map';for(const b of nav.querySelectorAll('button'))b.setAttribute('aria-current',b.dataset.section===section?'page':'false');if(section==='map'){window.dispatchEvent(new Event('resize'));return;}
  root.replaceChildren();const heading=make('div',null,root,'dash-heading');make('div',null,heading,'dash-heading-copy');make('p','LADY FITNESS / CEO CONTROL CENTER',heading.firstChild,'eyebrow');make('h2',SECTIONS.find(s=>s[0]===section)[1],heading.firstChild);
  const refresh=action('Obnoviť report',()=>{if(state.demo)state.accept(demoProjection());else if(savedSnapshot)state.accept(savedSnapshot);recalculatedAt=new Date().toISOString();render();},heading);refresh.disabled=!state.data;refresh.title='Prepočíta načítaný snapshot. Nové dáta získame iba novým importom.';
  action('Importovať snapshot',()=>document.getElementById('import').click(),heading);
  if(state.data)action('Export pre AI · JSON',()=>{const v=views(state.data);const report={format:'lf-ceo-review',version:2,exported_at:new Date().toISOString(),snapshot_at:state.data.generated_at,import:importRecord,filters:{section,query,filter,fields:fieldFilters},coverage:campaignCoverage(state.data),metrics:metrics(state.data),views:Object.fromEntries(Object.entries(v).map(([key,items])=>[key,items.map(i=>i.id)])),sources:state.data.sources,items:state.data.items};const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='LF_CEO_AI_REVIEW.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},heading);
  if(importRecord)action('Vymazať uložený snapshot',()=>document.getElementById('forget').click(),heading);
  action(state.demo?'Zavrieť demo':'Pozrieť syntetické demo',()=>{},heading).onclick=()=>{const wasDemo=state.demo;state.clear();if(!wasDemo){state.demo=true;state.accept(demoProjection());}else if(savedSnapshot)state.accept(savedSnapshot);render();};
  make('p','Snapshot režim · bez Google OAuth. Obnovenie reportu nečíta Drive ani Sheets; nové údaje vyžadujú nový import.',root,'section-note');
  if(importRecord){make('p',`Posledný import: ${stamp(importRecord.importedAt)} · ${importRecord.filename} · ${importRecord.persisted?'uložené v tomto prehliadači':'iba táto relácia'}`,root,'dash-freshness');if(importRecord.note)make('p',importRecord.note,root,'dash-alert');}
  if(state.data)make('p',`Zdrojový snapshot: ${stamp(state.data.generated_at)} · vek: ${snapshotAge(state.data.generated_at)}${recalculatedAt?' · Report prepočítaný: '+stamp(recalculatedAt):''}`,root,'section-note');
  if(state.demo)make('p','DEMO · Všetky položky sú syntetické. Nejde o aktuálny stav Lady Fitness.',root,'dash-alert demo-alert');
  if(state.error)make('p',state.error+(state.data?' Posledný úspešný snapshot zostáva označený svojím vekom.':''),root,'dash-alert');
  if(!state.data){make('h3',importRecord?.graphOnly?'Graf je načítaný; business údaje v ňom nie sú.':'Importuj dashboard snapshot.',root);make('p',importRecord?.graphOnly?'Inventár súborov neobsahuje potvrdené ceny, priority ani stavy kampaní. Pre tieto údaje importuj dashboard projekciu alebo spoločný snapshot. Pôvodná mapa zostáva dostupná.':'Importuj JSON dashboard projekcie alebo spoločný snapshot s grafom. Dáta sa vedomým importom uložia iba v tomto prehliadači, nikam sa neodosielajú. Zabezpečená služba zostáva voliteľná pre mapu a históriu operácií.',root);if(importRecord?.graphOnly)action('Otvoriť mapu',()=>navigate('map'),root);return;}
  const missing=state.data.sources.filter(s=>s.status!=='ok'),stale=state.data.sources.filter(s=>freshness(s).stale);
  make('p',`${state.data.sources.length-missing.length}/${state.data.sources.length} zdrojov dostupných · ${stale.length} vyžaduje kontrolu čerstvosti · ${state.demo?'DEMO':'Read-only'}`,root,'dash-freshness');
  if(missing.length)make('p','Nedostupné zdroje: '+missing.map(s=>s.title).join(', '),root,'dash-alert');
  if(section==='sources'){sourceView();return;}
  let v=views(state.data);
  if(section!=='overview'){
   const controls=make('div',null,root,'dash-filters'),input=make('input',null,controls);input.type='search';input.placeholder='Hľadať v tomto pohľade…';input.setAttribute('aria-label','Hľadať položky dashboardu');input.value=query;input.oninput=()=>{query=input.value;const pos=input.selectionStart;render();const next=root.querySelector('.dash-filters input');next.focus();next.setSelectionRange(pos,pos);};
   const sel=make('select',null,controls);sel.setAttribute('aria-label','Filter stavu');const statuses=[...new Set(state.data.items.flatMap(i=>[i.fields.lifecycle,i.fields.evidence_status,i.fields.creative,i.fields.approval]).filter(Boolean))].sort();sel.append(new Option('Všetky stavy',''));for(const x of statuses)sel.append(new Option(x,x));sel.value=filter;sel.onchange=()=>{filter=sel.value;render();};
   const keys=section==='now'?['priority','task_status','area','owner']:section==='offers'?['availability','audience','type']:[];for(const key of keys){const select=make('select',null,controls);select.setAttribute('aria-label',labels[key]||key);select.append(new Option(labels[key]||key,''));for(const value of [...new Set(state.data.items.filter(i=>section==='now'?i.kind==='task':i.kind==='service').map(i=>i.fields[key]).filter(Boolean))].sort())select.append(new Option(value,value));select.value=fieldFilters[key]||'';select.onchange=()=>{fieldFilters[key]=select.value;render();};}
   const match=i=>Object.entries(fieldFilters).every(([key,value])=>!value||i.fields[key]===value)&&searchText(i.title+' '+i.id).includes(searchText(query))&&(!filter||Object.values(i.fields).includes(filter));v=Object.fromEntries(Object.entries(v).map(([k,a])=>[k,a.filter(match)]));
  }
  if(section==='overview'){
   const layout=make('div',null,root,'overview-layout'),left=make('div',null,layout,'overview-main'),right=make('div',null,layout,'overview-side');const summary=make('section',null,left,'dash-group');make('h3','Executive Summary',summary);make('p',`V načítanej evidencii je ${v.now.length} operatívnych úloh; NEXT vyberá ${v.next.length} okamžitých krokov s potvrdenou prioritou P0/P1. Aktívnych služieb je ${v.activeServices.length}; dostupnosť sa eviduje samostatne. ${v.decisions.length} bodov je výslovne označených ako business rozhodnutie. Konfliktné kampane nie sú započítané medzi jednoznačne bežiace.`,summary);
   group('Aktuálny smer',v.direction,left,2,'Zaznamenaný smer; návrhy sú samostatne v Smer a nápady.');
   group('Dôležité teraz',v.now.filter(i=>['P0','P1'].includes(i.fields.priority)),left,3,'Poradie podľa doloženej priority. Neznáma priorita zostáva TBD.');
   group('NEXT — bezprostredné ďalšie kroky',v.next,right,5);
   group('Čaká na rozhodnutie',v.decisions,left,3,'Otvorené body príslušných vlastníkov; žiadny nový decision register.');
   group('Kampane v príprave a v behu',v.campaigns.filter(i=>!i.conflicts.length&&['PREPARING','RUNNING','PLANNED','ACTIVE'].includes(i.fields.lifecycle)),right,2);
   group('Najbližšie Facebook výstupy',v.outputs.filter(i=>/NOT_PUBLISHED|TBD/.test(i.fields.publication||'TBD')),right,2,'Nepotvrdený termín sa neprepočítava ani nedopĺňa.');
   const recent=v.changes.filter(i=>i.fields.business_verified===true&&dateValue(i.fields.date)!==null&&Date.now()-dateValue(i.fields.date)>=0&&Date.now()-dateValue(i.fields.date)<=7*86400000);group('Posledné doložené business zmeny',recent,left,5,recent.length?'':'No verified business changes available');group('Služby v príprave a pilote',v.preparingServices,right,3);group('Riziká a blokery',state.data.items.filter(i=>i.conflicts.length||i.fields.blocked===true),right,5);group('Nedávne dokončenia',state.data.items.filter(i=>i.fields.completion_verified===true),left,3,'Iba explicitná evidencia dokončenia, schválenia alebo publikovania.');
  }else if(section==='now'){group('Úplný register NOW',v.now,root);}
  else if(section==='decisions'){group('Business rozhodnutia vlastníka',v.decisions,root,null,'Iba explicitne klasifikované business rozhodnutia. Chýbajúce polia patria do Kvality dát.');action('Dátové medzery →',()=>navigate('sources'),root);}
  else if(section==='campaigns'){const coverage=campaignCoverage(state.data);make('p',`GitHub briefs: ${coverage.briefs} · chýbajúci canonical brief: ${coverage.missing.length} · nedostupné: ${coverage.unavailable.length}`,root,coverage.missing.length||coverage.unavailable.length?'dash-alert':'section-note');group('Kampane',v.campaigns,root);for(const status of ['DRAFT','APPROVED','PUBLISHED'])group(status+' · Facebook výstupy',v.outputs.filter(i=>status==='PUBLISHED'?publicationLabel(i).startsWith('Publikovan'):status==='APPROVED'?i.fields.approval==='APPROVED'&&!publicationLabel(i).startsWith('Publikovan'):i.fields.approval!=='APPROVED'&&!publicationLabel(i).startsWith('Publikovan')),root);}
  else if(section==='offers'){group('Aktívne služby',v.activeServices,root,null,'Lifecycle ACTIVE podľa registra. Aktuálnu dostupnosť over v samostatnom poli služby.');group('Nápady a návrhy služieb',v.serviceIdeas,root,null,'IDEA / PROPOSED nie je schválená ani aktívna ponuka.');group('Služby v príprave a pilote',v.preparingServices,root);group('Ostatné služby',v.otherServices,root);priceTable(v.offers,root);group('Nové retailové návrhy',v.ideas.filter(i=>i.id.startsWith('LF-PROP-')),root,null,'Samostatné návrhy; nie cenové zmeny existujúcich produktov.');}
  else{group('Zaznamenaný smer a ciele',v.direction,root);for(const bucket of ['FOCUS NOW','LATER','PARKED','UNCLASSIFIED'])group(bucket,v.ideas.filter(i=>ideaBucket(i)===bucket),root,null,'Zaradenie vyžaduje explicitnú evidenciu; NOW úlohy sú samostatný register.');metricsView(root);}
 }
 render();return {navigate,importError(message){state.fail(message);render();},clear(){importRecord=null;savedSnapshot=null;recalculatedAt=null;state.clear();panel.close();panel.replaceChildren();render();},importSnapshot(projection,record){const checked=projection?new DashboardState():null;if(checked)checked.accept(projection);state.clear();savedSnapshot=checked?.data||null;importRecord={...record};recalculatedAt=null;if(savedSnapshot)state.accept(savedSnapshot);panel.close();render();},diagnostics:()=>({items:state.data?.items.length||0,demo:state.demo,error:state.error,section,mode:'snapshot',importedAt:importRecord?.importedAt||null})};
}
