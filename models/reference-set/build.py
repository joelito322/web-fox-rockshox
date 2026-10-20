"""Blender 4.5 LTS: rebuild the editable reference candidate and metre/Y-up GLBs.
Run: blender --background --python models/reference-set/build.py
No catalog/database publication. Traces and estimated widths remain editable.
"""
import bpy, json, math
from pathlib import Path
from mathutils import Vector, Matrix
ROOT=Path(__file__).resolve().parent
D=json.loads((ROOT/'supreme-v5-trace.json').read_text())
OUT=ROOT/'exports';OUT.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for c in list(bpy.data.collections):
    if c.name != 'Collection': bpy.data.collections.remove(c)

import sys
sys.path.insert(0,str(ROOT.parent))
import blender_geometry as G
from blender_geometry import B, M, material, col, finish, bevel, prism, cyl, ring, path, sleeve

def pixel(p,z=0):
    o=D['calibration']['origin_pixel'];s=D['calibration']['pixels_per_meter']
    return [(p[0]-o[0])/s,(o[1]-p[1])/s,z]
FRAME=col('Frame · SUPREME DH V5 candidate');FORK=col('Fork · FOX 40 MY27 candidate');SHOCK=col('Shock · Bomber CR 250x75 candidate')
G.ACTIVE=FRAME

for s in D['sections']:
    xy=[pixel(p)[:2] for p in s['points']]
    centers=None
    if 'center_z_profile_mm' in s:
        (x0,z0),(x1,z1)=s['center_z_profile_mm'];side=-1 if s.get('z_mm',0)<0 else 1
        centers=[side*(z0+(z1-z0)*min(1,max(0,(p[0]-x0)/(x1-x0))))/1000 for p in s['points']]
    prism(s['name'],xy,s['depth_mm']/1000,s.get('z_mm',0)/1000,s.get('material','paint'),s['bevel_mm']/1000,centers)
L={k:pixel(v) for k,v in D['landmarks'].items()}
sleeve('Head tube · open ZS56',L['head_bottom'],L['head_top'],.033,.028,'paint')
sleeve('Bottom bracket · open PF107',[0,0,-.0535],[0,0,.0535],.026,.0205,'paint')
cutter=cyl('PF107 bore tool',[0,0,-.15],[0,0,.15],.0205,'metal',vertices=48)
for name in ['down_tube','seat_yoke_left','seat_yoke_right']:
    o=bpy.data.objects.get(name)
    m=o.modifiers.new('Pedalier opening','BOOLEAN');m.operation='DIFFERENCE';m.solver='EXACT';m.object=cutter
cutter.hide_render=True;cutter.hide_set(True)
# Physical seat tube slope follows the drawing, NOT the effective seat angle.
seat=L['seat_top'];end=pixel([568,504]);sleeve('Seat tube · open collar',end,seat,.019,.0158,'paint')
for key in ['rear_axle','seat_pivot','rocker_pivot','lower_pivot']:
    x,y,_=L[key]
    for side in [-1,1]:
        z=side*(.092 if key=='rear_axle' else .042)
        cyl(key+' bearing',(x,y,z-side*.003),(x,y,z+side*.003),.010,'link')
        cyl(key+' bolt',(x,y,z),(x,y,z+side*.005),.0055,'metal',vertices=6)
# Bridge across the rear stays and textured guard ribs.
for p1,p2,r in [(pixel([230,741],-.064),pixel([230,741],.064),.010),(pixel([230,645],-.053),pixel([230,645],.053),.010)]:cyl('Rear bridge',p1,p2,r,'paint')
for i in range(15):
    x=-.36+i*.016
    cyl('Chain guard rib',(x,.007,.063),(x,.007,.091),.002,'rubber',vertices=12)

# Fork is stored in its own mount coordinates: origin = lower crown steering axis,
# +Y up the steerer, +X forward offset, +/-Z legs. Photo-based exterior estimates.
G.ACTIVE=FORK
for z in [-.078,.078]:
    cyl('Stanchion · 40 mm',(0,-.255,z),(0,.155,z),.020,'gold')
    cyl('Wiper seal',(0,-.258,z),(0,-.238,z),.0265,'rubber')
    cyl('Lower leg · tapered',(0,-.587,z),(0,-.255,z),.022,'fork',r2=.025)
    cyl('Dropout',(0,-.588,z),(.052,-.602,z),.021,'fork')
    sleeve('Axle clamp',(.052,-.602,z-.017),(.052,-.602,z+.017),.017,.010,'fork')
    cyl('Foot adjuster',(0,-.602,z),(0,-.624,z),.008,'red' if z<0 else 'link')
    for y in [-.542,-.564]:cyl('Pinch bolt',(.045,y,z+.016),(.045,y,z+.021),.003,'metal',vertices=6)
    cyl('Steering bumper',(0,.062,z),(0,.074,z),.024,'rubber')
    cyl('Top cap',(0,.155,z),(0,.163,z),.017,'blue' if z<0 else 'link')
    for i in range(8):
        ang=i*math.tau/8
        cyl('Adjuster grip',(.012*math.cos(ang),.161,z+.012*math.sin(ang)),(.012*math.cos(ang),.164,z+.012*math.sin(ang)),.0025,'blue' if z<0 else 'link',vertices=10)
# Distinct arched bridge, including the web and return around the tyre opening.
arch_pixels=[(250,350),(253,336),(272,321),(298,309),(337,308),(363,321),(385,339),(391,356),(374,361),(359,341),(344,332),(324,329),(302,332),(286,341),(272,360),(256,363)]
arch=prism('Lower arch · traced casting', [((x-320)/650,(194-y)/650) for x,y in arch_pixels],.022,0,'fork',.003)
arch.rotation_euler.z=math.pi/2;arch.location=B((.025,0,0))
for yy in [-.006,.142]:
    path('Crown · swept forging',[(0,yy,-.09),(-.006,yy,-.078),(-.018,yy-.009,-.04),(-.018,yy-.01,0),(-.018,yy-.009,.04),(-.006,yy,.078),(0,yy,.09)],.013,'fork')
    for z in [-.078,.078]:
        cyl('Crown clamp',(0,yy-.012,z),(0,yy+.012,z),.0255,'fork')
        cyl('Clamp fastener',(.020,yy,z-.009),(.025,yy,z-.009),.004,'metal',vertices=6)
cyl('Steerer · 1 1/8 inch',(0,-.014,0),(0,.258,0),.0142875,'link')
cyl('Axle · 20 mm',(.052,-.602,-.105),(.052,-.602,.105),.010,'metal')
# Rear brake posts and bleeders, rather than a solid rectangle replacing the casting.
for y in [-.49,-.565]:
    cyl('Post mount',(-.012,y,.078),(-.038,y,.078),.008,'fork')
for z in [-.078,.078]:cyl('Pressure bleeder',(-.023,-.26,z),(-.03,-.26,z),.006,'metal')

# Shock local origin = upper eye, -Y toward lower eye, +X reservoir side.
G.ACTIVE=SHOCK
sleeve('Upper eye', [0,0,-.012],[0,0,.012],.012,.006,'link')
sleeve('Lower eye', [0,-.25,-.012],[0,-.25,.012],.012,.006,'link')
for yy in [0,-.25]:
    sleeve('Eye bushing',[0,yy,-.0125],[0,yy,.0125],.0085,.006,'gold')
cyl('Damper body',(0,-.025,0),(0,-.147,0),.017,'link')
cyl('Piston rod',(0,-.11,0),(0,-.237,0),.007,'metal')
cyl('Preload thread',(0,-.025,0),(0,-.076,0),.019,'link')
for i in range(17):ring('Preload thread crest',(0,-.025-i*.0028,0),(0,1,0),.019,.0006,'metal')
cyl('Preload collar',(0,-.068,0),(0,-.077,0),.030,'link')
cyl('Spring seat',(0,-.222,0),(0,-.230,0),.029,'link')
pts=[]
for i in range(321):
    t=i/320;angle=t*7*math.tau;pts.append((.026*math.cos(angle),-.078-.14*t,.026*math.sin(angle)))
path('Coil · seven active turns',pts,.0043,'spring')
# Asymmetric upper yoke and parallel piggyback, traced from the Bomber CR side photo.
prism('Reservoir yoke',[(-.012,-.012),(.014,-.005),(.041,-.026),(.055,-.035),(.056,-.049),(.039,-.050),(.016,-.032),(-.014,-.032)],.025,0,'link',.003)
cyl('Piggyback body',(.047,-.042,0),(.047,-.126,0),.018,'link')
cyl('Reservoir top',(.047,-.04,0),(.047,-.054,0),.019,'link')
cyl('Compression knob',(.047,-.032,0),(.047,-.04,0),.011,'blue')
cyl('Reservoir bottom',(.047,-.121,0),(.047,-.128,0),.016,'link')
cyl('Rebound knob',(.010,-.234,0),(.018,-.234,0),.007,'red')

# Preserve separately editable collections in .blend; export evaluated meshes as GLB.
report={'status':'candidate_for_visual_review','blender':bpy.app.version_string,'parts':{}}
for c,file in [(FRAME,'supreme-v5'),(FORK,'fox-40-my27'),(SHOCK,'bomber-cr-250')]:
    deps=bpy.context.evaluated_depsgraph_get();groups={};tris=0
    temp=col('Export temporary')
    for original in c.objects:
        if original.hide_render:continue
        mesh=bpy.data.meshes.new_from_object(original.evaluated_get(deps),preserve_all_data_layers=True,depsgraph=deps)
        mesh.calc_loop_triangles();tris+=len(mesh.loop_triangles)
        obj=bpy.data.objects.new('Export evaluated',mesh);temp.objects.link(obj);obj.matrix_world=original.matrix_world.copy()
        groups.setdefault(tuple(m.name for m in mesh.materials),[]).append(obj)
    merged=[]
    for materials,objects in groups.items():
        bpy.ops.object.select_all(action='DESELECT')
        for o in objects:o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        if len(objects)>1:bpy.ops.object.join()
        result=bpy.context.view_layer.objects.active
        result.name=file+'__'+materials[0].split(' · ')[0].lower().replace(' ','_')
        merged.append(result)
    anchors = L if c == FRAME else ({'lower_crown':[0,0,0],'axle':[.052,-.602,0],'upper_crown':[0,.142,0]} if c == FORK else {'upper_eye':[0,0,0],'lower_eye':[0,-.25,0]})
    for name,position in anchors.items():
        empty=bpy.data.objects.new('mount_'+name,None);temp.objects.link(empty);empty.location=B(position)
        empty['estimated']=True
        merged.append(empty)
    bpy.ops.object.select_all(action='DESELECT')
    for o in merged:o.select_set(True)
    bpy.context.view_layer.objects.active=merged[0]
    bpy.ops.export_scene.gltf(filepath=str(OUT/(file+'.glb')),use_selection=True,export_format='GLB',export_yup=True,export_apply=True,export_extras=True,export_materials='EXPORT')
    report['parts'][file]={'bytes':(OUT/(file+'.glb')).stat().st_size,'triangles':tris,'editable_objects':len(c.objects),'render_meshes':len(groups)}
    for o in list(temp.objects):bpy.data.objects.remove(o,do_unlink=True)
    bpy.data.collections.remove(temp)
# Compose the .blend for inspection without baking the separate exports' origins.
angle=math.radians(26.7);head=L['head_bottom']
for o in FORK.objects:
    m=o.matrix_world.copy()
    # B(Rz * sceneVector) = rotation about Blender Y by -angle.
    rot=Matrix.Rotation(-angle,4,'Y')
    o.matrix_world=Matrix.Translation(B(head)) @ rot @ m
# The known length is imposed; lower mounting position remains an estimated landmark.
a=Vector(L['shock_upper']);b=Vector(L['shock_lower']);direction=(b-a).normalized()
shock_angle=math.atan2(direction.x,-direction.y)
for o in SHOCK.objects:
    o.matrix_world=Matrix.Translation(B(a)) @ Matrix.Rotation(-shock_angle,4,'Y') @ o.matrix_world
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'reference-set.blend'))
(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
