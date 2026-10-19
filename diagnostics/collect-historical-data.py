"""Download public sources with hashes; never treats current data as preseason vintage."""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parent / 'historical-data'
ROOT.mkdir(exist_ok=True)

def retrieve(item):
    name, url = item
    path = ROOT / name
    try:
        if path.exists():
            content=path.read_bytes()
            return {'file':name,'url':url,'bytes':len(content),'sha256':hashlib.sha256(content).hexdigest(),'status':'downloaded','cacheReused':True}
        response = requests.get(url, timeout=45)
        response.raise_for_status()
        path.write_bytes(response.content)
        return {'file':name,'url':url,'bytes':len(response.content),
                'sha256':hashlib.sha256(response.content).hexdigest(),
                'lastModified':response.headers.get('Last-Modified'),'status':'downloaded'}
    except Exception as error:
        return {'file':name,'url':url,'status':'failed','error':str(error)}

sources = [('dynasty-archives.json','https://api.github.com/repos/dynastyprocess/data/contents/files/archives')]
sources.append(('weekly-2021.csv','https://github.com/nflverse/nflverse-data/releases/download/player_stats/player_stats_2021.csv'))
for year in [2022,2023,2024,2025]:
    sources.extend([
        (f'adp-{year}.json',f'https://fantasyfootballcalculator.com/api/v1/adp/ppr?teams=10&year={year}'),
        (f'weekly-{year}.csv',f'https://github.com/nflverse/nflverse-data/releases/download/player_stats/player_stats_{year}.csv'),
        (f'depth-{year}.csv',f'https://github.com/nflverse/nflverse-data/releases/download/depth_charts/depth_charts_{year}.csv')
    ])
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
    results=list(executor.map(retrieve,sources))
(ROOT/'manifest.json').write_text(json.dumps(results,indent=2)+'\n',encoding='utf8')
for row in results: print(row['file'], row['status'],row.get('bytes',row.get('error')))
