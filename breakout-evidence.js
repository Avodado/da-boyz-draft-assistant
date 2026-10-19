(function(root){
  'use strict';
  const source = 'repository:app.html.gz@8baf033 (Aug. 22 preseason situation inputs; unverified prior)';
  const prior = value => ({value, publishedAt:'2026-08-22',source,quality:'prior'});
  const report = (value,publishedAt,source) => ({value,publishedAt,source,quality:'reported'});
  const rows = [
    ['Omarion Hampton','committee','contested','unknown'],
    ['Cam Skattebo','committee','contested','recovering'],
    ['Quinshon Judkins','starter','unknown','recovering'],
    ['Luther Burden III','starter','contested','recovering'],
    ['Bhayshul Tuten','committee','contested','unknown'],
    ['Kyle Monangai','backup','contested','recovering'],
    ['Jaxson Dart','starter','unknown','unknown'],
    ['Matthew Golden','committee','contested','unknown'],
    ['Cam Ward','starter','unknown','unknown'],
    ['Adonai Mitchell','committee','contested','unknown'],
    ['Travis Hunter','specialist','contested','unknown'],
    ["Tre' Harris",'committee','contested','recovering'],
    ['J.J. McCarthy','backup','contested','recovering'],
    ['Pat Bryant','unknown','contested','unknown'],
    ['Jaylin Noel','reserve','contested','recovering'],
    ['Brashard Smith','reserve','contested','unknown']
  ];
  const evidence = Object.fromEntries(rows.map(([name,role,competition,health])=>[name,{
    role:prior(role),competition:prior(competition),health:prior(health)
  }]));
  evidence['Omarion Hampton'].role=report('committee','2026-07-09','https://www.chargers.com/news/training-camp-preview-omarion-hampton-fantasy');
  evidence['Omarion Hampton'].competition=report('contested','2026-07-09','https://www.chargers.com/news/training-camp-preview-omarion-hampton-fantasy');
  evidence['Cam Skattebo'].competition=report('contested','2026-08-18','https://www.draftsharks.com/fantasy-football-news/82268/najee-harris-to-giants-is-more-about-cam-skattebo-than-harris');
  evidence['Luther Burden III'].health=report('recovering','2026-08-16','https://www.dailyherald.com/20260816/chicago-bears/bears-camp-report-trapilo-returns-to-practice-monangai-hurt/');
  evidence['Kyle Monangai'].health={...evidence['Luther Burden III'].health};
  evidence['Travis Hunter'].role=report('specialist','2026-02-13','https://amp.nfl.com/news/jaguars-still-plan-to-utilize-travis-hunter-as-two-way-player-but-could-flip-usage-to-full-time-cb');
  evidence['J.J. McCarthy'].role=report('backup','2026-08-11','https://www.vikings.com/sitemap/html/articles/2026/8');
  evidence['Jaylin Noel'].health=report('recovering','2026-08-17','https://podcasts.apple.com/gb/podcast/houston-texans-ol-finally-turning-the-corner-ed/id1156158142?i=1000783864306');
  root.DaBoyzBreakoutEvidence={cutoff:'2026-08-28',players:evidence};
})(typeof window!=='undefined'?window:globalThis);
