import test from 'node:test';
import assert from 'node:assert/strict';
import {SECTIONS} from '../web/dashboard-model.mjs';
import {operationalViews,renderOperational,WORK} from '../web/operational.mjs';
const task=(id,status,priority)=>({id,kind:'task',title:'Úloha '+id,fields:{status,task_status:status,priority,owner:'TBD',category:'IT',next_step:'Skontrolovať'},related_ids:[]});
const data={items:[task('LF-TASK-023','COMPLETED','P1'),task('LF-TASK-024','NOT_STARTED','P0'),{id:'LF-CAM-001',kind:'campaign',title:'Kampaň',fields:{status:'DRAFT'},related_ids:[]}]};
function render(query='',filter=''){
 const nodes=[];const make=(tag,text,parent)=>{const n={tag,text,children:[]};parent?.children.push(n);nodes.push(n);return n;};
 renderOperational({data,section:'tasks',parent:{children:[]},make,action:(text,fn,parent)=>make('button',text,parent),detail:()=>{},statusBadge:(text,parent)=>make('span',text,parent),tableShell:()=>({box:{children:[]},body:{children:[]}}),query,filter});
 return nodes;
}
test('tasks tab follows overview and contains canonical tasks including completed, without derived campaign work',()=>{
 assert.deepEqual(SECTIONS.slice(0,3),[['overview','Prehľad'],['tasks','Úlohy'],['calendar','Kalendár']]);
 const v=operationalViews(data);assert.equal(v.tasks.length,2);assert.equal(v.now.length,3);assert.equal(v.tasks[0].id,'LF-TASK-024');
 const nodes=render();assert.equal(nodes.filter(n=>n.tag==='tr' && n.children.some(c=>c.tag==='td' && c.children.some(v=>v.tag==='span'||v.tag==='button'))).length,2);assert.ok(nodes.some(n=>n.text==='Dokončené'));assert.ok(nodes.some(n=>n.text==='LF-TASK-023'));assert.ok(!nodes.some(n=>n.text==='LF-CAM-001'));
});
test('search and status filters retain completed tasks and display accurate filtered counts',()=>{
 let nodes=render('LF-TASK-023','COMPLETED');assert.equal(nodes.filter(n=>n.tag==='tr' && n.children.some(c=>c.tag==='td' && c.children.some(v=>v.tag==='span'||v.tag==='button'))).length,1);
 nodes=render('missing');assert.equal(nodes.filter(n=>n.tag==='tr' && n.children.some(c=>c.tag==='td' && c.children.some(v=>v.tag==='span'||v.tag==='button'))).length,0);
});

import {filterTaskTable} from '../web/operational.mjs';
import {statusTone} from '../web/reporting.mjs';
test('task colors and combined column filters with reversible numeric sorting',()=>{
 assert.equal(statusTone('Dokončené'),'success');assert.equal(statusTone('Prebieha'),'info');
 const cols=[['ID',i=>i.id],['Stav',i=>WORK[i.fields.task_status]],['Priorita',i=>i.fields.priority]];
 const items=[task('LF-TASK-2','IN_PROGRESS','P0'),task('LF-TASK-10','IN_PROGRESS','P1'),task('LF-TASK-1','COMPLETED','P0')];
 let selected=filterTaskTable(items,cols,{filters:{Stav:'prebieha',Priorita:'P0'},sort:'ID',direction:1});assert.deepEqual(selected.map(i=>i.id),['LF-TASK-2']);
 selected=filterTaskTable(items,cols,{filters:{},sort:'ID',direction:-1});assert.deepEqual(selected.map(i=>i.id),['LF-TASK-10','LF-TASK-2','LF-TASK-1']);
});

import {compareCells,enhanceTable} from '../web/reporting.mjs';
test('status order follows workflow across raw and translated values, dates are chronological',()=>{
 const values=['Zrušené','Dokončené','Blokované','Prebieha','V príprave','Nezačaté'];
 assert.deepEqual(values.sort((a,b)=>compareCells(a,b,'Stav')),['Nezačaté','V príprave','Prebieha','Blokované','Dokončené','Zrušené']);
 assert.equal(statusTone('COMPLETED'),statusTone('Dokončené'));assert.equal(statusTone('PUBLISHED'),'info');assert.equal(statusTone('DRAFT'),'neutral');
 assert.ok(compareCells('31-01-2026','01-02-2026','Termín')<0);assert.ok(compareCells('TBD','01-02-2026','Termín',-1)>0);
});
test('shared table controls combine filters, sort rows and restore original order',async()=>{
 const make=(tag,text,parent)=>{const n={tag,value:'',hidden:false,style:{},children:[],textContent:text||'',attrs:{},setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},append(child){const i=this.children.indexOf(child);if(i>=0)this.children.splice(i,1);this.children.push(child);}};parent?.append(n);return n;};
 const box=make('section'),table=make('table'),head=make('thead'),body=make('tbody');table.setAttribute('aria-label','Test');const actions=[];
 enhanceTable({table,head,body,columns:['Názov','Stav'],box,make,action:(text,fn,parent)=>{const n=make('button',text,parent);n.onclick=fn;actions.push(n);return n;}});
 for(const [name,status]of [['A','Dokončené'],['B','Nezačaté'],['C','Prebieha']]){const row=make('tr',null,body);make('td',name,row);make('td',status,row);}await Promise.resolve();
 actions[1].onclick();assert.deepEqual(body.children.map(r=>r.children[1].textContent),['Nezačaté','Prebieha','Dokončené']);
 const inputs=head.children[1].children.map(c=>c.children[0]);inputs[1].value='prebieha';inputs[1].oninput();assert.equal(body.children.filter(r=>!r.hidden).length,1);inputs[0].value='A';inputs[0].oninput();assert.equal(body.children.filter(r=>!r.hidden).length,0);
 actions[2].onclick();assert.deepEqual(body.children.map(r=>r.children[0].textContent),['A','B','C']);assert.ok(body.children.every(r=>!r.hidden));
});
