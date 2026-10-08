import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('V2 live frontend uses only cookie-authenticated dashboard, never the deprecated report or direct Supabase',()=>{
 const app=fs.readFileSync(new URL('../web/app.mjs',import.meta.url),'utf8');
 assert.match(app,/fetch\(endpoint\+'\/api\/dashboard',\{credentials:'include'/);
 assert.doesNotMatch(app,/\/api\/report|SUPABASE_SERVICE_ROLE_KEY|supabase\.co\/rest/);
});
