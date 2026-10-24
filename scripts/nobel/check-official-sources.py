"""Fetch official annual sources for editorial review; retain metadata, not article copies."""
import concurrent.futures, subprocess, json, re, html, pathlib, hashlib, datetime
repo = pathlib.Path(__file__).resolve().parents[2]
cache = pathlib.Path('/tmp/ecomof-nobel-sources'); cache.mkdir(exist_ok=True)
prizes = json.loads((repo/'scripts/nobel/official-prizes.json').read_text())['prizes']
def clean(raw):
    match = re.search(r'<article[^>]*entry-content[^>]*>(.*?)</article>', raw, re.S)
    if not match: return []
    article = re.sub(r'<select.*?</select>', '', match[1], flags=re.S)
    return [re.sub(r'\s+', ' ', html.unescape(re.sub('<[^>]+>', '', part))).strip() for part in re.findall(r'<(?:p|h[1-4])\b[^>]*>(.*?)</(?:p|h[1-4])>', article, re.S)]
def fetch(prize):
    year = int(prize['year'])
    for kind in (['popular-information', 'press-release', 'ceremony-speech', 'summary'] if year>=1995 else ['ceremony-speech','press-release','summary']):
        url=f'https://www.nobelprize.org/prizes/chemistry/{year}/{kind}/'
        path=cache/f'{year}-{kind}.html'
        result=subprocess.run(['curl','-L','--fail','-s','--max-time','25',url,'-o',str(path)],capture_output=True)
        if result.returncode: continue
        raw=path.read_text(errors='replace'); paragraphs=[p for p in clean(raw) if len(p)>35]
        if len(' '.join(paragraphs))>450:
            record={'year':year,'kind':kind,'url':url,'checked':datetime.date.today().isoformat(),'sha256':hashlib.sha256(raw.encode()).hexdigest(),'characters':sum(map(len,paragraphs))}
            (cache/f'{year}.json').write_text(json.dumps({**record,'paragraphs':paragraphs},ensure_ascii=False))
            return record
    raise RuntimeError(f'No usable official source: {year}')
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    records=[]
    for result in pool.map(fetch,[p for p in prizes if p.get('laureates')]):
        records.append(result); print(result['year'],result['kind'],flush=True)
(repo/'scripts/nobel/source-audit.json').write_text(json.dumps(sorted(records,key=lambda r:r['year']),indent=2)+'\n')
