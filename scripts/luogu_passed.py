"""Read ONLY the public passed list; emit IDs for the website's Luogu import."""
import argparse,json,re,urllib.request,pathlib

def parse_html(html):
 m=re.search(r'<script[^>]*id=["\']lentille-context["\'][^>]*>(.*?)</script>',html,re.S)
 if not m:raise ValueError('没有公开数据，可能需要登录、已启用隐私保护，或页面结构改变。未生成通过列表。')
 context=json.loads(m[1]);passed=context.get('data',{}).get('passed')
 if context.get('status')!=200 or not isinstance(passed,list):raise ValueError('未找到公开已通过列表；不能把尝试过题目当作已通过。')
 ids=[]
 for p in passed:
  if not isinstance(p,dict) or not re.fullmatch(r'[A-Za-z0-9_]+',str(p.get('pid',''))):raise ValueError('通过列表格式异常')
  ids.append(p['pid'])
 return sorted(set(ids))

def main():
 ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('uid',type=int);ap.add_argument('--html',help='离线解析已保存的个人练习页面');ap.add_argument('--output',default='luogu-passed.txt');a=ap.parse_args()
 if a.uid<=0:raise ValueError('UID 必须为正整数')
 if a.html:html=pathlib.Path(a.html).read_text()
 else:
  request=urllib.request.Request(f'https://www.luogu.com.cn/user/{a.uid}/practice',headers={'User-Agent':'Mozilla/5.0'})
  html=urllib.request.urlopen(request,timeout=30).read().decode('utf-8')
 ids=parse_html(html);pathlib.Path(a.output).write_text(' '.join(ids)+'\n');print(f'已导出 {len(ids)} 道公开已通过题目到 {a.output}；将内容粘贴到网站洛谷导入窗口。')
if __name__=='__main__':main()
