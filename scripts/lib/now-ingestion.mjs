// Read-only projection of the canonical NOW table. Never infer category from task title.
import {createHash} from 'node:crypto';
const clean=v=>String(v??'').replace(/[`*]/g,'').trim();
export function projectNow(source,text){
 const block=text.split(/^##\s+Operatívne úlohy\s*$/m)[1]?.split(/^##\s+/m)[0];
 if(!block)throw Error('Canonical NOW operational table missing');
 const rows=block.split('\n').filter(l=>l.trim().startsWith('|')).map(l=>l.trim().replace(/^\||\|$/g,'').split(/(?<!\\)\|/).map(clean)).filter(r=>!r.every(c=>/^[-: ]+$/.test(c)));
 const headers=rows.shift();if(!headers?.includes('Úloha')||!headers.includes('Status')||!headers.includes('Kategória'))throw Error('Current NOW category schema missing');
 return rows.map(r=>{const get=k=>r[headers.indexOf(k)]||'TBD',title=get('Úloha'),anchor='Operatívne úlohy / '+title;
 return {id:`derived:${source.id}:${createHash('sha256').update(anchor).digest('hex').slice(0,20)}`,kind:'task',title,source_id:source.id,fields:{category:get('Kategória'),priority:get('Priorita'),task_status:get('Status'),next_step:get('Termín / ďalší krok'),due:'TBD',owner:get('Vlastník'),added_at:get('Dátum pridania do zoznamu úloh')},related_ids:[...new Set(r.join(' ').match(/LF-(?:SVC|PROD|CAM|OUT|ASSET|PROP)-[A-Z0-9-]+/g)||[])],links:[],conflicts:[],provenance:{owner:source.title,anchor,identity:'derived_source_anchor — stable business ID MISSING'}};});
}
export function refreshNowSnapshot(input,source,text){
 const result=structuredClone(input),data=result.dashboard||result,oldIds=new Set(data.sources.filter(s=>s.role==='now').map(s=>s.id));
 const tasks=projectNow(source,text);data.items=data.items.filter(i=>i.kind!=='task'||!oldIds.has(i.source_id));data.items.push(...tasks);data.sources=data.sources.filter(s=>!oldIds.has(s.id));data.sources.push(source);
 // Other provider freshness and global snapshot generation date are preserved.
 return result;
}
