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
