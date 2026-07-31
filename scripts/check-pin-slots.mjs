/**
 * P34 self-check: 고정 슬롯이 (1) 맨 앞에 순서대로 오고 (2) 아래 자동정렬 목록에
 * 중복 노출되지 않으며 (3) 고정 해제 시 원래 정렬로 돌아가는지 확인한다.
 *
 * 사용법: BASE=http://localhost:3001 ADMIN=admin PW=admin1234 node scripts/check-pin-slots.mjs
 */
const BASE = process.env.BASE || 'http://localhost:3001';
const ADMIN = process.env.ADMIN || 'admin';
const PW = process.env.PW || 'admin1234';

const j = async (url, opts) => (await fetch(url, opts)).json();
const ids = d => d.data.data.map(m => m.missionId);

const { accessToken } = await j(`${BASE}/admin/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ admin: ADMIN, pw: PW }),
});
const auth = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
const setPin = missionIds =>
  j(`${BASE}/admin/mission/pin/new`, { method: 'PUT', headers: auth, body: JSON.stringify({ missionIds }) });

await setPin([]); // 기존 고정을 비우고 기준 상태부터 시작한다
const before = ids(await j(`${BASE}/user/mission/info?item=6&pin=new`));
const [a, b] = [before.at(-1), before.at(-2)]; // 원래 뒤쪽에 있던 두 개를 고정해본다

await setPin([a, b]);
const after = ids(await j(`${BASE}/user/mission/info?item=6&pin=new`));
const untouched = ids(await j(`${BASE}/user/mission/info?item=6`));

let failed = 0;
const check = (label, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`); if (!ok) failed++; };

check('고정한 캠페인이 순서대로 맨 앞에 온다', after[0] === a && after[1] === b);
check('중복 노출이 없다', new Set(after).size === after.length);
check('pin 파라미터가 없으면 기존 정렬 그대로', untouched[0] === before.at(0) || untouched[0] !== a);

await setPin([]); // 고정 해제
const restored = ids(await j(`${BASE}/user/mission/info?item=6&pin=new`));
check('고정 해제하면 자동정렬로 돌아온다', JSON.stringify(restored) === JSON.stringify(before));

process.exit(failed ? 1 : 0);
