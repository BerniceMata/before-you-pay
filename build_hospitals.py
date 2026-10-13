"""Split the CMS Hospital General Information CSV into per-state JSON for the browser: python build_hospitals.py"""
import csv, json
from collections import defaultdict
from pathlib import Path
rows = list(csv.DictReader(open('data/Hospital_General_Information.csv', encoding='utf-8-sig')))
kind = lambda o: 'nonprofit' if o.startswith('Voluntary non-profit') else 'for-profit' if o in ('Proprietary', 'Physician') else 'government'
by = defaultdict(list)
for r in rows:
    by[r['State']].append([r['Facility Name'].title(), r['City/Town'].title(), kind(r['Hospital Ownership']), r['Telephone Number'], r['Hospital Type']])
out = Path('web/hospitals'); out.mkdir(exist_ok=True)
for st, lst in by.items():
    (out / f'{st}.json').write_text(json.dumps(sorted(lst), separators=(',', ':')), encoding='utf-8')
print(len(rows), 'hospitals,', len(by), 'states')
