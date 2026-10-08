"""Anonymous public Tencent sheet snapshot; no credentials are stored."""
import base64, zlib, struct, json, datetime, re, urllib.request, http.cookiejar, time
from proto import fields
SOURCE='https://docs.qq.com/sheet/DWGFoRGVZRmxNaXFz?tab=BB08J2'
def values(b,k):return [v for n,w,v in fields(b) if n==k]
def one(b,k,default=b''):return next(iter(values(b,k)),default)
def text(b):return one(b,1).decode('utf-8')
def rich(b):
 return ''.join(text(one(v,3)) for v in values(b,3) if one(v,3))
def decode(payload):
 t=payload['clientVars']['collab_client_vars']['initialAttributedText']['text'][0]
 b=zlib.decompress(base64.b64decode(t['related_sheet']))
 mutations=values(one(b,1),5)
 sheets=[one(m,19) for m in mutations if one(m,1,0)==18]
 if len(sheets)!=1:raise ValueError('Unexpected sheet encoding')
 sheet=sheets[0]; shared=one(sheet,5)
 pools={4:[text(v) for v in values(shared,1)],6:[rich(v) for v in values(shared,2)],2:[struct.unpack('<d',one(v,1))[0] for v in values(shared,3)]}
 rows={}
 for cell in values(sheet,6):
  row=one(cell,1,0); col=one(cell,2,0);v=one(cell,3);typ=one(v,1,0)
  if typ not in pools:continue
  idx=one(one(v,2),1,0)
  # Tencent reserves numeric IDs 0..128 for those literal integers.
  rows.setdefault(row,{})[col]=(idx if idx<129 else pools[typ][idx-129]) if typ==2 else pools[typ][idx]
 return rows,t

def fetch():
 jar=http.cookiejar.CookieJar();opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
 headers={'User-Agent':'Mozilla/5.0','Referer':SOURCE}
 for attempt in range(3):
  try:
   opener.open(urllib.request.Request(SOURCE,headers=headers),timeout=90).read()
   url='https://docs.qq.com/dop-api/opendoc?id=DWGFoRGVZRmxNaXFz&tab=BB08J2&outformat=1&normal=1&noEscape=1'
   return json.load(opener.open(urllib.request.Request(url,headers=headers),timeout=90))
  except Exception:
   if attempt==2:raise
   time.sleep(3*(attempt+1))

def identity(url):
 m=re.search(r'codeforces.com/(?:problemset/problem/(\d+)/([A-Za-z0-9]+)|(?:contest|gym)/(\d+)/problem/([A-Za-z0-9]+))',url)
 if m:
  contest=m[1] or m[3];index=(m[2] or m[4]).upper();return 'cf',f'cf:{contest}:{index}',f'CF{contest}{index}'
 m=re.search(r'atcoder.jp/contests/[^/]+/tasks/([\w]+)',url)
 if m:return 'atcoder','atcoder:'+m[1].lower(),m[1]
 m=re.search(r'luogu.com.cn/problem/([\w]+)',url)
 if m:
  pid=m[1];cf=re.fullmatch(r'CF(\d+)([A-Za-z]\w*)',pid)
  if cf:return 'cf',f'cf:{cf[1]}:{cf[2].upper()}',pid
  if pid.startswith('AT_'):return 'atcoder','atcoder:'+pid[3:].lower(),pid
  return 'luogu','luogu:'+pid.upper(),pid.upper()
 return None

def parse(payload):
 rows,t=decode(payload);out=[];skipped=[]
 for row,c in sorted(rows.items()):
  if row==0:continue
  date=c.get(0)
  if not isinstance(date,(float,int)):continue
  day=(datetime.date(1899,12,30)+datetime.timedelta(days=int(date))).isoformat()
  links=re.findall(r'https?://[^\s<>"，。]+',str(c.get(1,'')))
  problems=[]
  for url in links:
   ident=identity(url)
   if not ident:continue
   platform,key,pid=ident
   if any(p['key']==key for p in problems):continue
   problems.append({'key':key,'id':pid,'platform':platform,'url':url,'difficulty':str(c.get(3,'')),'tags':str(c.get(5,'')),'source':SOURCE,'row':row+1})
  if problems:out.extend(dict(p,date=day) for p in problems)
  else:skipped.append({'date':day,'row':row+1,'reason':'原表题目栏无可识别题目链接'})
 if len(out)<100 or max(p['row'] for p in out)<int(t['max_row'])*.9:raise ValueError('Incomplete or changed source; refusing deployment')
 return out,skipped
