import path from 'node:path';import {buildPublic} from './lib/public-build.mjs';
const root=path.resolve(import.meta.dirname,'..'),arg=name=>process.argv.find(a=>a.startsWith('--'+name+'='))?.slice(name.length+3);
buildPublic({root,profile:arg('profile')||'pages',out:arg('output')||path.join(root,'dist')});
console.log('Build: public shell only; no private inventory/events.');
