"""Model-specific exterior continuity; inferred closures are recorded, never simulated mechanics."""
import json,copy,math
from pathlib import Path
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree
import blender_geometry as G
PROFILES=json.loads((Path(__file__).parent/'structure-profiles.json').read_text())
PAIRS={}

def sections(trace,slug):
    plan=PROFILES[slug];result=[];pairs=[]
    for original in trace['sections']:
        s=copy.deepcopy(original)
        if s['name'] in plan.get('split',[]):
            depth=s['depth_mm'];s['depth_mm']=12;s['z_mm']=depth/2-6
            other=copy.deepcopy(s);other['name']+='__hidden';other['z_mm']=-s['z_mm']
            result.extend([s,other]);pairs.append([s['name'],other['name']])
        elif s['name'] in plan['paired']:
            # Existing side is a plate, not a solid block occupying the shock cavity.
            s['depth_mm']=min(s['depth_mm'],14)
            other=copy.deepcopy(s);other['name']+='__hidden';other['z_mm']=-s['z_mm']
            result.extend([s,other]);pairs.append([s['name'],other['name']])
        else:result.append(s)
    PAIRS[slug]=pairs
    return result

def nearest(objects,point):
    p=G.B(point);candidates=[];deps=bpy.context.evaluated_depsgraph_get()
    for obj in objects:
        if obj.type!='MESH' or obj.hide_render:continue
        evaluated=obj.evaluated_get(deps)
        ok,loc,normal,index=evaluated.closest_point_on_mesh(obj.matrix_world.inverted()@p)
        if ok:
            pos=obj.matrix_world@loc;candidates.append(((pos-p).length,pos))
    if not candidates:raise RuntimeError('No mounting surface')
    distance,point=min(candidates,key=lambda x:x[0])
    return distance,[point.x,point.z,-point.y]

def complete(coll,slug,trace,xy,anchors):
    plan=PROFILES[slug]
    def original(prefix):return [o for o in coll.objects if o.name==prefix or o.name.startswith(prefix+'.') or o.name.startswith(prefix+'__')]
    if 'tie' in plan:
        a,b=[xy(p) for p in plan['tie']]
        for side in [-1,1]:
            G.path('Ransom tie '+str(side),[[*a,side*.041],[*b,side*.041]],.009,'link')
    for index,(a,b) in enumerate(plan.get('fixed_connections',[])):
        a,b=xy(a),xy(b);delta=Vector((b[0]-a[0],b[1]-a[1]));normal=Vector((-delta.y,delta.x)).normalized()*.012
        outline=[[a[0]+normal.x,a[1]+normal.y],[b[0]+normal.x,b[1]+normal.y],[b[0]-normal.x,b[1]-normal.y],[a[0]-normal.x,a[1]-normal.y]]
        for side in [-1,1]:G.prism('Fixed link '+str(index)+' '+str(side),outline,.012,side*.032,'link',.003)
        G.sleeve('Fixed link axle '+str(index),[*a,-.050],[*a,.050],.012,.005,'link')
    # Actual bearing axes close both side plates; they are not decorative discs on one side.
    for index,pixel in enumerate(plan['joints']):
        x,y=xy(pixel)
        G.sleeve('Pivot bearing bridge '+str(index),(x,y,-.053),(x,y,.053),.014,.005,'link')
        for side in [-1,1]:G.sleeve('Pivot outer washer '+str(index),(x,y,side*.051),(x,y,side*.057),.016,.005,'metal')
    rear=anchors['rear_axle'];width=(.157 if slug=='commencal-supreme-dh-v5' else .148)
    # Separate dropouts and bosses keep the entire tyre/hub opening empty.
    for side in [-1,1]:
        G.sleeve('Rear dropout '+str(side),[rear[0],rear[1],side*(width/2-.002)],[rear[0],rear[1],side*(width/2+.014)],.016,.006,'paint')
    for key in ['shock_upper','shock_lower']:
        point=anchors[key]
        if trace.get('hidden_shock'):continue
        prefix=plan['upper_support' if key=='shock_upper' else 'lower_support']
        supports=original(prefix)
        for side in [-1,1]:
            center=[point[0],point[1],side*.021]
            distance,target=nearest(supports,center)
            if distance>.16:raise RuntimeError(f'{slug}: implausible {key} support distance {distance}')
            # Tapered lugs terminate on the actual support surface; thickness remains estimated.
            G.path(key+' support '+str(side),[target,center],.011,'link' if 'link' in prefix or 'rocker' in prefix else 'paint')
            G.sleeve(key+' mounting lug '+str(side),[point[0],point[1],side*.017],[point[0],point[1],side*.026],.014,.004,'link')
        # Visible axle traverses both ears. The selected shock supplies its own eye/bushing.
        G.cyl(key+' through bolt',[point[0],point[1],-.028],[point[0],point[1],.028],.004,'metal',vertices=20)
    # Rear caliper belongs ahead of the rear axle. Keep the brake side asymmetric.
    members=[o for o in coll.objects if o.name.startswith(('stay','chain','seat_stay','chain_stay')) and o.type=='MESH' and 'guard' not in o.name]
    for dx in [.021,.095]:
        point=[rear[0]+dx,rear[1]+.088,-.068]
        distance,target=nearest(members,point)
        G.path('Rear brake carrier '+str(dx),[target,point],.008,'paint')
        G.cyl('Rear brake post '+str(dx),[point[0],point[1]-.012,point[2]],[point[0],point[1]+.004,point[2]],.006,'paint',vertices=20)
    if 'chain_idler' in anchors:
        x,y,_=anchors['chain_idler']
        supports=[o for o in coll.objects if o.type=='MESH' and o.data.materials and o.data.materials[0] in [G.M['paint'],G.M['link']] and not o.name.startswith('Idler')]
        distance,target=nearest(supports,[x,y,.045])
        G.path('Idler fixed carrier',[target,[x,y,.060]],.010,'link')
        G.cyl('Idler bearing axle',[x,y,.047],[x,y,.078],.006,'metal',vertices=24)
    # Rear-triangle front yokes need their transverse webs, not two unrelated 2D arms.
    for prefix in ['stay','chain']:
        members=[o for o in coll.objects if o.name.startswith(prefix) and o.type=='MESH' and 'guard' not in o.name]
        if len(members)<2:continue
        # Use the traced inner/front end: these are forward of the wheel opening, not across its tread.
        first=next(s for s in trace['sections'] if s['name'].startswith(prefix) and 'guard' not in s['name'])
        transformed=[xy(p) for p in first['points']]
        tip=max(transformed,key=lambda p:p[0]);pair=[tip[0]-.006,tip[1]]
        for side in [-1,1]:
            distance,target=nearest(members,[*pair,side*.035])
            # Only a short web at the yoke root; no generic bar crossing the rear wheel.
            G.path(prefix+' yoke web '+str(side),[target,[pair[0],pair[1],0]],.010,'paint')


def audit(coll,slug):
    """Contact graph from evaluated triangle surfaces, including containment, not material grouping."""
    deps=bpy.context.evaluated_depsgraph_get();parts=[]
    for obj in coll.objects:
        if obj.hide_render or obj.name.startswith(('Pivot bolt','Idler tooth')):continue
        mesh=bpy.data.meshes.new_from_object(obj.evaluated_get(deps),depsgraph=deps)
        if not mesh.polygons:bpy.data.meshes.remove(mesh);continue
        vertices=[obj.matrix_world@v.co for v in mesh.vertices]
        tree=BVHTree.FromPolygons(vertices,[tuple(p.vertices) for p in mesh.polygons],all_triangles=False)
        minimum=Vector(tuple(min(v[i] for v in vertices) for i in range(3)));maximum=Vector(tuple(max(v[i] for v in vertices) for i in range(3)))
        parts.append((obj.name,vertices,tree,minimum,maximum));bpy.data.meshes.remove(mesh)
    graph=[set() for _ in parts]
    def inside(tree,point):
        direction=Vector((.713,.337,.616)).normalized();origin=point.copy();count=0
        for _ in range(60):
            location,normal,index,distance=tree.ray_cast(origin,direction)
            if location is None:return count%2==1
            origin=location+direction*.000001;count+=1
        return False
    for i,a in enumerate(parts):
        for j in range(i):
            b=parts[j]
            if any(a[3][k]>b[4][k]+.002 or b[3][k]>a[4][k]+.002 for k in range(3)):continue
            contact=bool(a[2].overlap(b[2]))
            if not contact:
                contact=any((nearest:=b[2].find_nearest(p)) and nearest[3]<.002 for p in a[1][::max(1,len(a[1])//40)])
            if not contact:contact=inside(b[2],a[1][0]) or inside(a[2],b[1][0])
            if contact:graph[i].add(j);graph[j].add(i)
    remaining=set(range(len(parts)));groups=[]
    while remaining:
        stack=[remaining.pop()];group=[]
        while stack:
            n=stack.pop();group.append(parts[n][0]);neighbors=graph[n]&remaining;remaining-=neighbors;stack.extend(neighbors)
        groups.append(group)
    groups.sort(key=len,reverse=True)
    result={'pairs':PAIRS.get(slug,[]),'connected_groups':groups,'surface_contact_tolerance_mm':2,'inferred_closures':PROFILES.get(slug,{}).get('note','Suspension envelope retained; crown/eye continuity completion is estimated.')}
    print('STRUCTURE',slug,json.dumps(result))
    return result
