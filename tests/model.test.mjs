import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeGraph,validateEvent,mergeInventory,ActivityStore,safeUrl} from '../web/model.mjs';
const graph={nodes:[{id:'drive:folder',name:'Root',type:'Priečinok'},{id:'drive:sheet',name:'Register',mime:'application/vnd.google-apps.spreadsheet'},{id:'github:repo:doc',name:'doc'},{id:'actor:adapter',name:'Adaptér'},{id:'https://example.org',name:'External'}],edges:[{source:'drive:folder',target:'drive:sheet',relation:'obsahuje',evidence:[{parent_id:'folder'}]}]};
const make=(operation,status,operation_id='op')=>({event_id:crypto.randomUUID(),operation_id,timestamp:new Date().toISOString(),actor_id:'actor:adapter',operation,status,source_id:operation==='write'?'actor:adapter':'github:repo:doc',target_id:operation==='read'?'actor:adapter':'drive:sheet',evidence:{adapter:'test'},error:status==='failed'?'Test failure':null});
test('Stable sheet IDs, Drive memberships and external provenance survive normalization',()=>{
 const g=normalizeGraph(graph);assert.equal(g.nodes[1].id,'drive:sheet');assert.equal(g.nodes[1].area,'Google Sheets');assert.equal(g.nodes[4].area,'Prepojené zdroje');assert.equal(g.edges[0].kind,'containment');assert.deepEqual(g.edges[0].evidence,[{parent_id:'folder'}]);
 assert.throws(()=>normalizeGraph({...graph,nodes:[...graph.nodes,{id:'drive:sheet',name:'Different identity'}]}),/duplicita/);
 assert.throws(()=>normalizeGraph({...graph,edges:[{source:'drive:folder',target:'drive:sheet',kind:'sync'}]}),/dôkaz/);
});
test('Missing items retained, old relations stale, successful load time preserved',()=>{
 const prior={...graph,updated_at:'2026-10-06T12:00:00Z'};const next=mergeInventory(prior,{nodes:[graph.nodes[0]],edges:[]});assert.equal(next.nodes.length,5);assert.equal(next.nodes[1].availability,'not_seen');assert.equal(next.nodes[1].last_success_at,prior.updated_at);assert.equal(next.edges[0].stale,true);
});
test('Concurrent directions, terminal state, duplicate replay and separate readback',()=>{
 const store=new ActivityStore();store.add(make('read','started','a'));store.add(make('write','started','b'));assert.equal(store.active.size,2);
 const done=make('read','completed','a');store.add(done);assert.equal(store.active.size,1);assert.equal(store.add(done),false);
 store.add(make('read','started','a'));assert.equal(store.active.size,1);
 store.add(make('write','failed','b'));assert.equal(store.active.size,0);
 assert.throws(()=>validateEvent({...make('read','started'),target_id:'drive:sheet'}),/smerovať/);
 assert.throws(()=>validateEvent({...make('write','completed'),readback_verified:true}),/readback/);
 validateEvent({...make('write','completed'),readback_verified:true,readback_evidence:{sha256:'proof'}});
 assert.equal(safeUrl('javascript:alert(1)'),null);assert.equal(safeUrl('https://user:secret@example.org'),null);
});
