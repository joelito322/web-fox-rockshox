"""uv run --with shapely==2.1.2 scripts/prepare-v10-v30-contours.py"""
import json
from pathlib import Path
from shapely.geometry import Polygon
root=Path(__file__).resolve().parents[1];path=root/'models/catalog-v30';data=json.loads((path/'contours.proposal.json').read_text());result={k:v for k,v in data.items() if k not in ['front','rear','upper_link','lower_link']}
for name in ['front','rear','upper_link','lower_link']:
 value=data[name];poly=Polygon(value['outer'],value['holes']).buffer(0)
 if name=='front':poly=poly.buffer(3,quad_segs=4).buffer(-3,quad_segs=4).simplify(.35,preserve_topology=True)
 if poly.geom_type!='Polygon' or not poly.is_valid:raise ValueError(name+' is invalid/disconnected')
 result[name]={'outer':[list(p) for p in list(poly.exterior.coords)[:-1]],'holes':[[list(p) for p in list(r.coords)[:-1]] for r in poly.interiors]}
(path/'contours.json').write_text(json.dumps(result,indent=2)+'\n');print('Prepared V10 contours',[(n,len(result[n]['holes'])) for n in ['front','rear','upper_link','lower_link']])
