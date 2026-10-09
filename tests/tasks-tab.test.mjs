import test from 'node:test';
import assert from 'node:assert/strict';
import {SECTIONS} from '../web/dashboard-model.mjs';
import {operationalViews,renderOperational} from '../web/operational.mjs';
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
 const nodes=render();assert.equal(nodes.filter(n=>n.tag==='tr').length,2);assert.ok(nodes.some(n=>n.text==='Dokončené'));assert.ok(nodes.some(n=>n.text==='LF-TASK-023'));assert.ok(!nodes.some(n=>n.text==='LF-CAM-001'));
});
test('search and status filters retain completed tasks and display accurate filtered counts',()=>{
 let nodes=render('LF-TASK-023','COMPLETED');assert.equal(nodes.filter(n=>n.tag==='tr').length,1);assert.ok(nodes.some(n=>n.text?.startsWith('Zobrazených 1 z 2')));
 nodes=render('missing');assert.equal(nodes.filter(n=>n.tag==='tr').length,0);assert.ok(nodes.some(n=>n.text?.startsWith('Zobrazených 0 z 2')));
});
