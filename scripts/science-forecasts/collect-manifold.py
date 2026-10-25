"""Read-only public API capture. No accounts, trading or private user data.
Raw responses stay in /tmp; the published projection excludes user identities.
"""
import argparse,concurrent.futures,datetime,hashlib,json,pathlib,time,urllib.parse,urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[2]
CACHE=pathlib.Path('/tmp/science-forecasts-source');CACHE.mkdir(exist_ok=True)
SELECTED={
 'SAIUNdCI8U':'solid-state-batteries','URnpyLNL6s':'solid-state-batteries',
 '5yR6nLsLlu':'solid-state-batteries','E6A6gylOZq':'solid-state-batteries',
 'hznAd5Sh0S':'solid-state-batteries','Shc85pllS8':'solid-state-batteries',
 'yTnpOcsEjYIa0GcasRVg':'solid-state-batteries','jVXPWByYV1uHFNzjULf6':'solid-state-batteries',
 'n0dowx6m17':'solid-state-batteries','2UE5OE8cAwOnRANIwyGi':'solid-state-batteries',
 '8m2QavDR1KYRdV3g8aDf':'superconductors','tV8TUnUEXherIZzyoywQ':'superconductors',
 'kphkIrlmHjGcCssSiHdi':'superconductors','S1JzUyhBphhmBZF6UTLr':'superconductors',
 'GJf5q3WjqIIiArUkpxbl':'superconductors','H5nCcUUDsH556qedFoUn':'superconductors',
 'xsHh9WCTD1PRuvZwTYqA':'superconductors',
 'u1hCf24lNpTqWYEpM2Uq':'carbon-capture','f6jHUqoKdt8YmpXQjGlO':'carbon-capture',
}
def read(url):
 for attempt in range(3):
  try:
   with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'EcoMOF-AI public scientific forecast archive'}),timeout=40) as r:return r.read()
  except Exception:
   if attempt==2:raise
   time.sleep(1+attempt)
def text(node):
 if isinstance(node,str):return node
 if isinstance(node,list):return '\n'.join(filter(None,(text(n) for n in node)))
 if isinstance(node,dict):return node.get('text','') or text(node.get('content',[]))
 return ''
def collect(pair):
 id,topic=pair;url='https://api.manifold.markets/v0/market/'+id
 raw=read(url);market=json.loads(raw);(CACHE/(id+'-market.json')).write_bytes(raw)
 if market.get('outcomeType')!='BINARY':raise ValueError('Unreviewed market type '+id)
 pages=[];before=None;seen=set();bets=[]
 while True:
  args={'contractId':id,'limit':1000}
  if before:args['before']=before
  beturl='https://api.manifold.markets/v0/bets?'+urllib.parse.urlencode(args)
  pageRaw=read(beturl);page=json.loads(pageRaw);pages.append({'url':beturl,'sha256':hashlib.sha256(pageRaw).hexdigest(),'rows':len(page)})
  for b in page:
   if b['id'] not in seen:seen.add(b['id']);bets.append(b)
  if len(page)<1000:break
  cursor=page[-1]['id']
  if cursor==before:raise ValueError('Repeated history cursor '+id)
  before=cursor
 (CACHE/(id+'-bets.json')).write_text(json.dumps(bets))
 now=int(datetime.datetime.now(datetime.timezone.utc).timestamp()*1000)
 boundaries=[now]
 if market.get('closeTime'):boundaries.append(market['closeTime'])
 if market.get('isResolved') and market.get('resolutionTime'):boundaries.append(market['resolutionTime'])
 cutoff=min(boundaries)
 usable=[b for b in bets if isinstance(b.get('probAfter'),(int,float)) and 0<=b['probAfter']<=1 and b.get('isFilled') is not False and not b.get('isRedemption') and abs(b.get('shares',0))>0 and b['createdTime']<cutoff]
 # A single binary market has one post-trade price at each observed instant.
 pointsByTime={}
 for b in sorted(usable,key=lambda b:(b['createdTime'],b['id'])):pointsByTime[int(b['createdTime'])]=float(b['probAfter'])
 points=[{'t':t,'p':p} for t,p in sorted(pointsByTime.items())]
 status='resolved' if market.get('isResolved') else 'closed' if market.get('closeTime',now+1)<=now else 'open'
 data={'id':id,'topicId':topic,'source':'Manifold','currency':'MANA','url':market['url'],'originalTitle':market['question'],'status':status,'resolution':market.get('resolution'),'resolutionProbability':market.get('resolutionProbability'),'snapshotProbability':market.get('probability') if status=='open' else None,'volume':market.get('volume',0),'participants':market.get('uniqueBettorCount',0),'createdTime':market['createdTime'],'closeTime':market.get('closeTime'),'resolutionTime':market.get('resolutionTime'),'observedAt':now,'historyCutoff':cutoff,'points':points,'historyComplete':True,'lastTradeProbability':points[-1]['p'] if points else None,'lastTradeAt':points[-1]['t'] if points else None,'sourceApi':url,'provenance':{'marketSha256':hashlib.sha256(raw).hexdigest(),'historyPages':pages,'fetchedTradeRows':len(bets),'acceptedTradeRows':len(usable),'excludedTradeRows':len(bets)-len(usable)}}
 (CACHE/(id+'-projected.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 (CACHE/(id+'-rules.txt')).write_text(text(market.get('description',{})))
 print(id,topic,status,market.get('resolution'),len(points),'history points',flush=True)
 return data
if __name__=='__main__':
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:records=list(pool.map(collect,SELECTED.items()))
 (CACHE/'collected.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
 print('Captured',len(records),'public binary markets; raw identities excluded from projections.')
