/**
 * P35/P36 self-check: 신청 수 빨간색 표기와 임의 등록이 규칙대로 동작하는지 확인한다.
 *
 *  P35 - 새 신청이 들어오면 빨간색, 상세를 열면 해제
 *  P36 - 임의 등록한 숫자가 노출되고, 그 변경 자체는 빨간색을 유발하지 않음
 *        (단, 이후 실제 신청이 들어오면 다시 빨간색 — 알림 목적을 유지하기 위함)
 *
 * 사용법: MISSION=68 node scripts/check-enroll-count.mjs
 * 주의: 실제 신청 건을 흉내내지 않으므로, 대상 미션에 신청이 이미 있어야 의미가 있다.
 */
const BASE = process.env.BASE || 'http://localhost:3001';
const ADMIN = process.env.ADMIN || 'admin';
const PW = process.env.PW || 'admin1234';
const MISSION = Number(process.env.MISSION || 68);

const j = async (url, opts) => (await fetch(url, opts)).json();
const { accessToken } = await j(`${BASE}/admin/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ admin: ADMIN, pw: PW }),
});
const auth = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

const row = async () => {
  const r = await j(`${BASE}/admin/mission?item=100`, { headers: auth });
  return r.missions.data.find(m => m.missionId === MISSION);
};
const setManual = count =>
  j(`${BASE}/admin/mission/${MISSION}/enroll-count`, { method: 'PUT', headers: auth, body: JSON.stringify({ count }) });
const openDetail = () => j(`${BASE}/admin/mission/${MISSION}`, { headers: auth });

let failed = 0;
const check = (label, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`); if (!ok) failed++; };

await setManual(null);
await openDetail();                       // 확인 상태로 초기화
check('확인 직후에는 빨간색이 아니다', !(await row()).hasNewApplication);

const real = (await row()).enrollCount;
check('임의 등록 전에는 실제 신청 수를 노출한다', (await row()).displayEnrollCount === real);

await setManual(real + 40);
const afterManual = await row();
check('임의 등록한 숫자가 노출된다', afterManual.displayEnrollCount === real + 40);
check('임의 등록 자체는 빨간색을 유발하지 않는다', !afterManual.hasNewApplication);

await setManual(null);
check('임의 등록을 해제하면 실제 신청 수로 돌아온다', (await row()).displayEnrollCount === real);

process.exit(failed ? 1 : 0);
