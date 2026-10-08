import {canonical,collectCF,collectAT,statusOf,unique,stats,importPassed} from './core.js';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem('lingcha.'+key))??fallback}catch{return fallback}};
const save=(key,value)=>{try{localStorage.setItem('lingcha.'+key,JSON.stringify(value))}catch{$('storageStatus').textContent='浏览器无法保存，请及时导出备份。'}};
let accounts=read('accounts',{cf:'',at:'',lg:''}),manual=read('manual',{}),data=null,page=1,descending=true,mode=location.hash==='#all'?'all':'daily';const size=30,busy=new Set();
for(const id of ['cf','at','lg'])$(id).value=accounts[id]||'';
const cacheKey=(id,handle=accounts[id])=>'cache.'+id+'.'+handle.toLowerCase();
const caches=()=>['cf','at','lg'].map(id=>accounts[id]?read(cacheKey(id),{}).statuses||{}:{});
const state=p=>statusOf(p,caches(),manual);
function refreshCacheLabels(){for(const id of ['cf','at','lg']){const c=read(cacheKey(id),{});if(c.at)$(id+'Status').textContent=`${accounts[id]} · ${Object.values(c.statuses||{}).filter(v=>v==='solved').length} 道已通过 · ${new Date(c.at).toLocaleString('zh-CN')}`;}}
refreshCacheLabels();
function render(){
 if(!data)return;
 const profiles=caches(),get=p=>statusOf(p,profiles,manual),all=unique(data.problems),total=stats(all,profiles,manual);
 $('total').textContent=`${total.solved} / ${total.total}`;$('progress').max=total.total||1;$('progress').value=total.solved;
 for(const [platform,id] of [['cf','cfTotal'],['atcoder','atTotal'],['luogu','lgTotal']]){const s=stats(all.filter(p=>p.platform===platform),profiles,manual);$(id).textContent=`${s.solved} / ${s.total}`;}
 const query=$('query').value.trim().toLowerCase(),key=canonical(query),difficulty=$('difficulty').value.trim().toLowerCase();
 let matched=data.problems.filter(p=>(!query||(key?p.key===key:[p.id,p.key,p.tags].join(' ').toLowerCase().includes(query)))&&($('platform').value==='all'||p.platform===$('platform').value)&&($('completion').value==='all'||get(p)===$('completion').value)&&(!$('start').value||p.date>=$('start').value)&&(!$('end').value||p.date<=$('end').value)&&(!difficulty||[p.difficulty,p.tags].join(' ').toLowerCase().includes(difficulty)));
 if($('start').value&&$('end').value&&$('start').value>$('end').value){$('summary').textContent='起始日期不能晚于结束日期';$('rows').innerHTML='';return;}
 matched.sort((a,b)=>(descending?-1:1)*a.date.localeCompare(b.date)||a.key.localeCompare(b.key));
 const days=new Map();for(const p of matched){if(!days.has(p.date))days.set(p.date,[]);days.get(p.date).push(p);}
 const units=mode==='daily'?[...days]:unique(matched),pages=Math.max(1,Math.ceil(units.length/size));page=Math.max(1,Math.min(page,pages));
 const filtered=stats(matched,profiles,manual);$('summary').textContent=`${days.size} 天 · ${filtered.appearances} 条每日记录 · ${filtered.total} 道题 · 已完成 ${filtered.solved} 道`;
 const problem=p=>{const s=get(p),dates=mode==='all'?[...new Set(data.problems.filter(v=>v.key===p.key).map(v=>v.date))]:[];return `<div class="problem ${s}"><div><a class="problemtitle" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.id)} ↗</a><div class="badges"><span class="badge">${{cf:'Codeforces',atcoder:'AtCoder',luogu:'洛谷'}[p.platform]}</span><span class="badge">${esc(p.difficulty||'未标难度')}</span><span class="status">${s==='solved'?(manual[p.key]?'✓ 已完成 · 手动补记':'✓ 已完成 · 通过记录'):s==='attempted'?'尝试过 · 未确认通过':'未确认'}</span><a class="status" href="${esc(p.source)}" target="_blank" rel="noopener">原表 / 题解 ↗</a></div>${$('showTags').checked?`<div class="tags">${esc(p.tags)}</div>`:''}${dates.length?`<div class="tags">${dates.map(d=>`<button class="light" data-date="${d}" data-query="${esc(p.id)}">${d}</button>`).join(' ')}</div>`:''}</div><button class="light" data-mark="${esc(p.key)}" ${s==='solved'&&!manual[p.key]?'disabled':''}>${manual[p.key]?'撤销补记':s==='solved'?'已同步 AC':'标记已完成'}</button></div>`;};
 $('rows').innerHTML=units.slice((page-1)*size,page*size).map(unit=>{if(mode==='all')return `<article class="day">${problem(unit)}</article>`;const [day,ps]=unit,original=data.problems.filter(p=>p.date===day),done=original.filter(p=>get(p)==='solved').length;return `<article class="day ${done===original.length?'complete':''}"><div class="dayhead"><strong>${day}</strong><span>${done} / ${original.length} 已完成</span></div>${ps.map(problem).join('')}</article>`;}).join('')||'<p class="empty">没有匹配的题目。</p>';
 $('page').textContent=`${page} / ${pages}`;$('prev').disabled=page===1;$('next').disabled=page===pages;
 for(const id of ['daily','all']){$(id).classList.toggle('active',mode===id);$(id).setAttribute('aria-pressed',mode===id);}
}
for(const id of ['query','platform','completion','start','end','difficulty','showTags'])$(id).oninput=()=>{page=1;render()};
for(const id of ['daily','all'])$(id).onclick=()=>{mode=id;page=1;history.replaceState(null,'','#'+id);render()};
window.onhashchange=()=>{mode=location.hash==='#all'?'all':'daily';page=1;render()};
$('sort').onclick=()=>{descending=!descending;$('sort').textContent='日期 '+(descending?'↓':'↑');page=1;render()};$('prev').onclick=()=>{page--;render()};$('next').onclick=()=>{page++;render()};
$('reset').onclick=()=>{for(const id of ['query','start','end','difficulty'])$(id).value='';for(const id of ['platform','completion'])$(id).value='all';page=1;render()};
$('rows').onclick=e=>{const mark=e.target.closest('[data-mark]');if(mark){if(manual[mark.dataset.mark])delete manual[mark.dataset.mark];else manual[mark.dataset.mark]=true;save('manual',manual);render();}const date=e.target.closest('[data-date]');if(date){mode='daily';$('query').value=date.dataset.query;$('start').value=$('end').value=date.dataset.date;page=1;render()}};
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function request(url){let error;for(let i=0;i<3;i++){try{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);let response;try{response=await fetch(url,{signal:controller.signal})}finally{clearTimeout(timer)}if(!response.ok)throw Error('接口 HTTP '+response.status);return await response.json()}catch(e){error=e;if(i<2)await delay(3000*(i+1));}}throw error;}
async function sync(id){
 if(busy.has(id))return;const handle=$(id).value.trim();if(!/^[a-zA-Z0-9_.-]{1,64}$/.test(handle)){$(id+'Status').textContent='请填写有效用户名';return;}
 accounts[id]=handle;save('accounts',accounts);render();busy.add(id);$(id).disabled=true;const button=$(id+'Form').querySelector('button');button.disabled=true;
 const old=read(cacheKey(id,handle),{}),statuses={...(old.statuses||{})};let cursor=id==='at'?(old.cursor||0):1,count=0;
 const checkpoint=()=>{save(cacheKey(id,handle),{statuses,cursor:id==='at'?cursor:undefined,at:Date.now()});render()};
 try{
  while(true){
   $(id+'Status').textContent=`${handle} · 已读取 ${count} 条提交，正在同步…`;
   if(id==='cf'){
    const result=await request(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=${cursor}&count=1000`);
    if(result.status!=='OK'||!Array.isArray(result.result))throw Error(result.comment||'提交接口格式异常');collectCF(result.result,statuses);count+=result.result.length;checkpoint();if(result.result.length<1000)break;cursor+=1000;
   }else{
    const result=await request(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${encodeURIComponent(handle)}&from_second=${cursor}`);
    if(!Array.isArray(result)||result.some(s=>!Number.isFinite(s.epoch_second)))throw Error('AtCoder Problems 接口格式异常');collectAT(result,statuses);count+=result.length;
    if(!result.length){checkpoint();break;}
    const latest=Math.max(...result.map(s=>s.epoch_second));if(latest<cursor)throw Error('分页游标未前进');
    // Overlap the last second: safe across page boundaries and re-syncs.
    if(latest===cursor){if(result.length>=500)throw Error('同一秒提交过多，已保留记录，请稍后重试');checkpoint();break;}
    cursor=latest;checkpoint();
   }
   await delay(id==='cf'?2200:1200);
  }
  $(id+'Status').textContent=`${handle} · ${Object.values(statuses).filter(v=>v==='solved').length} 道通过 · 同步完成`;
 }catch(e){$(id+'Status').textContent=`同步未完成：${e.message}。已保留缓存和已获取记录，可重试。`;}finally{busy.delete(id);$(id).disabled=false;button.disabled=false;}
}
$('cfForm').onsubmit=e=>{e.preventDefault();sync('cf')};$('atForm').onsubmit=e=>{e.preventDefault();sync('at')};
$('lg').onchange=()=>{const uid=$('lg').value.trim();if(uid&&!/^\d+$/.test(uid)){$('lgStatus').textContent='UID 应为数字';return;}accounts.lg=uid;save('accounts',accounts);$('lgStatus').textContent='可导入当前账号的已通过题号';refreshCacheLabels();render()};
$('clearAccounts').onclick=()=>{if(busy.size){$('storageStatus').textContent='请等待正在进行的同步结束';return;}accounts={cf:'',at:'',lg:''};save('accounts',accounts);for(const id of ['cf','at','lg']){$(id).value='';$(id+'Status').textContent='已解除绑定，保留账号缓存。';}render()};
$('openImport').onclick=()=>{if(!/^\d+$/.test($('lg').value.trim())){$('lgStatus').textContent='请先填写洛谷数字 UID';return;}$('lg').dispatchEvent(new Event('change'));$('practiceLink').href=`https://www.luogu.com.cn/user/${accounts.lg}/practice`;$('importDialog').showModal()};
$('closeImport').onclick=()=>$('importDialog').close();$('importPassed').onclick=()=>{try{const keys=importPassed($('passed').value),old=read(cacheKey('lg'),{}),statuses={...(old.statuses||{})};for(const key of keys)statuses[key]='solved';save(cacheKey('lg'),{statuses,at:Date.now(),source:'user-import'});$('importStatus').textContent=`已合并 ${keys.length} 道通过题目；已有记录保留。`;refreshCacheLabels();render();}catch(e){$('importStatus').textContent=e.message}};
$('export').onclick=()=>{const records={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('lingcha.'))records[k.slice(8)]=read(k.slice(8),null);}const blob=new Blob([JSON.stringify({version:1,records},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='lingcha-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$('restore').onchange=async()=>{if(busy.size){$('storageStatus').textContent='同步进行中，请稍后恢复';return;}try{const file=$('restore').files[0];if(!file)return;if(file.size>10*1024*1024)throw Error('文件过大');const backup=JSON.parse(await file.text());if(backup.version!==1||!backup.records||typeof backup.records!=='object')throw Error('不是本站的进度备份');const validated=[];for(const [k,v] of Object.entries(backup.records)){if(k==='manual'){if(!v||typeof v!=='object'||Object.entries(v).some(([key,value])=>!canonical(key)||value!==true))throw Error('手动记录格式异常');validated.push([k,{...read(k,{}),...v}]);}else if(k.startsWith('cache.')&&/^cache\.(cf|at|lg)\.[\w.-]+$/.test(k)){if(!v?.statuses||typeof v.statuses!=='object'||Object.entries(v.statuses).some(([key,value])=>!canonical(key)||!['solved','attempted'].includes(value)))throw Error('缓存格式异常');const old=read(k,{}),statuses={...(old.statuses||{})};for(const [key,value] of Object.entries(v.statuses))if(statuses[key]!=='solved')statuses[key]=value;validated.push([k,{...v,statuses,cursor:0}]);}else if(k==='accounts'){if(!v||['cf','at','lg'].some(id=>typeof v[id]!=='string'||!/^([\w.-]{1,64})?$/.test(v[id])))throw Error('账号格式异常');validated.push([k,v]);}else throw Error('未知备份字段');}for(const [k,v] of validated)save(k,v);accounts=read('accounts',accounts);manual=read('manual',manual);for(const id of ['cf','at','lg'])$(id).value=accounts[id];refreshCacheLabels();render();$('storageStatus').textContent='备份已恢复，完成记录已合并。';}catch(e){$('storageStatus').textContent='恢复失败：'+e.message}};
$('notifications').onclick=()=>$('historyDialog').showModal();$('closeHistory').onclick=()=>$('historyDialog').close();
try{const response=await fetch('./data/problems.json');if(!response.ok)throw Error('题库 HTTP '+response.status);data=await response.json();$('updated').textContent=`最近同步 ${new Date(data.generatedAt).toLocaleString('zh-CN')} · 原表版本 ${data.revision}`;$('coverage').textContent=`收录 ${data.problems.at(-1)?.date} 至 ${data.problems[0]?.date}；另有 ${data.skipped.length} 个日期无可识别题目链接，未计入题目统计。`;$('notificationCount').textContent=data.pending.length;$('historyChanges').innerHTML=data.pending.length?data.pending.map(c=>`<article class="historycard"><strong>${c.date}</strong><p>差异 ID：<code>${esc(c.id)}</code></p><pre>${esc(JSON.stringify({当前:c.before,上游:c.after},null,2))}</pre><a href="https://github.com/Code92007/lingcha-daily/actions/workflows/pages.yml" target="_blank" rel="noopener">打开更新工作流 ↗</a></article>`).join(''):'<p>暂无待确认历史变更。</p>';render();}catch(e){$('summary').textContent='题库加载失败：'+e.message;$('summary').classList.add('error')}
