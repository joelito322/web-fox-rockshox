"""Offline polygon union. uv run --with shapely==2.1.2 scripts/prepare-tues-v28-contours.py"""
import json
from pathlib import Path
from shapely.geometry import Polygon, box
from shapely.ops import unary_union
root=Path(__file__).resolve().parents[1]
read=lambda name:json.loads((root/'models/catalog-v28'/name).read_text())
f=read('front-contours.proposal.json');r=read('rear-contours.proposal.json')
polys={c['name']:Polygon([[x*2048/2300,y*2048/2300] for x,y in c['outer']]).buffer(0) for c in r['contours']}
# The upper Y is observed more directly than the largely occluded rear proposal upper seat edge.
spine=polys['seat_tube_front_triangle'].intersection(box(0,540,2300,1400))
# BB outer wrap is inferred behind cranks; keeps the photographed front bay open.
wrap=Polygon([[818,790],[838,775],[867,772],[905,775],[913,787],[899,812],[875,838],[835,841],[817,825]])
front=unary_union([Polygon(f['upper_y_polygon']),Polygon(f['downtube_polygon']),spine,wrap]).buffer(0)
# Close acute concave slivers before beveling; remove subpixel noise without changing observed long edges.
front=front.buffer(7,quad_segs=4).buffer(-7,quad_segs=4).simplify(.8,preserve_topology=True)
upper=unary_union([polys['seat_stay'],polys['dropout_connection']]).buffer(0)
def capture(poly):
 if poly.geom_type!='Polygon':raise ValueError('Disconnected traced body: '+poly.geom_type)
 return dict(outer=[list(p) for p in list(poly.exterior.coords)[:-1]],holes=[[list(p) for p in list(r.coords)[:-1]] for r in poly.interiors])
data=dict(coordinate_space=f['coordinate_space'],front=capture(front),upper_rear=capture(upper),lower_rear=capture(polys['chain_stay']),flip_link=capture(polys['flip_link']),lower_support=capture(polys['lower_shock_support']),notes=['Planar unions only within fixed front or upper rear body; no runtime CSG.','BB wrap hidden by crank is inferred; front/rear source contours and occlusions retained separately.'])
(root/'models/catalog-v28/contours.json').write_text(json.dumps(data,indent=2)+'\n')
print('Prepared5 traced body contours', {n:len(data[n]['outer']) for n in ['front','upper_rear','lower_rear','flip_link','lower_support']})
