def fields(b):
 def var(i):
  n=s=0
  while True:
   v=b[i];i+=1;n|=(v&127)<<s
   if v<128:return n,i
   s+=7
   if s>70:raise ValueError('varint')
 i=0;out=[]
 while i<len(b):
  tag,i=var(i);k,w=tag>>3,tag&7
  if not k:raise ValueError('field zero')
  if w==0:v,i=var(i)
  elif w==2:
   n,i=var(i);v=b[i:i+n];i+=n
   if i>len(b):raise ValueError('length')
  elif w in (1,5):n=8 if w==1 else 4;v=b[i:i+n];i+=n
  else:raise ValueError('wire')
  out.append((k,w,v))
 return out
