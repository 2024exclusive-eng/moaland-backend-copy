import { adminError } from './adminPolicy.js';
export function normalizeAmapLocation(value) {
  if (value == null) return null;
  const fail = () => { throw adminError('INVALID_AMAP_LOCATION', '고덕지도 검색 결과에서 장소를 선택해 주세요.', 400); };
  if (typeof value !== 'object' || Array.isArray(value)) return fail();
  const {latitude, longitude} = value;
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude)>90 || Math.abs(longitude)>180) return fail();
  const out = {latitude, longitude};
  for (const [field,max] of [['poiId',100],['name',200],['address',800],['region',200]]) {
    if (typeof value[field] !== 'string' || value[field].length > max) return fail();
    out[field] = value[field].trim();
  }
  if (!out.poiId || !out.name) return fail();
  return out;
}
export function normalizePoi(poi) {
  if (typeof poi.location !== 'string' || poi.location.split(',').length !== 2) return null;
  const [lng,lat] = poi.location.split(',');
  if (!lng.trim() || !lat.trim()) return null;
  const text = v => typeof v === 'string' ? v : '';
  const region = [...new Set([poi.pname,poi.cityname,poi.adname].map(text).filter(Boolean))].join('');
  try {return normalizeAmapLocation({poiId:text(poi.id),name:text(poi.name),address:region+text(poi.address),region,longitude:Number(lng),latitude:Number(lat)});} catch {return null;}
}
