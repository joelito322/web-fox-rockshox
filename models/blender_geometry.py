"""Shared editable mesh operations. Blender only; no runtime dependency."""
import bpy, math
from mathutils import Vector

def material(name,color,metal=.0,rough=.4):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    return m
M={'paint':material('Frame · satin aluminium',(.61,.64,.59),.68,.34),
   'link':material('Link · black anodised',(.045,.05,.047),.65,.3),
   'rubber':material('Protection · rubber',(.016,.02,.018),0,.72),
   'fork':material('Lowers · gloss black',(.02,.024,.023),.35,.22),
   'gold':material('Stanchions · Kashima',(.68,.42,.13),.82,.23),
   'metal':material('Bolts · machined steel',(.35,.39,.40),.9,.23),
   'blue':material('Adjuster · blue',(.025,.20,.42),.65,.26),
   'red':material('Rebound · red',(.55,.035,.045),.6,.24),
   'spring':material('Coil · black steel',(.025,.03,.028),.7,.25)}

def B(p): return Vector((p[0],-p[2],p[1]))
def col(name):
    c=bpy.data.collections.new(name);bpy.context.scene.collection.children.link(c);return c
ACTIVE=None

def finish(o,name,mat):
    o.name=name
    for c in list(o.users_collection):c.objects.unlink(o)
    ACTIVE.objects.link(o);o.data.materials.append(M[mat])
    return o

def bevel(o,width=.003):
    m=o.modifiers.new('Editable edge radii','BEVEL');m.width=width;m.segments=3
    m=o.modifiers.new('Weighted surface normals','WEIGHTED_NORMAL');m.keep_sharp=True

def prism(name,xy,depth,z=0,mat='paint',radius=.003,centers=None):
    # xy already in metres, build a true closed volume with independently editable side contour.
    n=len(xy);v=[B((x,y,(centers[i] if centers else z)+zz)) for zz in [-depth/2,depth/2] for i,(x,y) in enumerate(xy)]
    faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(v,[],faces);mesh.validate();mesh.update()
    o=bpy.data.objects.new(name,mesh);ACTIVE.objects.link(o);o.data.materials.append(M[mat])
    bevel(o,radius);return o

def cyl(name,a,b,r,mat='metal',r2=None,vertices=40):
    a,b=B(a),B(b);d=b-a
    bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=r,radius2=r if r2 is None else r2,depth=d.length,location=(a+b)/2)
    o=bpy.context.object;o.rotation_euler=d.to_track_quat('Z','Y').to_euler();finish(o,name,mat)
    for p in o.data.polygons:p.use_smooth=len(p.vertices)==4
    bevel(o,min(.001,r*.1));return o

def ring(name,center,axis,radius,tube,mat='paint'):
    bpy.ops.mesh.primitive_torus_add(major_segments=32,minor_segments=8,location=B(center),major_radius=radius,minor_radius=tube)
    o=bpy.context.object;o.rotation_euler=B(axis).to_track_quat('Z','Y').to_euler();finish(o,name,mat)
    for p in o.data.polygons:p.use_smooth=True
    return o

def path(name,points,r,mat):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=12;curve.bevel_depth=r;curve.bevel_resolution=2
    s=curve.splines.new('POLY');s.points.add(len(points)-1)
    for v,p in zip(s.points,points):v.co=(*B(p),1)
    o=bpy.data.objects.new(name,curve);ACTIVE.objects.link(o);o.data.materials.append(M[mat]);return o

def sleeve(name,a,b,outer,inner,mat):
    # Hollow cylinders: avoid solid caps across the head tube and bottom bracket.
    a,b=Vector(a),Vector(b);axis=(b-a).normalized();u=axis.cross(Vector((0,0,1))).normalized()
    if u.length < .5:u=axis.cross(Vector((0,1,0))).normalized()
    v=axis.cross(u);N=48;vs=[]
    for center in [a,b]:
        for r in [outer,inner]:
            for i in range(N):vs.append(B(center+r*(u*math.cos(i*math.tau/N)+v*math.sin(i*math.tau/N))))
    fs=[]
    for i in range(N):
        j=(i+1)%N
        fs.extend([(i,j,2*N+j,2*N+i),(N+j,N+i,3*N+i,3*N+j),(i,N+i,N+j,j),(2*N+j,3*N+j,3*N+i,2*N+i)])
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vs,[],fs);mesh.update()
    o=bpy.data.objects.new(name,mesh);ACTIVE.objects.link(o);o.data.materials.append(M[mat]);bevel(o,.0015)
    return o
