export const AREAS = ['GitHub', 'Google Drive', 'Google Sheets', 'Agenti'];
export const OPERATIONS = ['read', 'write', 'transfer', 'sync'];
export const STATUSES = ['started', 'completed', 'failed'];
export const safeUrl = value => { try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password ? u.href : null; } catch { return null; } };
const typeFor = n => n.type || (n.mime?.includes('folder') ? 'Priečinok' : n.mime?.includes('spreadsheet') ? 'Register' : 'Dokument');
export function normalizeGraph(input) {
  if (!input || !Array.isArray(input.nodes) || !Array.isArray(input.edges)) throw new Error('Graf musí obsahovať nodes a edges.');
  if (input.nodes.length > 30000 || input.edges.length > 150000) throw new Error('Graf prekračuje povolený rozsah.');
  const seen = new Map(), edges = [], edgeSeen = new Set();
  for (const raw of input.nodes) {
    if (typeof raw.id !== 'string' || !raw.id || typeof raw.name !== 'string') throw new Error('Uzol musí mať stabilné id a name.');
    const id = raw.id;
    let area = raw.area || raw.source;
    if (id.startsWith('actor:') || raw.type === 'Agent') area = 'Agenti';
    else if (id.startsWith('github:')) area = 'GitHub';
    else if ((raw.mime || raw.mime_type || '').includes('spreadsheet') || (id.startsWith('drive:') && raw.type === 'Register')) area = 'Google Sheets';
    else if (id.startsWith('drive:')) area = 'Google Drive';
    else if (id.startsWith('local:')) area = 'Lokálne';
    else if (!AREAS.includes(area)) area = 'Prepojené zdroje';
    const node = {...raw, id, area, source: area, type: typeFor(raw), history: Boolean(raw.history || raw.archived), coverage: raw.coverage || (!raw.verified ? 'unverified' : raw.metadataOnly ? 'metadata' : 'content')};
    if (seen.has(id)) {
      const prior = seen.get(id);
      if (prior.name !== node.name || (prior.url && node.url && prior.url !== node.url)) throw new Error('Konfliktná duplicita ID: ' + id);
      continue;
    }
    seen.set(id, node);
  }
  for (const raw of input.edges) {
    if (!seen.has(raw.source) || !seen.has(raw.target)) throw new Error('Väzba má chýbajúci uzol: ' + raw.source + ' → ' + raw.target);
    const kind = raw.kind || ({'obsahuje':'containment','odkazuje na':'link'}[raw.relation] || 'derived');
    if (!['containment','link','transfer','sync','derived'].includes(kind)) throw new Error('Neznámy typ väzby.');
    const evidence = Array.isArray(raw.evidence) ? raw.evidence : raw.evidence ? [raw.evidence] : [];
    if (['transfer','sync'].includes(kind) && !evidence.length) throw new Error('Prenos/sync potrebuje dôkaz.');
    const key = raw.id || [raw.source,raw.target,kind].join('|');
    if (edgeSeen.has(key)) continue;
    edgeSeen.add(key); edges.push({...raw,id:key,kind,evidence});
  }
  return {...input, schema_version: 1, nodes:[...seen.values()], edges};
}
export function validateEvent(event) {
  for (const k of ['event_id','operation_id','timestamp','actor_id','operation','status','source_id','target_id']) if (typeof event?.[k] !== 'string' || !event[k] || event[k].length > 2048) throw new Error('Neplatné pole udalosti: ' + k);
  if (!OPERATIONS.includes(event.operation) || !STATUSES.includes(event.status) || !Number.isFinite(Date.parse(event.timestamp))) throw new Error('Neplatná operácia, stav alebo timestamp.');
  if (!Object.hasOwn(event,'evidence') || !Object.hasOwn(event,'error')) throw new Error('Udalosť potrebuje evidence a error.');
  if (event.operation === 'read' && event.target_id !== event.actor_id) throw new Error('Čítanie musí smerovať súbor → agent.');
  if (event.operation === 'write' && event.source_id !== event.actor_id) throw new Error('Zápis musí smerovať agent → súbor.');
  if (['transfer','sync'].includes(event.operation) && !event.evidence) throw new Error('Prenos/sync musí mať dôkaz.');
  if (event.status === 'failed' && !event.error) throw new Error('Chyba musí obsahovať vysvetlenie.');
  if (event.readback_verified && (event.operation !== 'write' || event.status !== 'completed' || !event.readback_evidence)) throw new Error('Overený zápis potrebuje samostatný readback dôkaz.');
  if (event.observation === 'sync_detected' && event.operation !== 'sync') throw new Error('Zistená zmena nie je sledovaný zápis.');
  return event;
}
export class ActivityStore {
  constructor(limit=1000) { this.limit=limit; this.history=[]; this.active=new Map(); this.seen=new Set(); this.terminal=new Set(); }
  add(raw) {
    const e=validateEvent(raw); if(this.seen.has(e.event_id)) return false;
    this.seen.add(e.event_id);this.history.unshift(e);
    if(this.history.length>this.limit){const gone=this.history.pop();this.seen.delete(gone.event_id);}
    if(e.status==='started'){if(!this.terminal.has(e.operation_id))this.active.set(e.operation_id,e);}else {this.active.delete(e.operation_id);this.terminal.add(e.operation_id);}
    return true;
  }
}
export function mergeInventory(previous, next) {
  const old=normalizeGraph(previous), fresh=normalizeGraph(next), seen=new Set(fresh.nodes.map(n=>n.id));
  const retained=old.nodes.filter(n=>!seen.has(n.id)).map(n=>({...n,availability:'not_seen',access_error:'Zdroj sa pri obnove neobjavil; zmazanie ani strata prístupu nepotvrdené.',last_success_at:n.last_success_at || old.updated_at || null}));
  const nodes=[...fresh.nodes,...retained], all=new Set(nodes.map(n=>n.id)), keys=new Set(fresh.edges.map(e=>e.id));
  const edges=[...fresh.edges,...old.edges.filter(e=>!keys.has(e.id)&&all.has(e.source)&&all.has(e.target)).map(e=>({...e,stale:true}))];
  return normalizeGraph({...fresh,nodes,edges});
}

export const searchText=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[_\-/.:]+/g,' ').replace(/\s+/g,' ').trim();
export const matchesSearch=(node,query)=>{const haystack=searchText([node.name,node.id,node.path].join(' '));return searchText(query).split(' ').filter(Boolean).every(word=>haystack.includes(word));};
