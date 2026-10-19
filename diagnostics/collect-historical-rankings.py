import hashlib
import json
from pathlib import Path
import requests

root=Path(__file__).resolve().parent/'historical-data'
manifest=[]
for year in [2022,2023,2024]:
    adp=json.loads((root/f'adp-{year}.json').read_text())
    cutoff=adp['meta']['end_date']
    api='https://api.github.com/repos/dynastyprocess/data/commits'
    r=requests.get(api,params={'path':'files/db_fpecr_latest.csv','until':cutoff+'T23:59:59Z','per_page':1},timeout=30)
    r.raise_for_status()
    commit=r.json()[0]
    sha=commit['sha']
    url=f'https://raw.githubusercontent.com/dynastyprocess/data/{sha}/files/db_fpecr_latest.csv'
    r=requests.get(url,timeout=30);r.raise_for_status()
    name=f'ecr-{year}.csv';(root/name).write_bytes(r.content)
    manifest.append({'season':year,'cutoff':cutoff,'commit':sha,'committedAt':commit['commit']['committer']['date'],
        'url':url,'file':name,'sha256':hashlib.sha256(r.content).hexdigest()})
    print(year,cutoff,sha,len(r.content))
(root/'rankings-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
