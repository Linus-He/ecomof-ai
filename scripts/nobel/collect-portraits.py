# -*- coding: utf-8 -*-
"""Collect only official laureate portraits; cache source pages outside the published site."""
import concurrent.futures, hashlib, html, json, pathlib, re, urllib.request
repo = pathlib.Path(__file__).resolve().parents[2]
cache = pathlib.Path('/tmp/ecomof-nobel-portraits'); cache.mkdir(exist_ok=True)
out = repo/'public/images/nobel/laureates'; out.mkdir(exist_ok=True)
prizes = json.loads((repo/'scripts/nobel/official-prizes.json').read_text())['prizes']
previous_path = repo/'scripts/nobel/portraits.json'
previous = json.loads(previous_path.read_text()) if previous_path.exists() else {}
def get(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(request, timeout=40) as response: return response.read()
def collect(prize):
    year = prize['year']; url = f'https://www.nobelprize.org/prizes/chemistry/{year}/summary/'
    if year in previous and len(previous[year]) == len(prize.get('laureates',[])) and all((repo/'public'/p['image']).exists() for p in previous[year]): return year,previous[year]
    page = cache/f'{year}.html'
    try:
        if not page.exists(): page.write_bytes(get(url))
        markup = page.read_text()
        figures = re.findall(r'<figure\b[^>]*class="[^"]*list-laureate[^>]*>(.*?)</figure>', markup, re.S)
        portraits = []
        for person,figure in zip(prize['laureates'],figures):
            matches = re.findall(r'<img[^>]+src="(https://www.nobelprize.org/[^"]+)"[^>]*alt="([^"]*)"',figure)
            if not matches: raise ValueError('Missing official portrait')
            source,alt = matches[0]
            name = ' '.join(filter(None,[person.get('firstname'),person.get('surname')]))
            # Figure order follows official award order; person identity is also checked in the alt text.
            normalize=lambda v:re.sub(r'[^a-z]','',v.lower())
            if normalize(person.get('surname') or person['firstname']) not in normalize(html.unescape(alt)): raise ValueError(f'Identity mismatch: {name} / {alt}')
            image=f'images/nobel/laureates/{person["id"]}.jpg'; target=repo/'public'/image
            if not target.exists(): target.write_bytes(get(html.unescape(source)))
            credit_match=re.search(r'class="figcaption__attribution"[^>]*>(.*?)</p>',figure,re.S)
            credit=html.unescape(re.sub('<[^>]+>','',credit_match.group(1))).strip() if credit_match else 'NobelPrize.org'
            portraits.append({'id':person['id'],'name':name,'image':image,'source':html.unescape(source),'credit':credit,'page':url,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
        if len(portraits)!=len(prize['laureates']): raise ValueError('Incomplete portraits')
        return year,portraits
    except Exception as error: return year,{'error':str(error)}
awarded=[p for p in prizes if p.get('laureates')]
results={};failures={}
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    for year,result in pool.map(collect,awarded):
        if isinstance(result,list):results[year]=result
        else:failures[year]=result
        print(year,'ok' if isinstance(result,list) else result,flush=True)
previous_path.write_text(json.dumps({**previous,**results},ensure_ascii=False,indent=2)+'\n')
(cache/'failures.json').write_text(json.dumps(failures,indent=2))
if failures: raise SystemExit(f'{len(failures)} annual portrait sets need attention')
