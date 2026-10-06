import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import '../scripts/build.mjs';
test('Public artifact contains no inventory; build ignores an injected graph',()=>{
 const root=path.resolve(import.meta.dirname,'..'),data=JSON.parse(fs.readFileSync(path.join(root,'dist/data/graph.json')));
 assert.equal(data.nodes.length,0);assert.equal(data.edges.length,0);
 assert.deepEqual(fs.readdirSync(path.join(root,'dist')).sort(),['.nojekyll','README.html','app.mjs','config.json','data','index.html','model.mjs','style.css'].sort());
 for(const name of ['data-private','private-data','.runtime','reference','server','sources'])assert.equal(fs.existsSync(path.join(root,'dist',name)),false);
});
