import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {runInNewContext} from 'node:vm';
const code=readFileSync(new URL('../../dist-edge/arvan-shahr-concert.worker.js',import.meta.url),'utf8');
let handler;
runInNewContext(code,{addEventListener:(name,fn)=>{assert.equal(name,'fetch');handler=fn;},Response,URL,atob});
function request(path,method='GET') {
  let result;
  handler({request:new Request('https://example.invalid'+path,{method}),respondWith:r=>result=r});
  return result;
}
test('worker serves the concert and all local dependencies with matching content',async()=>{
 const routes=[['/','index.html','html'],['/concert.css','concert.css','css'],...['main.mjs','mission.mjs','city.mjs','vendor/three.module.min.js','vendor/three.core.min.js'].map(x=>['/'+x,x,'javascript']),['/vendor/LICENSE','vendor/LICENSE','plain']];
 for(const [path,file,type] of routes){
  const res=request(path);assert.equal(res.status,200);assert.match(res.headers.get('content-type'),new RegExp(type));
  assert.equal(await res.text(),readFileSync(new URL('../../concert/'+file,import.meta.url),'utf8'));
 }
});
test('worker handles health, unsupported methods, missing assets, and HEAD',async()=>{
 assert.deepEqual(await request('/healthz').json(),{status:'ok',game:'arvan-shahr-concert'});
 assert.equal(request('/favicon.ico').status,204);
 assert.equal(request('/main.mjs','POST').status,405);
 assert.equal(request('/missing').status,404);
 assert.equal(await request('/','HEAD').text(),'');
});

test('worker serves public OFL fonts byte-for-byte and excludes private GLBs',async()=>{
 for(const subset of ['arabic','latin']){
  const file='fonts/noto-sans-arabic-'+subset+'.woff2';
  const res=request('/'+file);
  assert.equal(res.headers.get('content-type'),'font/woff2');
  assert.deepEqual(Buffer.from(await res.arrayBuffer()),readFileSync(new URL('../../concert/'+file,import.meta.url)));
 }
 assert.equal(request('/fonts/OFL.txt').status,200);
 assert.equal(request('/art-preview/audience.glb').status,404);
});
