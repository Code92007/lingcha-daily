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
 const tokens=text.match(/https?:\/\/[^\s,;"<>]+|(?:CF\d+[A-Z]\w*|AT_[a-z\d]+_\w+|(?:P|B|U|SP|UVA|AT_)\d+)/gi)||[];
 const keys=[...new Set(tokens.map(canonical).filter(Boolean))];if(!keys.length)throw Error('未识别到题号，请只粘贴“已通过题目”列表。');return keys;
}
