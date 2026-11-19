import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
let handler;
const js=readFileSync('dist-edge/server-panic.worker.js','utf8');
runInNewContext(js,{addEventListener:(name,cb)=>{assert.equal(name,'fetch');handler=cb;},Response,URL,console});
async function invoke(url,method='GET'){
  let promise;
  handler({request:new Request(url,{method}),respondWith:(p)=>promise=p});
  return await promise;
}
const response=await invoke('https://server-panic.arvanedge.ir/');
assert.equal(response.status,200);
assert.match(response.headers.get('content-type'),/text\/html/);
const html=await response.text();
assert.ok(html.length>100_000);
assert.match(html,/SERVER/);
assert.match(html,/GameSimulation/);
assert.match(html,/ASSET_URLS/);
assert.match(html,/serverPanic/);
const health=await invoke('https://server-panic.arvanedge.ir/healthz');
assert.equal(health.status,200);assert.deepEqual(await health.json(),{status:'ok',game:'server-panic'});
const other=await invoke('https://server-panic.arvanedge.ir/nested/path');
assert.equal(other.status,200);
assert.equal(await invoke('https://server-panic.arvanedge.ir/favicon.ico').then(r=>r.status),204);
assert.equal(await invoke('https://server-panic.arvanedge.ir/', 'POST').then(r=>r.status),405);
assert.equal(await invoke('https://server-panic.arvanedge.ir/','HEAD').then(r=>r.status),200);
console.log('PASS: Edge Worker returns executable bundled HTML, SPA fallback, healthz, 204 favicon, 405 methods and HEAD.');
