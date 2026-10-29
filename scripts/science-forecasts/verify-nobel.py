import json,pathlib,urllib.request,concurrent.futures,hashlib,urllib.parse
root=pathlib.Path('public/data/nobel-odds');idx=json.load(open(root/'index.json'));jobs=[]
for ed in idx['editions']:
 d=json.load(open(root/ed['file']))
 for c in d['candidates']:jobs.append((ed,d,c))
cache={}
def check(job):
 ed,d,c=job;url=c['historySource'];out=dict(file=ed['file'],id=c['id'],source=ed['source'],archivedPoints=len(c['points']),historySource=url)
 try:
  if ed['source']=='Manifold':
   rows=[];current=url
   while True:
    if current not in cache:cache[current]=json.load(urllib.request.urlopen(current,timeout=25))
    page=cache[current];rows+=page
    if len(page)<1000:break
    current=url+'&before='+page[-1]['id']
   pts={(int(b['createdTime']/1000),float(b['probAfter'])) for b in rows if b.get('answerId')==c['id'] and b.get('probAfter') is not None and b.get('isFilled') is not False and not b.get('isRedemption') and abs(b.get('shares',0))>0 and int(b['createdTime']/1000)<d['cutoff'] and 0<=b['probAfter']<=1}
  else:
   raw=json.load(urllib.request.urlopen(url,timeout=25))
   if ed['source']=='Polymarket':pts={(p['t'],float(p['p'])) for p in raw.get('history',[]) if p['t']<d['cutoff']}
   else:pts={(p['end_period_ts'],float(p['price']['close_dollars'])) for p in raw.get('candlesticks',[]) if p.get('price',{}).get('close_dollars') is not None and float(p.get('volume_fp',0))>0 and p['end_period_ts']<d['cutoff']}
  archived={(p['t'],float(p['p'])) for p in c['points']};out.update(matched=len(archived&pts),verified=archived<=pts,remotePoints=len(pts))
 except Exception as e:out.update(verified=False,error=str(e))
 return out
# Separate workers by edition avoids duplicate pagination and keeps requests below source rate limits.
results=[]
for ed in idx['editions']:
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:results+=list(pool.map(check,[j for j in jobs if j[0]['file']==ed['file']]))
 print(ed['file'],[(r.get('verified'),r.get('error')) for r in results if r['file']==ed['file']],flush=True)
pathlib.Path('/tmp/nobel-verification.json').write_text(json.dumps(results,indent=2))
