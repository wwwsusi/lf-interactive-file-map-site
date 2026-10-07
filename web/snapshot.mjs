import {normalizeGraph} from './model.mjs';
import {validateProjection,dateValue} from './dashboard-model.mjs';
// Explicit user import only. A file inventory is never converted into business facts.
export function parseSnapshot(raw){
 if(!raw||typeof raw!=='object')throw Error('Neplatný snapshot.');
 if(raw.format==='lf-operating-snapshot'){
  if(raw.version!==1)throw Error('Nepodporovaná verzia snapshotu.');
  const graph=raw.graph?normalizeGraph(raw.graph):null,dashboard=raw.dashboard?validateProjection(raw.dashboard):null;
  if(!graph&&!dashboard)throw Error('Snapshot neobsahuje graf ani dashboard.');
  return {graph,dashboard};
 }
 if(Array.isArray(raw.sources)&&Array.isArray(raw.items))return {graph:null,dashboard:validateProjection(raw)};
 return {graph:normalizeGraph(raw),dashboard:null};
}
export function snapshotAge(value,now=Date.now()){
 const date=dateValue(value);if(date===null)return 'čas zdrojových dát nie je známy';
 if(date>now+60000)return 'čas je v budúcnosti · UNCERTAIN';
 const age=Math.max(0,now-date),minutes=Math.floor(age/60000);
 return minutes<1?'menej než minútu':minutes<60?`${minutes} min`:minutes<1440?`${Math.floor(minutes/60)} h`:`${Math.floor(minutes/1440)} d`;
}
