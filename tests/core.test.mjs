import test from 'node:test';import assert from 'node:assert/strict';
import {canonical,collectCF,collectAT,statusOf,stats,importPassed} from '../site/core.js';
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
