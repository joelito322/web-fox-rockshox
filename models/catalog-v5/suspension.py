"""Exterior suspension profiles, in metres. All unknown widths are visual estimates."""
import math
import blender_geometry as G

ARCHES={
 'fox40':[(-1,-.04),(-1.02,-.022),(-.78,.002),(-.37,.02),(.32,.021),(.74,.003),(1.02,-.022),(1.08,-.049),(.82,-.054),(.59,-.024),(.31,-.01),(0,-.006),(-.31,-.01),(-.58,-.024),(-.8,-.054),(-1,-.057)],
 'fox38':[(-1,-.036),(-.91,-.008),(-.6,.024),(-.27,.035),(.27,.035),(.6,.024),(.91,-.008),(1,-.036),(.78,-.041),(.58,-.009),(.27,.01),(-.27,.01),(-.58,-.009),(-.78,-.041)],
 'rxf38':[(-1,-.025),(-.87,.006),(-.58,.024),(-.27,.03),(.27,.03),(.58,.024),(.87,.006),(1,-.025),(.79,-.031),(.62,-.006),(.28,.009),(-.28,.009),(-.62,-.006),(-.79,-.031)],
 'zeb':[(-1,-.04),(-1.08,-.011),(-.76,.034),(-.5,.046),(.5,.046),(.87,.015),(1.05,-.023),(.87,-.037),(.59,.014),(.38,.019),(-.36,.019),(-.56,.007),(-.79,-.045)],
 'z1':[(-1,-.039),(-1,-.009),(-.67,.037),(-.4,.038),(.58,.031),(1,-.016),(.94,-.039),(.75,-.025),(.49,.008),(-.38,.014),(-.57,.008),(-.78,-.039)]}

def fork(spec,p):
    radius=p['diameter']/2000;spacing=p['leg_spacing']/2000;travel=spec.get('travel_mm',170)/1000
    length=spec.get('axle_to_crown_mm',spec.get('travel_mm',170)+(399 if p['dual'] else 409))/1000
    offset=spec.get('offset_mm',52 if p['dual'] else 44)/1000
    seal=-(travel+.042);bottom=-length;cap=.155 if p['dual'] else -.002
    for z in [-spacing,spacing]:
        G.cyl('Stanchion',(0,seal-.01,z),(0,cap,z),radius,p['stanchion'],vertices=32)
        G.cyl('Wiper',(0,seal-.009,z),(0,seal+.008,z),radius+.006,'rubber',vertices=32)
        G.cyl('Lower leg',(0,bottom+.018,z),(0,seal-.008,z),radius+.003,'paint',r2=p['lower_radius']/1000,vertices=32)
        G.cyl('Cast dropout',(0,bottom+.025,z),(offset,bottom,z),radius+.002,'paint',vertices=24)
        G.sleeve('Axle clamp',(offset,bottom,z-.018),(offset,bottom,z+.018),.017,.010 if p['dual'] else .0075,'paint')
        G.cyl('Rebound cap',(0,bottom-.001,z),(0,bottom-.018,z),.007,'red' if z>0 else 'link',vertices=16)
        G.cyl('Top cap',(0,cap,z),(0,cap+.008,z),radius*.78,'blue' if z>0 else ('gold' if p['arch']=='rxf38' else 'link'),vertices=24)
        if p['dual']:G.cyl('Steering bumper',(0,.065,z),(0,.078,z),radius+.004,'rubber',vertices=24)
    arch=G.prism('Distinct bridge',[(x*spacing,seal+.032+y) for x,y in ARCHES[p['arch']]],.023,0,'paint',.003)
    arch.rotation_euler.z=math.pi/2;arch.location=G.B((.026,0,0))
    for y in ([-.006,.142] if p['dual'] else [-.007]):
        crown=[(-.012,y,-spacing-.009),(-.018,y,-spacing*.6),(-.025,y+.006,0),(-.018,y,spacing*.6),(-.012,y,spacing+.009)]
        G.path('Forged crown',crown,.014,p['crown'])
        for z in [-spacing,spacing]:G.cyl('Crown clamp',(0,y-.013,z),(0,y+.012,z),radius+.005,p['crown'],vertices=24)
    G.cyl('Steerer',(0,-.014,0),(0,.16,0),.0142875,'link',vertices=24)
    G.cyl('Axle',(offset,bottom,-spacing-.023),(offset,bottom,spacing+.023),.010 if p['dual'] else .0075,'metal',vertices=24)
    for y in [bottom+.045,bottom+.119]:G.cyl('Brake post',(-.01,y,-spacing),(-.035,y,-spacing),.007,'paint',vertices=16)
    return {'lower_crown':[0,0,0],'upper_crown':[0,.142,0] if p['dual'] else [0,0,0],'axle':[offset,bottom,0]}

def shock(spec,p):
    eye=spec['eye_to_eye_mm']/1000;stroke=spec.get('stroke_mm',65)/1000
    trunnion=spec.get('mount_standard',{}).get('upper',{}).get('type','').lower()=='trunnion'
    if trunnion:
        G.cyl('Trunnion axis',[0,0,-.027],[0,0,.027],.008,'metal',vertices=24)
        G.cyl('Trunnion head',[0,-.018,0],[0,.008,0],.023,'link',vertices=32)
    else:
        G.sleeve('Upper eye',[0,0,-.012],[0,0,.012],.012,.006,'link')
        G.sleeve('Upper bushing',[0,0,-.0125],[0,0,.0125],.0085,.006,'gold')
    G.sleeve('Lower eye',[0,-eye,-.012],[0,-eye,.012],.012,.006,'link')
    G.sleeve('Lower bushing',[0,-eye,-.0125],[0,-eye,.0125],.0085,.006,'gold')
    body=p['body_radius']/1000
    G.cyl('Damper body',(0,-.025,0),(0,-eye+.04,0),body,'link',vertices=32)
    G.cyl('Piston rod',(0,-eye+stroke+.03,0),(0,-eye+.013,0),.007,'metal',vertices=24)
    if p['spring']=='coil':
        start=.055 if eye<.21 else .068;end=eye-.027;coil_radius=body+.009
        G.cyl('Preload thread',(0,-.018,0),(0,-start,0),body+.002,'link',vertices=32)
        for i in range(10):G.ring('Preload thread crest',(0,-.022-i*(start-.022)/10,0),(0,1,0),body+.002,.0005,'metal')
        for y in [-start,-end]:G.cyl('Spring seat',(0,y-.003,0),(0,y+.003,0),coil_radius+.005,'link',vertices=32)
        pts=[]
        for i in range(241):
            t=i/240;a=t*p['turns']*math.tau;pts.append((coil_radius*math.cos(a),-start-(end-start)*t,coil_radius*math.sin(a)))
        G.path('Coil',pts,.0042,p['coil_color'])
    else:
        G.cyl('Exposed gold air shaft',(0,-.025,0),(0,-eye*.48,0),.018,'gold',vertices=32)
        G.cyl('Air sleeve',(0,-eye*.48,0),(0,-eye+.025,0),body,'paint',vertices=40)
        for y in [-eye*.49,-eye+.031]:G.cyl('Air sleeve collar',(0,y-.004,0),(0,y+.004,0),body+.002,'link',vertices=32)
    x=p['reservoir_x']/1000;length=p['reservoir_length']/1000;r=p['reservoir_radius']/1000
    G.prism('Asymmetric reservoir yoke',[(-.012,-.009),(.012,-.004),(x+.012,-.025),(x+.016,-.047),(x-.012,-.047),(.012,-.029),(-.014,-.031)],.025,0,p['reservoir_color'],.002)
    G.cyl('Reservoir',(x,-.035,0),(x,-.035-length,0),r,p['reservoir_color'],vertices=32)
    G.cyl('Compression adjuster',(x,-.026,0),(x,-.035,0),.011,p['adjuster'],vertices=24)
    G.cyl('Rebound dial',(.01,-eye+.018,0),(.019,-eye+.018,0),.007,'red',vertices=20)
    return {'upper_eye':[0,0,0],'lower_eye':[0,-eye,0]}
