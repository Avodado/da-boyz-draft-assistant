"""Descriptive preseason benchmark, not a replay of missing original breakout ratings."""
import csv
import json
import math
import re
import statistics
import unicodedata
import hashlib
from collections import defaultdict
from pathlib import Path

ROOT=Path(__file__).resolve().parent
DATA=ROOT/'historical-data'
POSITIONS={'QB','RB','WR','TE'}
ALIASES={'hollywoodbrown':'marquisebrown','kennygainwell':'kennethgainwell','kennethwalker':'kenwalker','gabrieldavis':'gabedavis','joshuapalmer':'joshpalmer',
         'mitchelltrubisky':'mitchtrubisky','jefferywilson':'jeffwilson','williamfuller':'willfuller',
         'chigoziemokonkwo':'chigokonkwo','joshuaallen':'joshallen','patrickmahomesii':'patrickmahomes',
         'calvinaustin':'calvinaustin','nathanielldell':'tankdell'}
def key(name):
    name=unicodedata.normalize('NFKD',name).encode('ascii','ignore').decode().lower()
    name=re.sub(r'\b(jr|sr|ii|iii|iv)\b','',name)
    name=re.sub('[^a-z0-9]','',name)
    return ALIASES.get(name,name)

def ranks(items,value,reverse=False):
    ordered=sorted(items,key=value,reverse=reverse)
    result={};i=0
    while i<len(ordered):
        j=i+1
        while j<len(ordered) and value(ordered[j])==value(ordered[i]):j+=1
        for row in ordered[i:j]:result[row['key']]=(i+1+j)/2
        i=j
    return result

def correlation(xs,ys):
    if len(xs)<3 or len(set(xs))<2 or len(set(ys))<2:return None
    return statistics.correlation(xs,ys)

def analyze(season):
    source=json.loads((DATA/f'adp-{season}.json').read_text())
    meta=source['meta'];cutoff=meta['end_date']
    kickoff={2022:'2022-09-08',2023:'2023-09-07',2024:'2024-09-05'}[season]
    assert cutoff<kickoff,'ADP window includes regular season'
    ecr={};ambiguous=set()
    with (DATA/f'ecr-{season}.csv').open(encoding='utf8') as f:
        for row in csv.DictReader(f):
            if row['page_type']!='redraft-overall' or row['fp_page']!='/nfl/rankings/ppr-cheatsheets.php':continue
            if row['pos'] not in POSITIONS or row['scrape_date']>cutoff:continue
            k=(key(row['player']),row['pos'])
            if k in ecr and ecr[k]['id']!=row['id']:ambiguous.add(k)
            ecr[k]=row
    prior={}
    with (DATA/f'weekly-{season-1}.csv').open(encoding='utf8') as f:
        for row in csv.DictReader(f):
            if row['season_type']!='REG' or row['position'] not in POSITIONS:continue
            k=(key(row['player_display_name']),row['position'])
            value=prior.setdefault(k,{'ppr':0,'statGames':0,'carries':0,'targets':0})
            value['ppr']+=float(row['fantasy_points_ppr'] or 0);value['statGames']+=1
            value['carries']+=int(row['carries'] or 0);value['targets']+=int(row['targets'] or 0)
    outcomes={}
    with (DATA/f'weekly-{season}.csv').open(encoding='utf8') as f:
        for row in csv.DictReader(f):
            if row['season_type']!='REG' or not 1<=int(row['week'])<=17 or row['position'] not in POSITIONS:continue
            k=(key(row['player_display_name']),row['position'])
            result=outcomes.setdefault(k,{'points':0,'ids':set(),'games':0})
            result['points']+=float(row['fantasy_points_ppr'] or 0)
            result['ids'].add(row['player_id']);result['games']+=1
    cohort=[];unmatched=[]
    for row in source['players']:
        if row['position'] not in POSITIONS or float(row['adp'])>180:continue
        k=(key(row['name']),row['position'])
        if k in ambiguous:
            unmatched.append({'name':row['name'],'position':row['position'],'reason':'AMBIGUOUS_ECR_IDENTITY'});continue
        if k not in ecr:
            unmatched.append({'name':row['name'],'position':row['position'],'reason':'ECR_UNMATCHED'});continue
        if k not in outcomes:
            unmatched.append({'name':row['name'],'position':row['position'],'reason':'OUTCOME_ABSENT_REQUIRES_ZERO_GAME_VERIFICATION'});continue
        assert len(outcomes[k]['ids'])==1,'Ambiguous outcome identity'
        cohort.append({'key':k[0]+'|'+k[1],'name':row['name'],'position':row['position'],
            'adp':float(row['adp']),'ecr':float(ecr[k]['ecr']),'ecrDate':ecr[k]['scrape_date'],
            'points':round(outcomes[k]['points'],2),'statGames':outcomes[k]['games'],
            'priorSeasonProduction':prior.get(k),
            'preseasonRole':None,'preseasonHealth':None,'preseasonCompetition':None,
            'originalBreakoutScore':None,'originalBustScore':None})
    positions={}
    for pos in sorted(POSITIONS):
        group=[p for p in cohort if p['position']==pos]
        observed=ranks(group,lambda x:x['points'],True)
        models={}
        for name,field in [('ADP','adp'),('PPR_ECR','ecr')]:
            predicted=ranks(group,lambda x:x[field])
            errors=[abs(predicted[p['key']]-observed[p['key']]) for p in group]
            top=min({'QB':10,'RB':20,'WR':20,'TE':10}[pos],len(group))
            selected=sorted(group,key=lambda p:p[field])[:top]
            models[name]={'spearman':correlation([predicted[p['key']] for p in group],[observed[p['key']] for p in group]),
                'meanAbsolutePositionRankError':statistics.mean(errors),
                'topN':top,'topNMeanPPR':statistics.mean(p['points'] for p in selected)}
            for p in group:p[name+'Rank']=predicted[p['key']]
        for p in group:p['actualCohortPositionRank']=observed[p['key']]
        positions[pos]={'n':len(group),'models':models}
    return {'season':season,'cutoff':cutoff,'adpMetadata':meta,'n':len(cohort),
        'positions':positions,'unmatched':unmatched,'cohort':cohort}

def main():
    downloads=json.loads((DATA/'manifest.json').read_text())
    rankings=json.loads((DATA/'rankings-manifest.json').read_text())
    for row in downloads+rankings:
        if row.get('status')=='failed':continue
        assert hashlib.sha256((DATA/row['file']).read_bytes()).hexdigest()==row['sha256'], 'Source hash mismatch'
    for row in rankings:
        assert row['committedAt'][:10]<=row['cutoff'], 'Ranking commit is after cutoff'
    result={'scope':'ADP<=180 QB/RB/WR/TE; common matched cohort; REG weeks 1-17 PPR',
        'years':[analyze(y) for y in [2022,2023,2024]],
        'originalModel':{'status':'NOT_IDENTIFIABLE','reason':'Historical provisional breakout, bust, environment, situation, confidence and draft-state inputs were never supplied; code consumes scores but does not generate them.'},
        'researchModel':{'status':'NO_NUMERICAL_PREDICTION','reason':'Shadow annotations do not reorder players; no calibrated downside penalty or predicted probability exists.'},
        'limitations':['Not a breakout-model performance test. ECR is an external benchmark, not the original app.',
            '12-team ADP returned by provider despite 10-team request; results do not claim 10-team calibration.',
            'Outcomes are restricted to matched drafted cohort; missing zero-game players are reported, not silently dropped.',
            'Historical regular-season depth charts are excluded because their preseason vintage cannot be verified.',
            '2025 depth file contains 2026 timestamps; excluded. 2025 outcome URL unavailable.',
            'Preseason provenance is supported by source metadata and Git commit dates, not immutable contemporary capture of ADP.',
            'No trained model, significance claim, or weight tuning; 2022-24 are descriptive benchmark seasons.'],
        'liveAlgorithmChanged':False,'breakoutWeightsChanged':False}
    result['provenance']={'downloads':downloads,'rankingSnapshots':rankings}
    for year in result['years']:
        year['weightedMeanAbsolutePositionRankError']={model:sum(p['n']*p['models'][model]['meanAbsolutePositionRankError'] for p in year['positions'].values())/year['n'] for model in ['ADP','PPR_ECR']}
    (ROOT/'historical-benchmark-results.json').write_text(json.dumps(result,indent=2)+'\n')
    for year in result['years']:
        print(year['season'],year['n'],'matched;',len(year['unmatched']),'unmatched')
        for pos,p in year['positions'].items():
            print(pos,p['n'],{m:round(v['meanAbsolutePositionRankError'],2) for m,v in p['models'].items()})
        print('UNMATCHED',year['unmatched'])

if __name__=='__main__':main()
