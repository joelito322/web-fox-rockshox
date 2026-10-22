"""Rebuild per-size frame GLBs from independent reference contours (Blender 4.5).
Outputs never publish the catalog. Source images/contours and uncertainty remain inspectable.
"""
import sys,json,math
from pathlib import Path
import bpy
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent))
sys.path.insert(0,str(ROOT))
import blender_geometry as G
CAT=json.loads((ROOT.parents[1]/'supabase/catalog/visual-v4-reviewed.json').read_text())
OUT=ROOT/'exports';OUT.mkdir(exist_ok=True)
report={}

def clear():
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    for c in list(bpy.data.collections):
        if c.name!='Collection':bpy.data.collections.remove(c)

def export(collection,slug,anchors):
    deps=bpy.context.evaluated_depsgraph_get();groups={};triangles=0
    temp=G.col('export')
    for original in collection.objects:
        if original.hide_render:continue
        mesh=bpy.data.meshes.new_from_object(original.evaluated_get(deps),depsgraph=deps)
        mesh.calc_loop_triangles();triangles+=len(mesh.loop_triangles)
        o=bpy.data.objects.new('evaluated',mesh);temp.objects.link(o);o.matrix_world=original.matrix_world.copy()
        groups.setdefault(tuple(m.name for m in mesh.materials),[]).append(o)
    meshes=[]
    for materials,objects in groups.items():
        bpy.ops.object.select_all(action='DESELECT')
        for o in objects:o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        if len(objects)>1:bpy.ops.object.join()
        obj=bpy.context.view_layer.objects.active;obj.name=slug+'__'+materials[0].split(' · ')[0].lower().replace(' ','_');meshes.append(obj)
    paint=[o.name for o in meshes if o.data.materials[0]==G.M['paint']]
    for name,point in anchors.items():
        empty=bpy.data.objects.new('mount_'+name,None);temp.objects.link(empty);empty.location=G.B(point);meshes.append(empty)
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes:o.select_set(True)
    bpy.context.view_layer.objects.active=meshes[0]
    file=OUT/(slug+'.glb')
    bpy.ops.export_scene.gltf(filepath=str(file),export_format='GLB',use_selection=True,export_apply=True,export_yup=True)
    for o in list(temp.objects):bpy.data.objects.remove(o,do_unlink=True)
    bpy.data.collections.remove(temp)
    return {'file':file.name,'bytes':file.stat().st_size,'triangles':triangles,'meshes':len(groups),'paintable_nodes':paint,'anchors':anchors}

def frame(model,variant):
    clear();slug=model['slug'];d=json.loads((ROOT/'traces'/(slug+'.json')).read_text());points=d['image_landmarks'];spec=variant['specs'];geo=spec['geometry']
    coll=G.col(slug);G.ACTIVE=coll
    bb=points['bottom_bracket'];head=points['head_top'];rear=points['rear_axle']
    # Register the two reference vectors to actual reach/stack and rear axle span.
    chain=geo.get('chainstay_mm',440)/1000
    dy=geo.get('bb_drop_mm', 25 if spec.get('wheel_rear')=='29' else 8)/1000
    rx=-math.sqrt(max(.01,chain*chain-dy*dy))
    hx,hy=geo.get('reach_mm',455)/1000,geo.get('stack_mm',635)/1000
    u=(head[0]-bb[0],bb[1]-head[1]);v=(rear[0]-bb[0],bb[1]-rear[1]);det=u[0]*v[1]-v[0]*u[1]
    def xy(pixel):
        x,y=pixel[0]-bb[0],bb[1]-pixel[1];a=(x*v[1]-v[0]*y)/det;b=(u[0]*y-x*u[1])/det
        return [hx*a+rx*b,hy*a+dy*b]
    for s in d['sections']:
        polygon=[xy(p) for p in s['points']]
        z=s.get('z_mm',0)/1000;centers=None
        if s['name'].startswith(('stay','chain','seat_stay','chain_stay')) and abs(z)>.02:
            side=-1 if z<0 else 1;front=abs(z);rear_width=(.157 if slug=='commencal-supreme-dh-v5' else .148)/2+.006
            centers=[side*(front+(rear_width-front)*min(1,max(0,p[0]/rx))) for p in polygon]
        G.prism(s['name'],polygon,s['depth_mm']/1000,z,s.get('material','paint'),s.get('bevel_mm',4)/1000,centers)
    angle=math.radians(geo.get('head_angle_deg',65));length=geo.get('head_tube_mm',110)/1000
    lower=[hx+length*math.cos(angle),hy-length*math.sin(angle),0];top=[hx,hy,0]
    G.sleeve('Head tube',lower,top,.033,.027,'paint')
    width=spec.get('bb_shell',{}).get('width_mm',73)/1000
    G.sleeve('Pedalier',[0,0,-width/2],[0,0,width/2],.026,.0205,'paint')
    seat=xy(points['seat_top']);base=xy(points.get('seat_pivot',points.get('rocker_pivot',points['seat_top'])))
    # Collar has its own physical slope; never use the effective seat angle for the tube.
    collar=[seat[0]+.008,seat[1]-.035,0]
    G.sleeve('Seat collar',collar,[*seat,0],spec.get('seatpost_diameter_mm',31.6)/2000+.002,spec.get('seatpost_diameter_mm',31.6)/2000,'paint')
    # Bore every intersecting painted volume through the pedalier axis.
    cutter=G.cyl('Bore tool',[0,0,-.18],[0,0,.18],.0205,'metal',vertices=32)
    for o in list(coll.objects):
        if o==cutter or not o.data or o.type!='MESH' or not o.data.materials or o.data.materials[0]!=G.M['paint']:continue
        m=o.modifiers.new('Pedalier opening','BOOLEAN');m.object=cutter;m.operation='DIFFERENCE';m.solver='EXACT'
    cutter.hide_render=True;cutter.hide_set(True)
    if 'shock_mount_bridge' in d:G.path('Shock clevis',[[*xy(p),0] for p in d['shock_mount_bridge']],.006,'link')
    upper=[*xy(points['shock_upper']),0];raw=[*xy(points['shock_lower']),0];direction=(Vector(raw)-Vector(upper)).normalized();eye=spec.get('shock_fit',{}).get('eye_to_eye_mm',230)/1000
    shock_lower=list(Vector(upper)+direction*eye)
    # Keep Ransom's shock in its documented integrated cavity, with opaque exterior shell.
    if d.get('hidden_shock'):upper=[.075,.095,0];shock_lower=[.075-eye,.095,0]
    anchors={'rear_axle':[rx,dy,0],'head_tube':top,'head_tube_lower':lower,'seat_tube':[*seat,0],'shock_upper':upper,'shock_lower':shock_lower,'saddle':[seat[0]-.025,seat[1]+.145,0],'suspension_pivot':[*xy(points.get('seat_pivot',points['shock_lower'])),0]}
    if 'idler_pixel' in d:anchors['chain_idler']=[*xy(d['idler_pixel']),0]
    elif slug=='commencal-supreme-dh-v5':anchors['chain_idler']=[*xy(points['idler']),0]
    for pixel in [points['rear_axle'],points['seat_pivot']]:
        pos=xy(pixel)
        for side in [-1,1]:
            z=.084 if pixel==points['rear_axle'] else .045
            G.cyl('Pivot bolt',[*pos,side*z],[*pos,side*(z+.006)],.006,'metal',vertices=6)
    if 'chain_idler' in anchors:
        x,y,_=anchors['chain_idler'];G.cyl('Idler',[x,y,.064],[x,y,.074],.027,'link')
        for i in range(18):
            a=i*math.tau/18;G.cyl('Idler tooth',[x+.026*math.cos(a),y+.026*math.sin(a),.065],[x+.026*math.cos(a),y+.026*math.sin(a),.073],.0028,'metal',vertices=6)
    name=slug+'--'+str(variant['specs'].get('size_label','')).lower().replace('″','in')
    result=export(coll,name,anchors);result.update({'model':slug,'variant_id':variant['id'],'category':'frame','source_trace':'traces/'+slug+'.json','reference_estimated':True,'anchor_rotations':{'shock_upper':[0,math.radians(d.get('shock_roll_deg',0)),0]}})
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/(name+'.blend')))
    return result

import suspension
saved_models=set()
profiles=json.loads((ROOT/'suspension-profiles.json').read_text())
for model in CAT['components']:
    if model['category'] not in ['frame','fork','shock']:continue
    for variant in CAT['variants']:
        if variant['component_id']!=model['id']:continue
        if model['category']=='frame':
            report[variant['id']]=frame(model,variant)
        else:
            clear();coll=G.col(model['slug']);G.ACTIVE=coll
            profile=profiles[model['slug']]
            anchors=getattr(suspension,model['category'])(variant['specs'],profile)
            name=model['slug']+'--'+variant['id'][:8]
            result=export(coll,name,anchors)
            result.update({'model':model['slug'],'variant_id':variant['id'],'category':model['category'],'source_trace':'suspension-profiles.json','reference_estimated':True})
            report[variant['id']]=result
            bpy.context.preferences.filepaths.save_version=0
            if model['slug'] not in saved_models:
                bpy.ops.wm.save_as_mainfile(filepath=str(OUT/(model['slug']+'.blend')))
                saved_models.add(model['slug'])
(OUT/'manifest.json').write_text(json.dumps(report,indent=2)+'\n')
print('CATALOG EXPORTS',len(report))
