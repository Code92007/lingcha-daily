import argparse,datetime,hashlib,json,pathlib,os
from source import fetch,parse,SOURCE
ROOT=pathlib.Path(__file__).resolve().parents[1]
def digest(v):return hashlib.sha256(json.dumps(v,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def merge(old,new,today,approve=''):
 def group(ps):
  d={}
  for p in ps:d.setdefault(p['date'],[]).append(p)
  return {k:sorted(v,key=lambda p:p['key']) for k,v in d.items()}
 before,after=group(old),group(new);pending=[];approved=False
 for day,records in after.items():
  if day not in before:before[day]=records;continue
  if day>=today:
   retained={p['key']:p for p in before[day]};retained.update({p['key']:p for p in records});before[day]=sorted(retained.values(),key=lambda p:p['key']);continue
  # Source row numbers shift whenever a new date is inserted; they are navigation hints, not corrections.
  clean=lambda rs:[{k:v for k,v in p.items() if k!='row'} for p in rs]
  if clean(before[day])!=clean(records):
   change={'date':day,'before':before[day],'after':records};change['id']=digest({'date':day,'before':clean(before[day]),'after':clean(records)})[:24]
   if approve==change['id']:before[day]=records;approved=True
   else:pending.append(change)
 for day in sorted(set(before)-set(after)):
  change={'date':day,'before':before[day],'after':[]};change['id']=digest(change)[:24]
  if approve==change['id']:before[day]=[];approved=True
  else:pending.append(change)
 if approve and not approved:raise ValueError('Invalid or stale change ID')
 return [p for day in sorted(before,reverse=True) for p in before[day]],pending

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--snapshot');ap.add_argument('--approve-change',default='');a=ap.parse_args()
 payload=json.loads(pathlib.Path(a.snapshot).read_text()) if a.snapshot else fetch()
 fresh,skipped=parse(payload);path=ROOT/'site/data/problems.json';old=json.loads(path.read_text()) if path.exists() else {'problems':[]}
 now=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8)));today=now.date().isoformat()
 merged,pending=merge(old['problems'],fresh,today,a.approve_change)
 data={'generatedAt':now.isoformat(),'source':SOURCE,'revision':payload['clientVars']['collab_client_vars']['rev'],'problems':merged,'pending':pending,'skipped':skipped,'sourceRows':payload['clientVars']['collab_client_vars']['maxRow']}
 tmp=path.with_suffix('.tmp');tmp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');os.replace(tmp,path)
 print(f"{len(merged)} appearances, {len(set(p['key'] for p in merged))} unique problems, {len(pending)} pending corrections, {len(skipped)} non-link rows")
if __name__=='__main__':main()
