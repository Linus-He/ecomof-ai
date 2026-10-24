# -*- coding: utf-8 -*-
"""Read public market metadata and pre-announcement price history. Never use settlement prices."""
import concurrent.futures, datetime, hashlib, json, pathlib, re, urllib.parse, urllib.request
repo=pathlib.Path(__file__).resolve().parents[2]
cache=pathlib.Path('/tmp/ecomof-polymarket');cache.mkdir(exist_ok=True)
out=repo/'public/data/nobel-odds';out.mkdir(exist_ok=True)
def read(url):
    request=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
    with urllib.request.urlopen(request,timeout=40) as r:return json.loads(r.read())
def normalize(value):return re.sub('[^a-z]','',value.lower())
def array(value):return json.loads(value) if isinstance(value,str) else value
snapshot=json.loads((repo/'scripts/nobel/official-prizes.json').read_text())['prizes']
search_url='https://gamma-api.polymarket.com/public-search?q=Nobel&events_status=all&limit_per_type=100&keep_closed_markets=1'
search=read(search_url);(cache/'events.json').write_text(json.dumps(search))
# The announced earliest time is part of the market's explicit resolution rules.
# This conservative cutoff avoids any post-announcement/settlement leakage.
cutoffs={2026:{'at':'2026-10-07T09:45:00+00:00','source':'https://www.nobelprize.org/prizes/chemistry/2026/press-release/'}}
audit=[];years=[]
for event in search.get('events',[]):
    if not re.search(r'nobel.*chemistry',event['slug'],re.I):continue
    match=re.search(r'20\d{2}',event['slug'])
    if not match:continue
    year=int(match[0])
    if year not in cutoffs:
        audit.append({'year':year,'status':'needs-verified-cutoff','event':event['slug']});continue
    cutoff=int(datetime.datetime.fromisoformat(cutoffs[year]['at']).timestamp());start=cutoff-86400
    prize=next(p for p in snapshot if int(p['year'])==year)
    winners=[' '.join(filter(None,[p.get('firstname'),p.get('surname')])) for p in prize.get('laureates',[])]
    def market(m):
        outcomes=array(m['outcomes']);tokens=array(m['clobTokenIds'])
        if 'Yes' not in outcomes:return None
        token=tokens[outcomes.index('Yes')]
        url='https://clob.polymarket.com/prices-history?'+urllib.parse.urlencode({'market':token,'startTs':start,'endTs':cutoff-1,'fidelity':5})
        try:
            raw=read(url);(cache/(m['id']+'.json')).write_text(json.dumps(raw))
            points=sorted({(int(p['t']),float(p['p'])) for p in raw.get('history',[]) if start<=int(p['t'])<cutoff and 0<=float(p['p'])<=1})
            if len(points)<2:return {'excluded':m['id'],'reason':'insufficient-pre-announcement-history','source':url}
            name=m.get('groupItemTitle') or m['question'];winner=next((w for w in winners if normalize(w)==normalize(name)),None)
            return {'id':m['id'],'name':name,'winner':bool(winner),'question':m['question'],'url':'https://polymarket.com/event/'+event['slug']+'/'+m['slug'],'tokenId':token,'historySource':url,'points':[{'t':t,'p':p} for t,p in points],'probability':points[-1][1],'quoteAt':points[-1][0],'historySha256':hashlib.sha256(json.dumps(raw,sort_keys=True).encode()).hexdigest()}
        except Exception as e:return {'excluded':m['id'],'reason':str(e),'source':url}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(market,event.get('markets',[])))
    candidates=sorted([r for r in results if r and 'points' in r],key=lambda r:-r['probability'])
    excluded=[r for r in results if r and 'excluded' in r]
    audit.append({'year':year,'event':event['slug'],'excluded':excluded,'cutoff':cutoff,'status':'published' if candidates else 'no-price-history'})
    if not candidates:continue
    record={'year':year,'title':'Nobel Chemistry Prize Winner','source':'Polymarket','eventUrl':'https://polymarket.com/event/'+event['slug'],'eventId':event['id'],'windowStart':start,'cutoff':cutoff,'cutoffSource':cutoffs[year]['source'],'method':'Last available Yes-token price in the 24 hours before the earliest official announcement time. Five-minute price-history samples; no settlement values. Independent binary markets may sum above 100%.','winners':winners,'unlistedWinners':[w for w in winners if not any(normalize(w)==normalize(m.get('groupItemTitle','')) for m in event['markets'])],'candidates':candidates}
    (out/f'{year}.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n');years.append(year)
    print(year,len(candidates),'markets with historical prices;',len(excluded),'excluded',flush=True)
(out/'index.json').write_text(json.dumps({'years':sorted(years),'latestYear':max(years) if years else None,'source':search_url},indent=2)+'\n')
(repo/'scripts/nobel/polymarket-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
