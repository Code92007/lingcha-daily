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
 def test_row_shift_does_not_rewrite_history_or_create_notifications(self):
  old=[self.p()];new=[dict(old[0],row=3)];self.assertEqual(merge(old,new,'2026-10-08'),(old,[]))
 def test_deletion_notification_and_approval(self):
  old=[self.p()];m,p=merge(old,[],'2026-10-08');self.assertEqual(m,old);self.assertEqual(merge(old,[],'2026-10-08',p[0]['id'])[0],[])
 def test_mirror_identity(self):
  self.assertEqual(identity('https://www.luogu.com.cn/problem/CF1196B')[1],'cf:1196:B');self.assertEqual(identity('https://www.luogu.com.cn/problem/AT_abc250_e')[1],'atcoder:abc250_e')
 def test_committed_data_integrity(self):
  data=json.loads((pathlib.Path(__file__).resolve().parents[1]/'site/data/problems.json').read_text());ps=data['problems'];self.assertGreater(len(ps),1000);self.assertEqual(len(ps),len(set((p['date'],p['key'],p['row']) for p in ps)))
  for p in ps:
   datetime.date.fromisoformat(p['date']);self.assertEqual(identity(p['url'])[1],p['key'])
  self.assertEqual(set(p['platform'] for p in ps),{'cf','atcoder','luogu'})
if __name__=='__main__':unittest.main()
