"""Compare source titles and market dates without refreshing archived prices.

Run from the repository root. Only an identity-free review is written to /tmp;
the checked-in review must be explicitly inspected before replacement.
"""
import concurrent.futures
import hashlib
import json
import pathlib
import urllib.request
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parents[2]
DATA = ROOT / 'public/data/science-forecasts'


def check(summary):
    event = json.loads((DATA / summary['detailFile']).read_text())
    result = {'id': event['id'], 'sourceApi': event['sourceApi']}
    try:
        request = urllib.request.Request(event['sourceApi'], headers={'User-Agent': 'EcoMOF-AI date review'})
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = response.read()
        current = json.loads(payload)
        result.update(
            sha256=hashlib.sha256(payload).hexdigest(),
            dates=[dict(field=key, archived=event.get(key), current=current.get(key),
                        matches=event.get(key) == current.get(key))
                   for key in ('createdTime', 'closeTime', 'resolutionTime')],
            originalTitleMatches=current['question'] == event['originalTitle'],
            resolutionMatches=current.get('resolution') == event['resolution'],
            currentTitle=current['question'],
        )
    except Exception as error:
        result['error'] = str(error)
    return result


if __name__ == '__main__':
    index = json.loads((DATA / 'index.json').read_text())
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        markets = list(pool.map(check, index['events']))
    review = {'checkedAt': datetime.now(timezone.utc).date().isoformat(), 'markets': markets}
    output = pathlib.Path('/tmp/science-event-date-review.json')
    output.write_text(json.dumps(review, ensure_ascii=False, indent=2) + '\n')
    failures = [row['id'] for row in markets if row.get('error') or not row.get('originalTitleMatches')
                or not row.get('resolutionMatches') or any(not date['matches'] for date in row.get('dates', []))]
    print(f'{len(markets)} markets; {len(failures)} mismatches/errors; review: {output}')
    if failures:
        print(', '.join(failures))
        raise SystemExit(1)
