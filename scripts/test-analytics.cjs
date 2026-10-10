const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const original = fs.readFileSync('analytics.js', 'utf8');
function run({enabled=true, consent=true, host='elara-aerospace.com', protocol='https:', query='', dnt=false, duplicate=false}={}) {
 const source=enabled?original.replace('enabled: false','enabled: true').replace("token: ''", "token: '0123456789abcdef0123456789abcdef'"):original;
 let allowed=consent, reloads=0; const scripts=[], events={};
 const location={hostname:host,protocol,search:query,hash:'',reload:()=>reloads++};
 const context={location,navigator:{doNotTrack:dnt?'1':'0'},localStorage:{getItem:()=>JSON.stringify({telemetry:allowed})},window:{location,addEventListener:(name,fn)=>events[name]=fn},document:{querySelector:()=>duplicate?{}:null,head:{appendChild:s=>scripts.push(s)},createElement:()=>({dataset:{},addEventListener(){},remove(){}})}};
 vm.runInNewContext(source,context);
 return {scripts,events,setConsent:v=>allowed=v,reloads:()=>reloads};
}
for(const scenario of [{enabled:false},{consent:false},{host:'localhost'},{protocol:'http:'},{query:'?email=private'},{dnt:true},{duplicate:true}]) assert.equal(run(scenario).scripts.length,0);
const state=run(); assert.equal(state.scripts.length,1); assert.equal(JSON.parse(state.scripts[0].dataset.cfBeacon).spa,false);
state.events.elara_cookie_consent_changed(); assert.equal(state.scripts.length,1);
state.setConsent(false); state.events.elara_cookie_consent_changed(); assert.equal(state.reloads(),1);
const later=run({consent:false}); later.setConsent(true); later.events.elara_cookie_consent_changed(); assert.equal(later.scripts.length,1);
console.log('Analytics tests passed: disabled/unconfigured, consent, host/protocol, query privacy, DNT, duplicates, opt-in and revocation.');
