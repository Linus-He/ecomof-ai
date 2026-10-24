"""Kalshi public event and traded-candle history. Never use settlement or previous-price carry-forward."""
import concurrent.futures,datetime,hashlib,json,pathlib,urllib.request,urllib.parse
repo=pathlib.Path(__file__).resolve().parents[2];cache=pathlib.Path('/tmp/ecomof-kalshi');cache.mkdir(exist_ok=True)
base='https://api.elections.kalshi.com/trade-api/v2';eventUrl=base+'/events/KXNOBELCHEM-26?with_nested_markets=true'
def read(url):
 return json.load(urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=40))
event=read(eventUrl);(cache/'event.json').write_text(json.dumps(event));markets=event.get('markets') or event['event']['markets'];cutoff=int(datetime.datetime.fromisoformat('2026-10-07T09:45:00+00:00').timestamp());start=cutoff-86400
existing=json.loads((repo/'public/data/nobel-odds/2026.json').read_text());known={c['name']:c for c in existing['candidates']}
def one(m):
 name=m['yes_sub_title'];ticker=m['ticker'];url=base+'/series/KXNOBELCHEM/markets/'+ticker+'/candlesticks?'+urllib.parse.urlencode({'start_ts':start,'end_ts':cutoff-1,'period_interval':1})
 raw=read(url);(cache/(ticker+'.json')).write_text(json.dumps(raw));points=[]
 for c in raw.get('candlesticks',[]):
  t=c['end_period_ts'];price=c.get('price',{}).get('close_dollars')
  if price is None or float(c.get('volume_fp',0))<=0 or not start<=t<cutoff:continue
  value=float(price)
  if 0<=value<=1:points.append({'t':t,'p':value})
 if not points:return {'excluded':ticker,'name':name,'reason':'No traded pre-announcement candle in the final day','source':url}
 points.sort(key=lambda p:p['t']);profile=known.get(name)
 if not profile:raise ValueError('Missing candidate identity '+name)
 return {'id':ticker,'name':name,'winner':False,'kind':'person','url':base+'/markets/'+ticker,'historySource':url,'points':points,'probability':points[-1]['p'],'quoteAt':points[-1]['t'],'historySha256':hashlib.sha256(json.dumps(raw,sort_keys=True).encode()).hexdigest()}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as p:records=list(p.map(one,markets))
candidates=sorted([r for r in records if 'points' in r],key=lambda c:-c['probability']);excluded=[r for r in records if 'excluded' in r]
if not candidates:raise ValueError('No verifiable Kalshi history')
record={'year':2026,'source':'Kalshi','currency':'USD','marketKind':'person','eventId':'KXNOBELCHEM-26','eventUrl':eventUrl,'windowStart':start,'cutoff':cutoff,'cutoffSource':'https://www.nobelprize.org/prizes/chemistry/2026/press-release/','method':'One-minute candles with positive traded volume and a close_dollars trade price, strictly before announcement. Empty candles, previous-price carry-forward and settlement are excluded. Candle end times are aggregation boundaries, not exact trade timestamps.','unlistedWinners':existing['unlistedWinners'],'winners':existing['winners'],'candidates':candidates,'excluded':excluded}
(repo/'public/data/nobel-odds/2026-kalshi.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
p=repo/'public/data/nobel-odds/index.json';index=json.loads(p.read_text());index['editions']=[e for e in index['editions'] if e['source']!='Kalshi']+[{'year':2026,'source':'Kalshi','file':'2026-kalshi.json'}];p.write_text(json.dumps(index,indent=2)+'\n')
(repo/'scripts/nobel/kalshi-audit.json').write_text(json.dumps({'eventSource':eventUrl,'candidates':len(candidates),'excluded':excluded,'cutoff':cutoff,'method':record['method']},ensure_ascii=False,indent=2)+'\n');print(len(candidates),'Kalshi candidates;',len(excluded),'excluded')
