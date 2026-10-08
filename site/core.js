export const platforms={cf:'Codeforces',at:'AtCoder',lg:'洛谷',leetcode:'LeetCode'};
export function canonical(value){
 const v=String(value).trim();let m;
 if((m=v.match(/codeforces\.com\/(?:problemset\/problem\/(\d+)\/([a-z\d]+)|(?:contest|gym)\/(\d+)\/problem\/([a-z\d]+))/i)))return `cf:${m[1]||m[3]}:${(m[2]||m[4]).toUpperCase()}`;
 if((m=v.match(/atcoder\.jp\/contests\/[^/]+\/tasks\/(\w+)/i)))return 'atcoder:'+m[1].toLowerCase();
 const id=v.replace(/^.*luogu\.com\.cn\/problem\//i,'').replace(/[?#].*$/,'');
 if((m=id.match(/^(?:cf:|CF)(\d+):?([a-z]\w*)$/i)))return `cf:${m[1]}:${m[2].toUpperCase()}`;
 if(/^atcoder:/i.test(id))return id.toLowerCase();
 if(/^AT_[a-z]+\d*_\w+$/i.test(id))return 'atcoder:'+id.slice(3).toLowerCase();
 if(/^[a-z]+\d*_\w+$/i.test(id)&&!/^AT_/i.test(id))return 'atcoder:'+id.toLowerCase();
 if(/^(?:P|B|U|SP|UVA|AT_)\d+$/i.test(id))return 'luogu:'+id.toUpperCase();
 if((m=v.match(/(?:leetcode\.cn|leetcode-cn\.com|leetcode\.com)\/(?:contest\/[^/]+\/)?problems\/([a-z0-9-]+)/i)))return 'leetcode:'+m[1].toLowerCase();
 if((m=v.match(/^leetcode:([a-z0-9-]+)$/i)))return 'leetcode:'+m[1].toLowerCase();
 if((m=v.match(/ac\.nowcoder\.com\/acm\/contest\/(\d+)\/([a-z0-9]+)/i)))return `nowcoder:${m[1]}:${m[2].toUpperCase()}`;
 if((m=v.match(/^(?:nowcoder:|NC)(\d+):?([a-z][a-z0-9]*)$/i)))return `nowcoder:${m[1]}:${m[2].toUpperCase()}`;
 for(const [platform,pattern,prefix] of [['loj',/loj\.ac\/p\/(\d+)/i,'LOJ'],['dotcpp',/dotcpp\.com\/oj\/problem(\d+)\.html/i,'DOTCPP'],['hdu',/acm\.hdu\.edu\.cn\/showproblem\.php\?pid=(\d+)/i,'HDU'],['iai',/iai\.sh\.cn\/problem\/(\d+)/i,'(?:IAI|YACS)']]){
  m=v.match(pattern)||v.match(new RegExp(`^(?:${platform}:|${prefix})(\\d+)$`,'i'));if(m)return `${platform}:${m[1]}`;
 }
 if(/^luogu:/i.test(id))return canonical(id.slice(6));
 return null;
}
export function collectCF(submissions,statuses={}){
 for(const s of submissions){if(!s.problem?.contestId||!s.problem?.index)continue;const key=`cf:${s.problem.contestId}:${s.problem.index.toUpperCase()}`;if(s.verdict==='OK')statuses[key]='solved';else if(s.verdict&&!['TESTING','SKIPPED'].includes(s.verdict)&&statuses[key]!=='solved')statuses[key]='attempted';}return statuses;
}
export function collectAT(submissions,statuses={}){
 for(const s of submissions){if(!s.problem_id)continue;const key='atcoder:'+s.problem_id.toLowerCase();if(s.result==='AC')statuses[key]='solved';else if(s.result&&!['WJ','WR'].includes(s.result)&&statuses[key]!=='solved')statuses[key]='attempted';}return statuses;
}
export function statusOf(p,profiles,manual){if(manual[p.key])return 'solved';if(profiles.some(s=>s[p.key]==='solved'))return 'solved';return profiles.some(s=>s[p.key]==='attempted')?'attempted':'unknown';}
export function unique(ps){return [...new Map(ps.map(p=>[p.key,p])).values()];}
export function stats(ps,profiles=[],manual={}){const u=unique(ps);return {total:u.length,solved:u.filter(p=>statusOf(p,profiles,manual)==='solved').length,appearances:ps.length};}
export function importPassed(text){
 const tokens=text.match(/https?:\/\/[^\s,;"<>]+|(?:CF\d+[A-Z]\w*|AT_[a-z\d]+_\w+|(?:P|B|U|SP|UVA|AT_)\d+|NC\d+[A-Z]\w*|(?:LOJ|HDU|DOTCPP|IAI|YACS)\d+|(?:leetcode:[a-z0-9-]+|nowcoder:\d+:[A-Z]\w*|(?:loj|hdu|dotcpp|iai):\d+))/gi)||[];
 const keys=[...new Set(tokens.map(canonical).filter(Boolean))];if(!keys.length)throw Error('未识别到题号，请只粘贴“已通过题目”列表。');return keys;
}

// Only explicit source tags are categories; editorial URLs and prose are not.
export function knowledgeTags(value=''){
 const bracketed=[...(value.trim().startsWith('[')?value:'').matchAll(/\[([^\[\]\n]+)\]/g)].map(m=>m[1].trim()).filter(t=>t&&!/https?:|@/.test(t));
 if(bracketed.length)return [...new Set(bracketed)];
 const plain=value.trim();
 if(['DP','贪心','构造','分类讨论','状压 DP','状态机 DP','线性 DP'].includes(plain))return [plain];
 if(plain==='DP 位运算')return ['DP','位运算'];
 if(plain==='DP 0-1 背包 分类讨论')return ['DP','0-1 背包','分类讨论'];
 return [];
}
export function topicProblems(appearances){
 const byKey=new Map();
 for(const p of appearances){
  if(!byKey.has(p.key))byKey.set(p.key,{...p,topics:[],dates:[]});
  const item=byKey.get(p.key);
  item.topics=[...new Set([...item.topics,...knowledgeTags(p.tags)])];
  item.dates=[...new Set([...item.dates,p.date])].sort().reverse();
 }
 return [...byKey.values()];
}
export function solutionLink(p){
 const parts=p.key.split(':');
 if(parts[0]==='luogu')return {url:`https://www.luogu.com.cn/problem/solution/${encodeURIComponent(parts[1])}`,label:'题解区'};
 if(parts[0]==='atcoder'){const contest=parts[1].slice(0,parts[1].lastIndexOf('_'));return {url:`https://atcoder.jp/contests/${encodeURIComponent(contest)}/editorial`,label:'竞赛题解'};}
 if(parts[0]==='cf')return {url:`https://codeforces.com/${Number(parts[1])>=100000?'gym':'contest'}/${parts[1]}`,label:'竞赛 / 题解入口'};
 if(parts[0]==='leetcode')return {url:`https://leetcode.cn/problems/${encodeURIComponent(parts[1])}/solutions/`,label:'题解区'};
 return null;
}
