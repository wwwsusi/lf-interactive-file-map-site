// Browser QA only: synthetic DTO; no live business data, server credentials or deployment.
import {chromium} from '@playwright/test';
import {fixture,item} from '../tests/fixtures/ux-v2.mjs';
import {pragueToday,addDays} from '../web/ux-model.mjs';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../dist'),out=path.resolve(import.meta.dirname,'../qa-artifacts');
await fs.mkdir(out,{recursive:true});
const types={'.mjs':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.woff':'font/woff'};
const server=http.createServer(async(req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname,file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep))throw Error('path');const bytes=await fs.readFile(file);res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(bytes);}catch{res.statusCode=404;res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
const assert=(value,message)=>{if(!value)throw Error(message);};
const data=fixture(),today=pragueToday();data.generated_at=new Date().toISOString();data.backend_read_at=data.generated_at;
data.items.find(i=>i.id==='t1').fields.due_date=today;data.items.find(i=>i.id==='t2').fields.due_date=addDays(today,5);data.items.find(i=>i.id==='t3').fields.due_date=addDays(today,-1);data.items.find(i=>i.id==='c1').fields.launch_date=today;
for(let index=0;index<18;index++)data.items.push(item('many-'+index,'campaign',{status:'PUBLISHED',launch_date:today,owner:index%2?'Synthetic owner':null,next_step:'Synthetic next step'}));
for(let index=0;index<4;index++)data.items.push(item('due-extra-'+index,'task',{task_status:'IN_PROGRESS',category:'STAFF',due_date:today}));
const browser=await chromium.launch();const errors=[],results=[];let calls=0,logout=0,failed=false,authorized=true;
async function setup(viewport,storageMode=null){
 const context=await browser.newContext({viewport});
 if(storageMode==='blocked')await context.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('Synthetic unavailable storage');}});});
 else if(storageMode==='corrupt')await context.addInitScript(()=>localStorage.setItem('lf-control-center:ux-v2:columns:offers','{oops'));
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/config.json',route=>route.fulfill({json:{connectionMode:'same-origin',eventServiceUrl:'',scope:'Synthetic browser QA'}}));
 await page.route('**/api/**',async route=>{const url=new URL(route.request().url());if(url.pathname==='/api/dashboard'){calls++;assert(!route.request().headers().authorization,'No browser bearer for dashboard');await route.fulfill({status:authorized?(failed?502:200):401,json:authorized&&!failed?data:{error:'Synthetic failure'}});}else if(url.pathname==='/api/logout'){assert(route.request().method()==='POST','Logout server POST');logout++;authorized=false;await route.fulfill({json:{ok:true}});}else await route.fulfill({json:{nodes:[],edges:[],ok:true}});});
 await page.goto(base);await page.waitForFunction(()=>window.lfDashboardDiagnostics?.().mode==='LIVE SUPABASE');
 return {context,page};
}
const nav=async(page,label)=>{await page.locator('#dashboard-nav').getByRole('button',{name:label,exact:true}).click();};
const noOverflow=async(page)=>{const sizes=await page.evaluate(()=>({width:innerWidth,body:document.documentElement.scrollWidth}));assert(sizes.body<=sizes.width+1,'Unwanted layout overflow '+JSON.stringify(sizes));const overlaps=await page.locator('header button:not([hidden])').evaluateAll(nodes=>{const boxes=nodes.map(n=>n.getBoundingClientRect());return boxes.some((a,i)=>boxes.some((b,j)=>j>i&&Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1));});assert(!overlaps,'Header controls overlap');};
try{
 const {context,page}=await setup({width:1440,height:1000});
 for(const [name,viewport]of [['desktop',{width:1440,height:1000}],['tablet-landscape',{width:1180,height:820}],['tablet-portrait',{width:820,height:1180}],['narrow',{width:390,height:844}]]){
  await page.setViewportSize(viewport);
  for(const theme of ['dark','light']){
   const current=await page.locator('html').getAttribute('data-theme');if(current!==theme)await page.locator('#theme-toggle').click();
   for(const view of ['Prehľad','Úlohy','Kalendár','Služby','Produkty','Kampane']){
    await nav(page,view);await noOverflow(page);
    if(view==='Kalendár'){assert(await page.locator('.ux-calendar td').count()===42,'Calendar grid cells');assert(await page.locator('.ux-today').count()===1,'Today highlight');}
    if(name==='desktop'&&view==='Prehľad'){const count=await page.locator('.ux-summary-row').first().evaluate(n=>getComputedStyle(n).gridTemplateColumns.split(' ').length);assert(count===3,'Desktop summary 3 columns');}
    await page.screenshot({path:path.join(out,name+'-'+theme+'-'+view+'.png'),fullPage:true});
   }
  }
  results.push(name+' light/dark: navigation, no page overflow, header controls and calendar PASS');
 }
 await page.setViewportSize({width:1440,height:1000});await nav(page,'Úlohy');
 const long=page.locator('.ux-long-text').first();await long.locator('summary').focus();await page.keyboard.press('Enter');assert(await long.getAttribute('open')!==null,'Keyboard expands next step');assert((await long.locator('p').innerText()).length===200,'Full next_step preserved');await page.keyboard.press('Enter');assert(await long.getAttribute('open')===null,'Keyboard collapses next step');
 await nav(page,'Kalendár');const heading=await page.locator('.ux-calendar-toolbar h4').innerText();await page.getByRole('button',{name:'Nasledujúci mesiac →'}).click();assert(await page.locator('.ux-calendar-toolbar h4').innerText()!==heading,'Month changes');await page.getByRole('button',{name:'Dnes',exact:true}).click();const more=page.locator('.ux-calendar-more').first();await more.locator('summary').click();await more.getByRole('button').first().click();assert(await page.locator('#dashboard-detail').isVisible(),'Calendar detail reuse');await page.locator('#dashboard-detail').getByRole('button',{name:'Zavrieť',exact:true}).click();
 await nav(page,'Služby');await page.locator('.ux-column-selector summary').click();const owner=page.getByRole('checkbox',{name:'Zobraziť Owner',exact:true});await owner.uncheck();await page.getByRole('button',{name:'Posunúť doľava · Cena',exact:true}).click();await page.reload();await page.waitForFunction(()=>window.lfDashboardDiagnostics?.().mode==='LIVE SUPABASE');await nav(page,'Služby');const columns=await page.locator('#dashboard .report-table th').allTextContents();assert(!columns.includes('Owner'),'Hidden column persisted');assert(columns.indexOf('Cena')<columns.indexOf('Dostupnosť'),'Column order persisted');
 await nav(page,'Kampane');assert(await page.locator('.ux-campaign-kpis .ux-panel').count()===5,'Five campaign KPIs');assert((await page.locator('#dashboard').innerText()).includes('Žiadne kampane v tomto stave.'),'Empty campaign bucket');assert(await page.locator('.ux-campaign-list .ux-item').count()===20,'Many campaigns preserved');
 await nav(page,'Prehľad');assert((await page.locator('#dashboard').innerText()).includes('Synthetic t5'),'Unknown category not lost');const before=calls;await page.locator('#reload-data').click();await page.waitForTimeout(200);assert(calls===before+1,'Manual reload callback');failed=true;await page.locator('#reload-data').click();await page.waitForTimeout(200);assert((await page.locator('#dashboard').innerText()).includes('STALE / ERROR'),'Failed reload status');assert((await page.locator('#dashboard').innerText()).includes('Synthetic t1'),'Failed reload retains last data');failed=false;
 await page.locator('#disconnect').click();await page.waitForTimeout(200);assert(logout===1,'Server logout called once');assert(await page.locator('#reload-data').isDisabled(),'Disconnected reload state');assert(await page.locator('#connect').innerText()==='Connect to DB','Connect label');await context.close();
 authorized=true;
 for(const mode of ['corrupt','blocked']){const {page,context}=await setup({width:820,height:1180},mode);await nav(page,'Služby');assert((await page.locator('#dashboard .report-table th').allTextContents()).includes('Owner'),'Safe storage defaults');await noOverflow(page);await context.close();}
 assert(errors.length===0,'Browser errors: '+errors.join('; '));
 results.push('Keyboard disclosure, month navigation/detail, column persistence, unknown/NULL data, empty/many campaigns, failed reload, logout and storage fallbacks PASS');
 results.push('Chromium synthetic QA only. Safari direct QA NOT PERFORMED. Screenshots captured; human visual review remains owner review.');
 await fs.writeFile(path.join(out,'results.txt'),results.join('\n')+'\n');console.log(results.join('\n'));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
