/** Equal 20×110 dimensions do not prove Boost/non-Boost brake and flange compatibility. */
export function compareAxles(left: unknown, right: unknown): 'same' | 'different' | 'unknown' {
 if(typeof left!=='string'||typeof right!=='string')return 'unknown';
 const normalize=(s:string)=>s.toLowerCase().replace(/×/g,'x').replace(/[^a-z0-9.]/g,'');
 const a=normalize(left),b=normalize(right);
 const dimensions=(s:string)=>s.match(/(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)/)?.[0];
 const ad=dimensions(a),bd=dimensions(b);
 if(!ad||!bd)return a===b?'same':'different';
 if(ad!==bd)return 'different';
 if(ad!=='20x110')return 'same';
 const format=(s:string)=>/nonboost|noboost/.test(s)?'nonboost':s.includes('boost')?'boost':null;
 const af=format(a),bf=format(b);
 return !af||!bf?'unknown':af===bf?'same':'different';
}
