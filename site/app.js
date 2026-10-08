import {platforms,canonical,collectCF,collectAT,statusOf,unique,stats,importPassed,topicProblems,solutionLink} from './core.js?v=2';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem('lingcha.'+key))??fallback}catch{return fallback}};
const save=(key,value)=>{try{localStorage.setItem('lingcha.'+key,JSON.stringify(value))}catch{$('storageStatus').textContent='浏览器无法保存，请及时导出备份。'}};
let accounts={...Object.fromEntries(Object.keys(platforms).map(id=>[id,''])),...read('accounts',{})},manual=read('manual',{}),data=null,page=1,descending=true,mode=location.hash.startsWith('#all')?'all':'daily',topic=readTopic();const size=30,busy=new Set();
function readTopic(){try{return decodeURIComponent(location.hash.split('/').slice(1).join('/'))}catch{return ''}}
const extras=['leetcode'];
$('otherAccounts').innerHTML=extras.map(id=>`<div><label for="${id}">${platforms[id]} 用户名 / UID</label><div class="inputrow"><input id="${id}" placeholder="绑定账号以区分进度" maxlength="64"><button type="button" data-import-platform="${id}">导入已通过题目</button></div><p id="${id}Status" class="muted" role="status">按账号保存导入的完整通过记录。</p></div>`).join('');
for(const id of Object.keys(platforms))$(id).value=accounts[id]||'';
for(const id of extras)$(id).oninput=$(id).onchange=()=>{const value=$(id).value.trim();if(value&&!/^[a-zA-Z0-9_.-]{1,64}$/.test(value)){$(id+'Status').textContent='请使用用户名或数字 UID';return;}accounts[id]=value;save('accounts',accounts);$(id+'Status').textContent='已切换账号，可导入该账号的通过记录。';refreshCacheLabels();render();};
$('otherAccounts').onclick=e=>{const button=e.target.closest('[data-import-platform]');if(button)openImportFor(button.dataset.importPlatform)};
const cacheKey=(id,handle=accounts[id])=>'cache.'+id+'.'+handle.toLowerCase();
const caches=()=>Object.keys(platforms).map(id=>accounts[id]?read(cacheKey(id),{}).statuses||{}:{});
function refreshCacheLabels(){for(const id of Object.keys(platforms)){const c=read(cacheKey(id),{});if(c.at)$(id+'Status').textContent=`${accounts[id]} · ${Object.values(c.statuses||{}).filter(v=>v==='solved').length} 道已通过 · ${new Date(c.at).toLocaleString('zh-CN')}`;}}
refreshCacheLabels();
function render(){
 if(!data)return;
 const profiles=caches(),get=p=>statusOf(p,profiles,manual),all=unique(data.problems),total=stats(all,profiles,manual);
 $('total').textContent=`${total.solved} / ${total.total}`;$('progress').max=total.total||1;$('progress').value=total.solved;
 for(const [platform,id] of [['cf','cfTotal'],['atcoder','atTotal'],['luogu','lgTotal']]){const s=stats(all.filter(p=>p.platform===platform),profiles,manual);$(id).textContent=`${s.solved} / ${s.total}`;}
 $('extraTotals').innerHTML=extras.map(id=>{const n=stats(all.filter(p=>p.platform===id),profiles,manual);return `<span>${platforms[id]} <strong>${n.solved} / ${n.total}</strong></span>`}).join('');
 const catalog=topicProblems(data.problems),byKey=new Map(catalog.map(p=>[p.key,p]));
 $('topics').hidden=mode!=='all';$('topicTitle').hidden=mode!=='all';
 const groups=new Map([['',catalog],['__untagged',catalog.filter(p=>!p.topics.length)]]);
 for(const p of catalog)for(const tag of p.topics){if(!groups.has(tag))groups.set(tag,[]);groups.get(tag).push(p);}
 const ordered=[...groups].sort((a,b)=>a[0]===''?-1:b[0]===''?1:a[0]==='__untagged'?1:b[0]==='__untagged'?-1:b[1].length-a[1].length||a[0].localeCompare(b[0],'zh-CN'));
 $('topicList').innerHTML=ordered.map(([tag,ps])=>{const s=stats(ps,profiles,manual);return `<button class="light ${topic===tag?'selected':''}" data-topic="${esc(tag)}" aria-pressed="${topic===tag}">${esc(tag===''?'全部题单':tag==='__untagged'?'待分类':tag)} <span>${s.solved} / ${s.total}</span></button>`}).join('');
 $('topicTitle').textContent=topic===''?'全部题单 · 去重题目':topic==='__untagged'?'待分类':topic+' · 题单';
 const query=$('query').value.trim().toLowerCase(),key=canonical(query),difficulty=$('difficulty').value.trim().toLowerCase();
 let matched=data.problems.filter(p=>(mode!=='all'||!topic||(topic==='__untagged'?!byKey.get(p.key).topics.length:byKey.get(p.key).topics.includes(topic)))&&(!query||(key?p.key===key:[p.id,p.key,p.tags].join(' ').toLowerCase().includes(query)))&&($('platform').value==='all'||p.platform===$('platform').value||($('platform').value==='other'&&!['cf','atcoder','luogu','leetcode'].includes(p.platform)))&&($('completion').value==='all'||get(p)===$('completion').value)&&(!$('start').value||p.date>=$('start').value)&&(!$('end').value||p.date<=$('end').value)&&(!difficulty||[p.difficulty,p.tags].join(' ').toLowerCase().includes(difficulty)));
 if($('start').value&&$('end').value&&$('start').value>$('end').value){$('summary').textContent='起始日期不能晚于结束日期';$('rows').innerHTML='';return;}
 matched.sort((a,b)=>(descending?-1:1)*a.date.localeCompare(b.date)||a.key.localeCompare(b.key));
 const days=new Map();for(const p of matched){if(!days.has(p.date))days.set(p.date,[]);days.get(p.date).push(p);}
 const units=mode==='daily'?[...days]:unique(matched).map(p=>({...p,topics:byKey.get(p.key).topics})),pages=Math.max(1,Math.ceil(units.length/size));page=Math.max(1,Math.min(page,pages));
 const filtered=stats(matched,profiles,manual);$('summary').textContent=`${days.size} 天 · ${filtered.appearances} 条每日记录 · ${filtered.total} 道题 · 已完成 ${filtered.solved} 道`;
 const problem=p=>{const solution=solutionLink(p),s=get(p),imported=Object.keys(platforms).some(id=>accounts[id]&&read(cacheKey(id),{}).source==='user-import'&&read(cacheKey(id),{}).statuses?.[p.key]==='solved'),dates=mode==='all'?[...new Set(data.problems.filter(v=>v.key===p.key).map(v=>v.date))]:[];return `<div class="problem ${s}"><div><a class="problemtitle" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.id)} ↗</a><div class="badges"><span class="badge">${({atcoder:'AtCoder',luogu:'洛谷',...platforms})[p.platform]||'其他平台'}</span><span class="badge">${esc((p.difficulty||'未标难度').replace(/^(\d+)\.0$/,'$1'))}</span><span class="status">${s==='solved'?(manual[p.key]?'✓ 已完成 · 手动补记':imported?'✓ 已完成 · 导入记录':'✓ 已完成 · 通过记录'):s==='attempted'?'尝试过 · 未确认通过':'未确认'}</span>${solution?`<a class="status" href="${esc(solution.url)}" target="_blank" rel="noopener">${esc(solution.label)} ↗</a>`:''}</div>${mode==='all'?`<div class="tags">${p.topics.map(t=>`<button class="light" data-topic="${esc(t)}">${esc(t)}</button>`).join(' ')||'原表暂无明确知识标签'}</div>`:$('showTags').checked?`<div class="tags">${esc(p.tags)}</div>`:''}${dates.length?`<div class="tags">${dates.map(d=>`<button class="light" data-date="${d}" data-query="${esc(p.id)}">${d}</button>`).join(' ')}</div>`:''}</div><button class="light" data-mark="${esc(p.key)}" ${s==='solved'&&!manual[p.key]?'disabled':''}>${manual[p.key]?'撤销补记':s==='solved'?(imported?'已导入 AC':'已同步 AC'):'标记已完成'}</button></div>`;};
 $('rows').innerHTML=units.slice((page-1)*size,page*size).map(unit=>{if(mode==='all')return `<article class="day">${problem(unit)}</article>`;const [day,ps]=unit,original=data.problems.filter(p=>p.date===day),done=original.filter(p=>get(p)==='solved').length;return `<article class="day ${done===original.length?'complete':''}"><div class="dayhead"><strong>${day}</strong><span>${done} / ${original.length} 已完成</span></div>${ps.map(problem).join('')}</article>`;}).join('')||'<p class="empty">没有匹配的题目。</p>';
 $('page').textContent=`${page} / ${pages}`;$('prev').disabled=page===1;$('next').disabled=page===pages;
 for(const id of ['daily','all']){$(id).classList.toggle('active',mode===id);$(id).setAttribute('aria-pressed',mode===id);}
}
for(const id of ['query','platform','completion','start','end','difficulty','showTags'])$(id).oninput=()=>{page=1;render()};
for(const id of ['daily','all'])$(id).onclick=()=>{mode=id;page=1;history.pushState(null,'','#'+id+(id==='all'&&topic?'/'+encodeURIComponent(topic):''));render()};
window.onhashchange=()=>{mode=location.hash.startsWith('#all')?'all':'daily';topic=readTopic();page=1;render()};
function chooseTopic(e){const button=e.target.closest('[data-topic]');if(!button)return;topic=button.dataset.topic;page=1;history.pushState(null,'','#all'+(topic?'/'+encodeURIComponent(topic):''));render();}
$('topicList').onclick=chooseTopic;
$('sort').onclick=()=>{descending=!descending;$('sort').textContent='日期 '+(descending?'↓':'↑');page=1;render()};$('prev').onclick=()=>{page--;render()};$('next').onclick=()=>{page++;render()};
$('reset').onclick=()=>{for(const id of ['query','start','end','difficulty'])$(id).value='';for(const id of ['platform','completion'])$(id).value='all';page=1;render()};
$('rows').onclick=e=>{chooseTopic(e);const mark=e.target.closest('[data-mark]');if(mark){if(manual[mark.dataset.mark])delete manual[mark.dataset.mark];else manual[mark.dataset.mark]=true;save('manual',manual);render();}const date=e.target.closest('[data-date]');if(date){mode='daily';history.pushState(null,'','#daily');$('platform').value=$('completion').value='all';$('difficulty').value='';$('query').value=date.dataset.query;$('start').value=$('end').value=date.dataset.date;page=1;render()}};
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
$('lg').oninput=$('lg').onchange=()=>{const uid=$('lg').value.trim();if(uid&&!/^\d+$/.test(uid)){$('lgStatus').textContent='UID 应为数字';return;}accounts.lg=uid;save('accounts',accounts);$('lgStatus').textContent='可导入当前账号的已通过题号';refreshCacheLabels();render()};
$('clearAccounts').onclick=()=>{if(busy.size){$('storageStatus').textContent='请等待正在进行的同步结束';return;}accounts=Object.fromEntries(Object.keys(platforms).map(id=>[id,'']));save('accounts',accounts);for(const id of Object.keys(platforms)){$(id).value='';$(id+'Status').textContent='已解除绑定，保留账号缓存。';}render()};
let importTarget='lg';
function openImportFor(id){
 const value=$(id).value.trim();if(!value||(id==='lg'&&!/^\d+$/.test(value))||(id!=='lg'&&!/^[a-zA-Z0-9_.-]{1,64}$/.test(value))){$(id+'Status').textContent='请先填写有效账号（洛谷为数字 UID）';return;}
 $(id).dispatchEvent(new Event('change'));importTarget=id;$('passed').value='';$('importStatus').textContent='';$('importTitle').textContent=`导入 ${platforms[id]} 已通过题目`;
 $('importHelp').textContent=id==='lg'?'从洛谷个人练习页复制“已通过题目”列表。不要复制“尝试过”列表。也可用本地辅助脚本自动提取。':'只导入该账号明确已通过的题目链接或标准题号。账号绑定用于隔离记录，不会自动查询完整提交历史。';
 const examples={lg:'P1001 CF1196B AT_abc250_e',leetcode:'https://leetcode.cn/problems/maximum-subarray/ 或 leetcode:maximum-subarray',nowcoder:'https://ac.nowcoder.com/acm/contest/76652/B 或 NC76652B',loj:'LOJ2978 或 https://loj.ac/p/2978',dotcpp:'DOTCPP2667 或 https://www.dotcpp.com/oj/problem2667.html',hdu:'HDU6357 或 http://acm.hdu.edu.cn/showproblem.php?pid=6357',iai:'YACS839 或 https://iai.sh.cn/problem/839'};
 $('importNote').textContent=examples[id]+(id==='lg'?'；数字 AT 镜像编号不猜映射。':'');$('passed').placeholder=examples[id];
 const urls={lg:`https://www.luogu.com.cn/user/${value}/practice`,leetcode:`https://leetcode.cn/u/${value}/`,nowcoder:`https://www.nowcoder.com/profile/${value}`,loj:'https://loj.ac/',dotcpp:'https://www.dotcpp.com/',hdu:'https://acm.hdu.edu.cn/',iai:'https://iai.sh.cn/'};
 $('practiceLink').href=urls[id];$('practiceLink').textContent=id==='lg'?'打开个人练习页 ↗':'打开平台主页 ↗';$('importDialog').showModal();
}
$('openImport').onclick=()=>openImportFor('lg');
$('closeImport').onclick=()=>$('importDialog').close();$('importPassed').onclick=()=>{try{const keys=importPassed($('passed').value);if(importTarget!=='lg'&&keys.some(key=>!key.startsWith(importTarget+':')))throw Error('列表包含其他平台题目，请分别导入对应账号');const old=read(cacheKey(importTarget),{}),statuses={...(old.statuses||{})};for(const key of keys)statuses[key]='solved';save(cacheKey(importTarget),{statuses,at:Date.now(),source:'user-import'});$('importStatus').textContent=`已合并 ${keys.length} 道通过题目；已有记录保留。`;refreshCacheLabels();render();}catch(e){$('importStatus').textContent=e.message}};
$('export').onclick=()=>{const records={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('lingcha.'))records[k.slice(8)]=read(k.slice(8),null);}const blob=new Blob([JSON.stringify({version:1,records},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='lingcha-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$('restore').onchange=async()=>{if(busy.size){$('storageStatus').textContent='同步进行中，请稍后恢复';return;}try{const file=$('restore').files[0];if(!file)return;if(file.size>10*1024*1024)throw Error('文件过大');const backup=JSON.parse(await file.text());if(backup.version!==1||!backup.records||typeof backup.records!=='object')throw Error('不是本站的进度备份');const validated=[];for(const [k,v] of Object.entries(backup.records)){if(k==='manual'){if(!v||typeof v!=='object'||Object.entries(v).some(([key,value])=>!canonical(key)||value!==true))throw Error('手动记录格式异常');validated.push([k,{...read(k,{}),...v}]);}else if(k.startsWith('cache.')&&/^cache\.(cf|at|lg|leetcode|nowcoder|loj|dotcpp|hdu|iai)\.[\w.-]+$/.test(k)){if(!v?.statuses||typeof v.statuses!=='object'||Object.entries(v.statuses).some(([key,value])=>!canonical(key)||!['solved','attempted'].includes(value)))throw Error('缓存格式异常');const old=read(k,{}),statuses={...(old.statuses||{})};for(const [key,value] of Object.entries(v.statuses))if(statuses[key]!=='solved')statuses[key]=value;validated.push([k,{...v,statuses,cursor:0}]);}else if(k==='accounts'){if(!v||Object.keys(platforms).some(id=>v[id]!==undefined&&(typeof v[id]!=='string'||!/^([\w.-]{1,64})?$/.test(v[id]))))throw Error('账号格式异常');validated.push([k,{...Object.fromEntries(Object.keys(platforms).map(id=>[id,''])),...v}]);}else throw Error('未知备份字段');}for(const [k,v] of validated)save(k,v);accounts=read('accounts',accounts);manual=read('manual',manual);for(const id of Object.keys(platforms))$(id).value=accounts[id];refreshCacheLabels();render();$('storageStatus').textContent='备份已恢复，完成记录已合并。';}catch(e){$('storageStatus').textContent='恢复失败：'+e.message}};
$('notifications').onclick=()=>$('historyDialog').showModal();$('closeHistory').onclick=()=>$('historyDialog').close();
try{const response=await fetch('./data/problems.json');if(!response.ok)throw Error('题库 HTTP '+response.status);data=await response.json();$('updated').textContent=`最近同步 ${new Date(data.generatedAt).toLocaleString('zh-CN')} · 原表版本 ${data.revision}`;$('coverage').textContent=`收录 ${data.problems.at(-1)?.date} 至 ${data.problems[0]?.date}；另有 ${data.skipped.length} 个日期无可识别题目链接，未计入题目统计。`;$('notificationCount').textContent=data.pending.length;$('historyChanges').innerHTML=data.pending.length?data.pending.map(c=>`<article class="historycard"><strong>${c.date}</strong><p>差异 ID：<code>${esc(c.id)}</code></p><pre>${esc(JSON.stringify({当前:c.before,上游:c.after},null,2))}</pre><a href="https://github.com/Code92007/lingcha-daily/actions/workflows/pages.yml" target="_blank" rel="noopener">打开更新工作流 ↗</a></article>`).join(''):'<p>暂无待确认历史变更。</p>';render();}catch(e){$('summary').textContent='题库加载失败：'+e.message;$('summary').classList.add('error')}
