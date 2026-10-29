import json,pathlib,urllib.request,urllib.parse,hashlib,concurrent.futures,time
root=pathlib.Path('public/data/science-forecasts');idx=json.load(open(root/'index.json'));out=pathlib.Path('/tmp/science-trade-verification');out.mkdir(exist_ok=True)
def get(url):
 for n in range(3):
  try:
   raw=urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'EcoMOF-AI read-only source audit'}),timeout=35).read();return json.loads(raw),hashlib.sha256(raw).hexdigest()
  except Exception:
   if n==2:raise
   time.sleep(1)
def audit(e):
 saved=json.load(open(root/e['detailFile']));id=e['id'];pages=[];bets={};before=None
 try:
  m,mhash=get(saved['sourceApi'])
  while True:
   url='https://api.manifold.markets/v0/bets?'+urllib.parse.urlencode(dict(contractId=id,limit=1000,**({'before':before} if before else {})))
   rows,sha=get(url);pages.append(dict(url=url,sha256=sha,rows=len(rows)))
   for b in rows:bets[b['id']]=b
   if len(rows)<1000:break
   cursor=rows[-1]['id']
   if cursor==before:raise Exception('Repeated cursor')
   before=cursor
  pts={}
  for b in sorted(bets.values(),key=lambda b:(b['createdTime'],b['id'])):
   if isinstance(b.get('probAfter'),(int,float)) and 0<=b['probAfter']<=1 and b.get('isFilled') is not False and not b.get('isRedemption') and abs(b.get('shares',0))>0 and b['createdTime']<saved['historyCutoff']:pts[int(b['createdTime'])]=float(b['probAfter'])
  actual=[dict(t=t,p=p) for t,p in sorted(pts.items())];source={p['t']:p['p'] for p in actual};arch={p['t']:p['p'] for p in saved['points']}
  missing=[t for t,p in arch.items() if t not in source];changed=[t for t,p in arch.items() if t in source and abs(p-source[t])>1e-12];extra=[t for t in source if t not in arch]
  result=dict(id=id,sourceApi=saved['sourceApi'],marketSha256=mhash,pages=pages,archivedPoints=len(arch),reconstructedPoints=len(actual),missingTimestamps=missing,changedTimestamps=changed,extraTimestamps=extra,verified=not(missing or changed or extra),archiveCutoff=saved['historyCutoff'],currentResolution=m.get('resolution'),archivedResolution=saved['resolution'],rawRows=len(bets))
 except Exception as ex:result=dict(id=id,verified=False,error=str(ex))
 (out/(id+'.json')).write_text(json.dumps(result,indent=2));print(id,result['verified'],result.get('archivedPoints'),result.get('reconstructedPoints'),result.get('error',''),flush=True);return result
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(audit,idx['events']))
(out/'results.json').write_text(json.dumps(results,indent=2))
