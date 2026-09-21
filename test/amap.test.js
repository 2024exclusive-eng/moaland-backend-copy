import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAmapLocation,normalizePoi } from '../src/utils/amap.js';
const poi={id:'B123',name:'Cafe',location:'121.4737,31.2304',pname:'上海市',cityname:'上海市',adname:'黄浦区',address:'测试路'};
test('POI longitude-first coordinates, duplicate administrative areas and missing arrays are normalized',()=>{
 const p=normalizePoi(poi);assert.equal(p.latitude,31.2304);assert.equal(p.longitude,121.4737);assert.equal(p.address,'上海市黄浦区测试路');assert.equal(normalizePoi({...poi,address:[]}).address,'上海市黄浦区');
});
test('optional map accepts null and rejects partial, coerced, missing and out-of-range locations',()=>{
 assert.equal(normalizeAmapLocation(null),null);assert.equal(normalizeAmapLocation(undefined),null);
 for(const location of ['',',','180,91','181,0','NaN,12'])assert.equal(normalizePoi({...poi,location}),null);
 assert.throws(()=>normalizeAmapLocation({...normalizePoi(poi),latitude:'31'}));assert.throws(()=>normalizeAmapLocation({}));
 assert.equal(normalizePoi({...poi,location:'0,0'}).latitude,0);
});
