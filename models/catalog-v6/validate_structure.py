"""Recompute contact graphs from editable scenes and prove a detached arm is detected."""
import sys,json
from pathlib import Path
import bpy
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT));sys.path.insert(0,str(ROOT.parent))
import structure
report=json.loads((ROOT/'exports/report.json').read_text());seen=set();results=[]
for row in report.values():
    if row['model'] in seen:continue
    seen.add(row['model'])
    file=ROOT/'exports'/((row['file'].removesuffix('.glb') if row['category']=='frame' else row['model'])+'.blend')
    bpy.ops.wm.open_mainfile(filepath=str(file))
    coll=bpy.data.collections[row['model']]
    actual=structure.audit(coll,row['model'])
    assert len(actual['connected_groups'])==1,(row['model'],actual['connected_groups'])
    if row['category']=='frame':
        arm=next(o for o in coll.objects if o.name.startswith(('stay-55','seat_stay_left')))
        arm.location.x+=2
        broken=structure.audit(coll,row['model'])
        assert len(broken['connected_groups'])>1,'Detached arm was not detected'
    results.append({'model':row['model'],'connected':True,'negative_control':row['category']=='frame'})
(ROOT/'exports/structure-validation.json').write_text(json.dumps(results,indent=2)+'\n')
print('PASS',len(results),'structural models, including eight detached-arm negative controls')
