"""Public API trade quotes only. Never substitute a resolved probability for history."""
import subprocess
import datetime,hashlib,json,pathlib,urllib.request,urllib.parse
repo=pathlib.Path(__file__).resolve().parents[2];cache=pathlib.Path('/tmp/nobel-manifold');cache.mkdir(exist_ok=True)
out=repo/'public/data/nobel-odds'
# 2023 was leaked early: truncate before the first reported press-email disclosure.
editions=[(2022,'X3nCLJkHitSmK0mukqGx','2022-10-05T09:45:00+00:00','person'),(2023,'wLN9dUY4NH2gm72IdlM1','2023-10-04T05:31:00+00:00','person'),(2024,'PSBYwxvrI53eVr01PO9L','2024-10-09T09:45:00+00:00','field'),(2025,'0ElAsn8LS9','2025-10-08T09:45:00+00:00','field'),(2026,'zLAczO2CsI','2026-10-07T09:45:00+00:00','field')]
def read(url):
 return json.load(urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=40))
audit=[]
for year,id,cutoffText,kind in editions:
 marketUrl='https://api.manifold.markets/v0/market/'+id
 m=read(marketUrl);(cache/(id+'.json')).write_text(json.dumps(m));bets=[];before=None;sources=[]
 while True:
  query={'contractId':id,'limit':1000}
  if before:query['before']=before
  url='https://api.manifold.markets/v0/bets?'+urllib.parse.urlencode(query);page=read(url);sources.append(url);bets+=page
  if len(page)<1000:break
  before=page[-1]['id']
 (cache/(id+'-bets.json')).write_text(json.dumps(bets))
 cutoff=int(datetime.datetime.fromisoformat(cutoffText).timestamp());candidates=[];excluded=[]
 for answer in m.get('answers',[]):
  name=answer['text']
  if name=='Muhammad Usman':
   excluded.append({'answer':name,'reason':'Identity and institutional profile could not be verified unambiguously'});continue
  quotes=[b for b in bets if b.get('answerId')==answer['id'] and b.get('probAfter') is not None and b.get('isFilled') is not False and not b.get('isRedemption') and abs(b.get('shares',0))>0 and int(b['createdTime']/1000)<cutoff and 0<=b['probAfter']<=1]
  points=sorted({(int(b['createdTime']/1000),float(b['probAfter'])) for b in quotes})
  if not points:
   excluded.append({'answer':name,'reason':'No verified pre-cutoff trade probability'});continue
  isOther=name in ['Other','Someone not mentioned in any answer at close time']
  candidates.append({'id':answer['id'],'name':name,'kind':'other' if isOther else kind,'winner':False,'url':m['url'],'points':[{'t':t,'p':p} for t,p in points],'probability':points[-1][1],'quoteAt':points[-1][0],'historySource':sources[0]})
 if not candidates:raise ValueError(f'No usable history for {year}')
 candidates.sort(key=lambda x:-x['probability']);award=json.loads((repo/f'public/data/nobel-chemistry/{year}.json').read_text())
 record={'year':year,'title':m['question'],'source':'Manifold','currency':'MANA','marketKind':kind,'eventUrl':m['url'],'eventId':id,'windowStart':min(p['t'] for c in candidates for p in c['points']),'cutoff':cutoff,'cutoffSource':'https://apnews.com/article/52e681abdb81943ca85c8438973f97a4' if year==2023 else f'https://www.nobelprize.org/prizes/chemistry/{year}/prize-announcement/','cutoffNote':'Truncated before the earliest reported leaked announcement.' if year==2023 else 'Earliest scheduled announcement.','marketRulesUrl':marketUrl,'method':'Manifold play-money trade probabilities. Last directly recorded probAfter per answer; probabilities of other answers may also move without a direct trade. Quotes are not a complete simultaneous market snapshot. No settlement values and no interpolated history.','answersSumToOne':m.get('shouldAnswersSumToOne',False),'winners':award['names'],'unlistedWinners':[],'candidates':candidates,'excluded':excluded,'historySources':sources,'historySha256':hashlib.sha256(json.dumps(bets,sort_keys=True).encode()).hexdigest(),'sparseHistory':True}
 (out/(f'{year}-manifold.json' if year==2026 else f'{year}.json')).write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n');audit.append({'year':year,'marketUrl':marketUrl,'marketId':id,'candidateCount':len(candidates),'excluded':excluded,'cutoff':cutoff,'source':sources,'historySha256':record['historySha256']});print(year,len(candidates),'verified options',flush=True)
(repo/'scripts/nobel/manifold-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
subprocess.run(['node',str(repo/'scripts/nobel/rebuild-market-index.mjs')],check=True)
