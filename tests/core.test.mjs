import test from 'node:test';import assert from 'node:assert/strict';
import {canonical,collectCF,collectAT,statusOf,stats,importPassed,knowledgeTags,topicProblems,solutionLink} from '../site/core.js';
test('canonical keys unify original and Luogu mirrors without guessing numeric AT IDs',()=>{
 for(const value of ['CF1196B','https://codeforces.com/problemset/problem/1196/B','https://www.luogu.com.cn/problem/CF1196B','cf:1196:B'])assert.equal(canonical(value),'cf:1196:B');
 for(const value of ['abc250_e','AT_abc250_e','https://atcoder.jp/contests/abc250/tasks/abc250_e'])assert.equal(canonical(value),'atcoder:abc250_e');
 assert.equal(canonical('AT_1234'),'luogu:AT_1234');assert.equal(canonical('P5677'),'luogu:P5677');assert.equal(canonical('https://evil.example/P1001'),null);
});
test('later failures never erase confirmed AC and platforms cannot collide',()=>{const cf=collectCF([{problem:{contestId:1196,index:'B'},verdict:'OK'},{problem:{contestId:1196,index:'B'},verdict:'WRONG_ANSWER'}]);assert.equal(cf['cf:1196:B'],'solved');const at=collectAT([{problem_id:'abc250_e',result:'AC'},{problem_id:'abc250_e',result:'WA'}]);assert.equal(at['atcoder:abc250_e'],'solved');assert.equal(statusOf({key:'cf:1196:B'},[cf,at],{}),'solved');assert.equal(statusOf({key:'luogu:P1196'},[cf,at],{}),'unknown');});
test('duplicates count once while day appearances remain separate',()=>{const p={key:'cf:1196:B'};assert.deepEqual(stats([p,p],[{'cf:1196:B':'solved'}]),{total:1,solved:1,appearances:2});assert.equal(statusOf(p,[],{[p.key]:true}),'solved');});
test('passed-list import deduplicates mirrors',()=>{assert.deepEqual(importPassed('P5677 CF1196B https://codeforces.com/problemset/problem/1196/B AT_abc250_e'),['luogu:P5677','cf:1196:B','atcoder:abc250_e']);assert.throws(()=>importPassed('没有可识别题号'));});
test('all additional platforms normalize canonical IDs and URLs',()=>{
 const pairs=[['https://leetcode-cn.com/problems/maximum-subarray/','leetcode:maximum-subarray'],['https://leetcode.cn/contest/weekly-contest-366/problems/apply-operations-to-make-two-strings-equal/','leetcode:apply-operations-to-make-two-strings-equal'],['https://ac.nowcoder.com/acm/contest/76652/B','nowcoder:76652:B'],['NC76652B','nowcoder:76652:B'],['https://loj.ac/p/2978','loj:2978'],['LOJ2978','loj:2978'],['https://www.dotcpp.com/oj/problem2667.html','dotcpp:2667'],['DOTCPP2667','dotcpp:2667'],['http://acm.hdu.edu.cn/showproblem.php?pid=6357','hdu:6357'],['HDU6357','hdu:6357']];for(const [input,key] of pairs){assert.equal(canonical(input),key);assert.equal(canonical(key),key);}
 assert.deepEqual(importPassed('leetcode:maximum-subarray NC76652B LOJ2978 DOTCPP2667 HDU6357'),['leetcode:maximum-subarray','nowcoder:76652:B','loj:2978','dotcpp:2667','hdu:6357']);
});

test('IAI OJ hidden hyperlink platform',()=>{assert.equal(canonical('https://iai.sh.cn/problem/839'),'iai:839');assert.equal(canonical('IAI839'),'iai:839');assert.deepEqual(importPassed('IAI839'),['iai:839']);});

test('topics union explicit tags and dates without changing preserved appearances',()=>{
 const ps=[{key:'a',date:'2026-10-08',tags:'[DP],[状态机 DP],[DP]'},{key:'a',date:'2025-01-01',tags:'贪心'},{key:'b',date:'2026-10-07',tags:'https://example.org/editorial'},{key:'c',date:'2026-10-06',tags:'这是很长的题解备注'}];
 const before=JSON.stringify(ps),items=topicProblems(ps);
 assert.equal(items.length,3);assert.deepEqual(items[0].topics,['DP','状态机 DP','贪心']);assert.deepEqual(items[0].dates,['2026-10-08','2025-01-01']);assert.deepEqual(items[1].topics,[]);assert.deepEqual(items[2].topics,[]);assert.equal(JSON.stringify(ps),before);
 for(const tag of ['DP','贪心'])assert.deepEqual(stats(items.filter(p=>p.topics.includes(tag)),[],{a:true}),{total:1,solved:1,appearances:1});
 assert.deepEqual(knowledgeTags('dp[i][1/2/3/4] 分别表示'),[]);
 assert.deepEqual(knowledgeTags('DP 0-1 背包 分类讨论'),['DP','0-1 背包','分类讨论']);
});

test('solution links use platform pages instead of the source spreadsheet',()=>{
 assert.equal(solutionLink({key:'luogu:P5677'}).url,'https://www.luogu.com.cn/problem/solution/P5677');
 assert.equal(solutionLink({key:'atcoder:abc250_e'}).url,'https://atcoder.jp/contests/abc250/editorial');
 assert.equal(solutionLink({key:'cf:1196:B'}).url,'https://codeforces.com/contest/1196');
 assert.equal(solutionLink({key:'cf:105161:E'}).url,'https://codeforces.com/gym/105161');
 assert.equal(solutionLink({key:'leetcode:maximum-subarray'}).url,'https://leetcode.cn/problems/maximum-subarray/solutions/');
 assert.equal(solutionLink({key:'hdu:6357'}),null);
});

test('clean taxonomy merges aliases, removes vague descriptors and unions parent progress',async()=>{
 const {normalizeTag,categoryOf,belongsToTopic}=await import('../site/topics.js');
 assert.equal(normalizeTag('恰好'),null);assert.equal(normalizeTag('二进制思维'),'二进制');
 assert.deepEqual(knowledgeTags('[二进制],[二进制思维],[恰好],[优化 DP],[DP 优化]'),['二进制','DP 优化']);
 for(const tag of ['数位 DP','树形 DP','0-1 背包','状态设计','DP 优化'])assert.equal(categoryOf(tag),'动态规划');
 const ps=topicProblems([{key:'a',date:'2026-10-08',tags:'[DP],[数位 DP]'}, {key:'a',date:'2025-01-01',tags:'[状态设计]'}, {key:'b',date:'2026-10-07',tags:'[树形 DP]'}, {key:'c',date:'2026-10-07',tags:'[恰好]'}]);
 assert.deepEqual(stats(ps.filter(p=>belongsToTopic(p,'__group:动态规划')),[],{a:true}),{total:2,solved:1,appearances:2});
 assert.equal(belongsToTopic(ps[2],'__untagged'),true);
 assert.equal(belongsToTopic({topics:['二进制']},'二进制思维'),true);
});
