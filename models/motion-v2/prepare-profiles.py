import json,copy
from pathlib import Path
root=Path('.');read=lambda p:json.load(open(p));profiles=read('src/features/configurator/model/suspension/profiles.json');audit=read('models/motion-v2/resources.json');out={}
for row in audit:
 if not row.get('size'):continue
 slug=row['slug']
 if slug not in out:
  if slug=='santa-cruz-v10-8-my27':p=read('src/features/configurator/model/suspension/v10-v30.json')
  elif slug=='yt-tues-mk4-carbon':p=read('src/features/configurator/model/suspension/tues-v28.json')
  elif slug=='canyon-sender-cfr-high-pivot':p=read('src/features/configurator/model/suspension/sender-v24.json')
  else:p=copy.deepcopy(profiles[slug])
  p['version']='atlas-motion-v2';p['asset_ids']=[];out[slug]=p
 out[slug]['asset_ids'].append(row['asset'])
# Fixed frame vs articulated eye: visible vertical shocks are driven at the upper rocker.
for slug in ['trek-slash-al-gen-6','da-bomb-cherry-bomb-29']:
 out[slug]['shock_upper_body']='output';out[slug]['shock_lower_body']='fixed'
# Hidden Ransom shock is driven through the input yoke in this reduced exterior guide.
out['scott-ransom-rc-427727']['shock_lower_body']='input'
# VCS: upper rocker drives the clevis; lower fixed/rear axes were reversed in v1.
p=out['commencal-meta-sx-v5'];p['joints']={'a':[550,445],'c':[582,425],'b':[574,607],'d':[552,590]};p['shock_lower_body']='input'
# CAPRA guide follows its visible rocker triangle rather than swapping the rearward and forward axes.
p=out['yt-capra-mk3-carbon-mx'];p['joints']['b']=[820,674];p['joints']['d']=[823,639]
# New Nomad/Enduro exterior resources use their own image registration, not old generation traces.
for slug,v,joints in [('santa-cruz-nomad-7-my27',22,{'a':[750,813],'c':[722,834],'b':[772,590],'d':[795,690]}),('specialized-s-works-enduro-udh',23,{'a':[619,846],'c':[490,817],'b':[608,677],'d':[478,652]})]:
 p=out[slug];source=read(f'models/catalog-v{v}/profile.json');p['registration']={k:source['image_landmarks'][k] for k in ['bottom_bracket','head_top','rear_axle']};p['joints']=joints;p['shock_lower_body']='input';p['regions']=[]
 for m in source['members']:
  role='rear' if any(n in m['name'] for n in ['stay','chain']) else 'fixed'
  p['regions'].append({'role':role,'points':m['path'],'closed':False})
 for link in source['links']:
  role='input' if link['name']=='lower' else 'output' if link['name']=='upper' else 'rear'
  p['regions'].append({'role':role,'points':link['outer'],'closed':True})
for slug,p in out.items():
 p['note']='Resource-scoped exterior inspection guide. Axis/eye body corrections documented in models/motion-v2. Occluded joints, reduced six-bar mechanisms and depth remain estimates; not factory leverage or full travel.'
 if slug not in ['gt-force-carbon-high-pivot','gt-fury-carbon-high-pivot','commencal-frs-v3','commencal-furious-v3-2021','commencal-supreme-dh-v5']:p['max_input_radians']=min(p['max_input_radians'],.18)
presets=read('supabase/catalog/frames-v11-examples.json');legacy=read('supabase/catalog/frames-v11-reviewed.json');ids={next(i['variantId'] for i in p['items'] if i['slot']=='frame') for p in presets['presets']};slugs={c['id']:c['slug'] for c in legacy['components']}
for v in legacy['variants']:
 if v['id'] in ids:out[slugs[v['component_id']]]['asset_ids'].append(v['visual_asset_id'])
Path('src/features/configurator/model/suspension/current-v2.json').write_text(json.dumps(out,indent=2)+'\n')
