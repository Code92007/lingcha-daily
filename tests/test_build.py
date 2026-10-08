import unittest,sys,pathlib,json,copy,datetime
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'scripts'))
from build import merge
from source import identity
class IngestionTests(unittest.TestCase):
 def p(self,date='2026-10-07',key='cf:1:A',**kw):return dict(date=date,key=key,url='https://codeforces.com/problemset/problem/1/A',row=2,**kw)
 def test_protect_history_and_explicit_matching_approval(self):
  old=[self.p()];fresh=[self.p(difficulty='changed')];m,p=merge(old,fresh,'2026-10-08');self.assertEqual(m,old);self.assertEqual(len(p),1)
  self.assertEqual(merge(old,fresh,'2026-10-08',p[0]['id'])[0],fresh)
  with self.assertRaises(ValueError):merge(old,fresh,'2026-10-08','wrong')
  with self.assertRaises(ValueError):merge(old,[self.p(difficulty='newer')],'2026-10-08',p[0]['id'])
 def test_today_and_new_dates_retain_disappeared_appearances(self):
  old=[self.p(),self.p('2026-10-08')];new=[self.p('2026-10-08','cf:2:A'),self.p('2026-10-09')];merged,p=merge(old,new,'2026-10-08');self.assertIn(old[0],merged);self.assertIn(old[1],merged);self.assertEqual(len(merged),4);self.assertEqual(len(p),1)
 def test_today_duplicate_appearances_are_retained(self):
  old=[self.p('2026-10-08'),dict(self.p('2026-10-08'),row=3)]
  merged,_=merge(old,[old[0]],'2026-10-08');self.assertEqual(merged,old)
 def test_row_shift_does_not_rewrite_history_or_create_notifications(self):
  old=[self.p()];new=[dict(old[0],row=3)];self.assertEqual(merge(old,new,'2026-10-08'),(old,[]))
 def test_deletion_notification_and_approval(self):
  old=[self.p()];m,p=merge(old,[],'2026-10-08');self.assertEqual(m,old);self.assertEqual(merge(old,[],'2026-10-08',p[0]['id'])[0],[])
 def test_mirror_identity(self):
  self.assertEqual(identity('https://www.luogu.com.cn/problem/CF1196B')[1],'cf:1196:B');self.assertEqual(identity('https://www.luogu.com.cn/problem/AT_abc250_e')[1],'atcoder:abc250_e')
 def test_extra_platforms(self):
  for url,key in [('https://leetcode-cn.com/problems/maximum-subarray/','leetcode:maximum-subarray'),('https://ac.nowcoder.com/acm/contest/76652/B','nowcoder:76652:B'),('https://loj.ac/p/2978','loj:2978'),('https://www.dotcpp.com/oj/problem2667.html','dotcpp:2667'),('http://acm.hdu.edu.cn/showproblem.php?pid=6357','hdu:6357')]:self.assertEqual(identity(url)[1],key)
 def test_luogu_only_accepted_list(self):
  from luogu_passed import parse_html
  html='<script id="lentille-context" type="application/json">'+json.dumps({'status':200,'data':{'passed':[{'pid':'P1001'},{'pid':'CF1196B'}],'tried':[{'pid':'P5677'}]}})+'</script>'
  self.assertEqual(parse_html(html),['CF1196B','P1001'])
  with self.assertRaises(ValueError):parse_html('<html>Login required</html>')
 def test_numeric_pool_reserved_literals(self):
  from proto import fields
  with self.assertRaises(ValueError):fields(b'\x00')
 def test_committed_data_integrity(self):
  data=json.loads((pathlib.Path(__file__).resolve().parents[1]/'site/data/problems.json').read_text());ps=data['problems'];self.assertGreater(len(ps),1000);self.assertEqual(len(ps),len(set((p['date'],p['key'],p['row']) for p in ps)))
  for p in ps:
   datetime.date.fromisoformat(p['date']);self.assertEqual(identity(p['url'])[1],p['key'])
  self.assertTrue({'cf','atcoder','luogu'}.issubset(set(p['platform'] for p in ps)))
  candidates=ps+[p for c in data['pending'] for p in c['after']]
  self.assertEqual(set(p['platform'] for p in candidates),{'cf','atcoder','luogu','leetcode','nowcoder','loj','dotcpp','hdu'})
if __name__=='__main__':unittest.main()
