// Business projections are separate from the file graph and are never persisted.
export const SECTIONS=[['overview','Prehľad'],['campaigns','Kampane a obsah'],['offers','Ponuky'],['direction','Smer a nápady'],['map','Mapa zdrojov'],['sources','Stav zdrojov']];
export const TASK_STATUS=Object.freeze({'to-do':'NEZAČATÉ',preparing:'V PRÍPRAVE',running:'PREBIEHA','NEZAČATÉ':'NEZAČATÉ','V PRÍPRAVE':'V PRÍPRAVE','PREBIEHA':'PREBIEHA'});
export function taskLabel(value){return TASK_STATUS[value]||'UNCERTAIN';}
export const dateValue=value=>typeof value==='string'&&Number.isFinite(Date.parse(value))?Date.parse(value):null;
export function freshness(source,now=Date.now()){
 const stamp=dateValue(source.last_success_at);if(stamp===null)return {label:'Bez úspešného čítania',stale:true,age:null};
 if(stamp>now+60000)return {label:'Čas zdroja je v budúcnosti · UNCERTAIN',stale:true,age:null};
 const age=Math.max(0,now-stamp),minutes=Math.floor(age/60000);
 return {label:minutes<1?'Načítané práve teraz':minutes<60?`Načítané pred ${minutes} min`:minutes<1440?`Načítané pred ${Math.floor(minutes/60)} h`:`Načítané pred ${Math.floor(minutes/1440)} d`,age,stale:source.status!=='ok'||age>300000};
}
export function publicationLabel(item){
 const f=item.fields||{},p=String(f.publication||'TBD'),v=String(f.platform_verification||'TBD');
 if(/PUBLISHED|PUBLIKOVAN/i.test(p)&&!/NOT_PUBLISHED|NEPUBLIK/i.test(p)&&! /NOT_|NEOVER|NOT PERFORMED/i.test(v)&&v==='PLATFORM_VERIFIED'&&item.links?.some(l=>l.role==='publication'))return 'Publikované · platformovo overené';
 if(/PUBLISHED|PUBLIKOVAN/i.test(p)&&! /NOT_PUBLISHED|NEPUBLIK/i.test(p))return 'Publikovanie oznámené · platformovo neoverené';
 return p;
}
export function validateProjection(input){
 if(!input||input.schema_version!==1||!Array.isArray(input.sources)||!Array.isArray(input.items)||input.items.length>10000||input.sources.length>300)throw Error('Neplatný dashboard kontrakt.');
 const sourceIds=new Set(),ids=new Set();
 for(const s of input.sources){if(!s.id||sourceIds.has(s.id)||!['ok','error','missing','blocked'].includes(s.status))throw Error('Neplatná evidencia zdroja.');sourceIds.add(s.id);}
 for(const item of input.items){if(!item.id||ids.has(item.id)||!sourceIds.has(item.source_id)||typeof item.title!=='string'||!item.provenance||!Array.isArray(item.links)||!Array.isArray(item.related_ids)||!item.fields||!Array.isArray(item.conflicts))throw Error('Neplatná položka / provenance.');ids.add(item.id);}
 return structuredClone(input);
}
export const priorityRank=item=>({P0:0,P1:1,P2:2,P3:3}[item.fields.priority]??99);
export function views(data){
 const items=data?.items||[],now=items.filter(i=>i.kind==='task').sort((a,b)=>priorityRank(a)-priorityRank(b)||a.title.localeCompare(b.title,'sk'));
 const campaigns=items.filter(i=>i.kind==='campaign'),outputs=items.filter(i=>i.kind==='output'&&/FACEBOOK/i.test(i.fields.channel||''));
 const linked=new Set([...now,...campaigns.filter(i=>['PREPARING','RUNNING'].includes(i.fields.lifecycle))].flatMap(i=>i.related_ids));
 return {now,next:now,campaigns,outputs,offers:items.filter(i=>['service','product'].includes(i.kind)),relevantOffers:items.filter(i=>['service','product'].includes(i.kind)&&linked.has(i.id)),direction:items.filter(i=>i.kind==='direction'),ideas:items.filter(i=>i.kind==='idea'||(i.kind==='service'&&['IDEA','PROPOSED'].includes(i.fields.lifecycle))),activeServices:items.filter(i=>i.kind==='service'&&i.fields.lifecycle==='ACTIVE'),serviceIdeas:items.filter(i=>i.kind==='service'&&['IDEA','PROPOSED'].includes(i.fields.lifecycle)),preparingServices:items.filter(i=>i.kind==='service'&&['PREPARING','PILOT'].includes(i.fields.lifecycle)),otherServices:items.filter(i=>i.kind==='service'&&!['ACTIVE','IDEA','PROPOSED','PREPARING','PILOT'].includes(i.fields.lifecycle)),decisions:items.filter(i=>i.kind==='decision').sort((a,b)=>Number(b.fields.blocking===true)-Number(a.fields.blocking===true)),changes:items.filter(i=>i.kind==='change')};
}
export class DashboardState{
 constructor(){this.data=null;this.error='';this.demo=false;this.epoch=0;}
 accept(raw,epoch=this.epoch){if(epoch!==this.epoch)return false;this.data=validateProjection(raw);this.error='';return true;}
 fail(message){this.error=message;}
 clear(){this.epoch++;this.data=null;this.error='';this.demo=false;}
}

export function metrics(data){
 const v=views(data), stages=new Map();for(const i of v.ideas){const stage=i.fields.evidence_status||i.fields.lifecycle||'TBD';stages.set(stage,(stages.get(stage)||0)+1);}
 return {ideas:v.ideas.length,tasks:v.now.length,campaigns:v.campaigns.length,outputs:v.outputs.length,conflicts:(data?.items||[]).filter(i=>i.conflicts.length).length,stages:[...stages].sort(([a],[b])=>a.localeCompare(b)),partial:(data?.sources||[]).some(s=>s.status!=='ok')};
}
