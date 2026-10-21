"""Create explicit visual linkage profiles from existing model-specific reference registrations.
Coordinates describe exterior estimated mechanisms, never factory kinematics or engineering measurements.
"""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[2]
# A/C input link; B/D output link; C/D coupler. Rear wheel attaches to the declared body.
# Six-bar frames use the exterior reduced linkage, with limits explicitly estimated.
mechanisms={
 'commencal-meta-sx-v5':([[550,445],[552,590],[582,425],[574,607]],'rear','dual-link exterior'),
 'santa-cruz-nomad-7-my27':([[432,269],[410,368],[444,328],[438,400]],'rear','VPP exterior'),
 'specialized-s-works-enduro-udh':([[608,677],[495,812],[486,655],[496,690]],'rear','linked exterior'),
 'da-bomb-cherry-bomb-29':([[510,845],[554,583],[70,850],[425,574]],'rear','rear-pivot exterior'),
 'trek-slash-al-gen-6':([[318,514],[325,451],[153,540],[340,427]],'rear','high-pivot exterior'),
 'canyon-sender-cfr-high-pivot':([[554,391],[450,465],[473,344],[442,374]],'rear','high-pivot linked exterior'),
 'scott-ransom-rc-427727':([[487,451],[478,542],[467,451],[450,520]],'rear','six-bar exterior reduced guide'),
 'commencal-supreme-dh-v5':([[581,538],[538,686],[538,526],[519,741]],'rear','HVCS exterior reduced guide'),
 'santa-cruz-v10-8-my27':([[661,510],[672,680],[675,600],[624,718]],'rear','VPP exterior'),
 'yt-tues-mk4-carbon':([[887,790],[997,687],[469,812],[901,672]],'rear','four-link exterior'),
 'yt-capra-mk3-carbon-mx':([[870,784],[883,686],[492,798],[820,674]],'rear','four-link exterior'),
 'gt-fury-carbon-high-pivot':([[728,881],[728,754],[663,740],[929,643]],'input','high-pivot rocker exterior'),
 'gt-force-carbon-high-pivot':([[722,842],[806,699],[665,706],[920,626]],'input','high-pivot rocker exterior'),
 'commencal-frs-v3':([[1114,899],[1000,1030],[876,891],[933,844]],'input','single-pivot rocker exterior'),
 'commencal-furious-v3-2021':([[946,616],[864,720],[810,616],[838,585]],'input','single-pivot rocker exterior'),
}
modern=json.loads((root/'models/catalog-v9/frame-profiles.json').read_text())
result={}
for slug,(joints,rear,architecture) in mechanisms.items():
 if slug in modern:
  p=modern[slug];points=p['image_landmarks']
  regions=[]
  for m in p['members']:
   role='rear' if any(k in m['name'] for k in ['stay','chain']) else 'fixed'
   if rear=='input' and role=='rear':role='input'
   regions.append({'role':role,'points':m['path'],'closed':False})
  for i,link in enumerate(p['links']): regions.append({'role':'input' if i==0 and len(p['links'])>1 else 'output','points':link,'closed':False})
 else:
  p=json.loads((root/'models/catalog-v5/traces'/f'{slug}.json').read_text());points=p['image_landmarks'];regions=[]
  for section in p['sections']:
   name=section['name'];role='fixed'
   if any(k in name for k in ['stay','chain','rocker']): role='rear'
   if any(k in name for k in ['upper_link','lower_link','lower_yoke','shock_yoke']) or name=='link': role='input' if 'upper' in name or name=='link' else 'output'
   if 'down' in name or 'seat_yoke' in name:role='fixed'
   if rear=='input' and role=='rear':role='input'
   if slug=='trek-slash-al-gen-6' and section['name']=='upper_link':role='output'
   regions.append({'role':role,'points':section['points'],'closed':True})
 # Horst-type lower stays belong to the input body, not the seat-stay/rear body.
 if slug in ['yt-tues-mk4-carbon','yt-capra-mk3-carbon-mx','trek-slash-al-gen-6','da-bomb-cherry-bomb-29']:
  for region in regions:
   # The second rear member, lowest at the crank, follows input A/C.
   pts=region['points']
   if region['role']=='rear' and sum(p[1] for p in pts)/len(pts)>points['rear_axle'][1]-35:region['role']='input'
 upper='output' if slug.startswith('gt-') else 'input' if slug=='commencal-supreme-dh-v5' else 'fixed'
 lower='output' if slug=='commencal-supreme-dh-v5' else 'fixed' if upper=='output' else 'rear' if slug=='commencal-meta-sx-v5' else 'input' if slug=='santa-cruz-nomad-7-my27' else 'output'
 result[slug]={'shock_upper_body':upper,'shock_lower_body':lower,'version':'atlas-motion-v1','architecture':architecture,'estimated':True,'note':'Model-specific exterior approximation from registered references; reduced guides do not reconstruct hidden factory mechanisms or leverage curves.','registration':{k:points[k] for k in ['bottom_bracket','head_top','rear_axle']},'joints':dict(zip(['a','b','c','d'],joints)),'rear_body':rear,'shock_body':'output','regions':regions,'max_input_radians':0.7}
(root/'src/features/configurator/model/suspension/profiles.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
