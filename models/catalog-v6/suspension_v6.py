"""Continuity additions to frozen v5 suspension envelopes; metres, no interior simulation."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'catalog-v5'))
import suspension as original
import blender_geometry as G

def fork(spec,p):
    anchors=original.fork(spec,p)
    # The fork has two physical crown arms, each ending in a clamp; retain the distinct arch.
    spacing=p['leg_spacing']/2000
    for y in ([-.006,.142] if p['dual'] else [-.007]):
        G.sleeve('Steerer crown seat',(0,y-.013,0),(0,y+.013,0),.020,.0142875,'link')
        for side in [-1,1]:
            G.path('Crown rear web',[(0,y,side*spacing),(-.011,y+.003,side*spacing*.62),(0,y,0)],.010,p['crown'])
    return anchors

def shock(spec,p):
    anchors=original.shock(spec,p)
    eye=spec['eye_to_eye_mm']/1000
    # Shaft/eye transition was separated by ~1 mm in v5; overlap the eye boss, not its bore.
    G.cyl('Rod eye neck',(0,-eye+.026,0),(0,-eye+.008,0),.007,'metal',vertices=24)
    return anchors
