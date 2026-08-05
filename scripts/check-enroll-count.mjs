/**
 * P35/P36 self-check: 신청 수 빨간색 표기와 임의 등록이 규칙대로 동작하는지 확인한다.
 *
 *  P35 - 새 신청이 들어오면 빨간색, 상세를 열면 해제
 *  P36 - 임의 등록한 숫자가 노출되고, 그 변경은 빨간색에 아무 영향이 없다.
 *        빨간색을 유발하지도 않고, 빨간 상태를 해제하지도 않는다.
 *        빨간색을 지우는 것은 오직 '상세를 여는 것' 뿐이다.
 *
 * 사용법: MISSION=68 node scripts/check-enroll-count.mjs
 * 주의: 실제 신청 건을 흉내내지 않으므로, 대상 미션에 신청이 이미 있어야 의미가 있다.
 */
import mysql from 'mysql2/promise';

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

// 확인하지 않은 신청 건을 만들어 내기 위해 '어디까지 확인했는지'를 직접 되돌린다.
// (실제 신청을 넣는 API 는 사용자 인증이 필요하므로 여기서는 DB 로 흉내낸다.)
const db = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'k_viewo_local',
});
const setSeen = seen => db.query('UPDATE mission SET enroll_seen_count = ? WHERE id = ?', [seen, MISSION]);

let failed = 0;
const check = (label, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`); if (!ok) failed++; };

await setManual(null);
await openDetail();                       // 확인 상태로 초기화
check('확인 직후에는 빨간색이 아니다', !(await row()).hasNewApplication);

const real = (await row()).enrollCount;
const maxEnroll = (await row()).maxEnroll;
const bumped = maxEnroll;                   // 모집 인원까지가 올릴 수 있는 최대치
check('임의 등록 전에는 실제 신청 수를 노출한다', (await row()).displayEnrollCount === real);

await setManual(bumped);
const afterManual = await row();
check('임의 등록한 숫자가 노출된다', afterManual.displayEnrollCount === bumped);
check('임의 등록 자체는 빨간색을 유발하지 않는다', !afterManual.hasNewApplication);

await setManual(null);
check('임의 등록을 해제하면 실제 신청 수로 돌아온다', (await row()).displayEnrollCount === real);

// 클라이언트 요청 (2026-08-04): 빨간 상태에서 숫자만 바꿨을 때 빨간색이 사라지면 안 된다.
await setSeen(real - 1);                  // 확인하지 않은 신청 1건이 있는 상태
check('확인하지 않은 신청이 있으면 빨간색이다', !!(await row()).hasNewApplication);

await setManual(bumped);
const stillRed = await row();
check('빨간 상태에서 임의 등록해도 빨간색이 유지된다', !!stillRed.hasNewApplication);
check('그 상태에서도 임의 등록한 숫자를 노출한다', stillRed.displayEnrollCount === bumped);

await openDetail();                       // 빨간색을 지우는 것은 상세를 여는 것 뿐이다
check('상세를 열어야만 빨간색이 해제된다', !(await row()).hasNewApplication);

// 사용자 화면 노출 (2026-08-05): 임의 등록한 숫자가 사용자 목록/상세에도 나와야 한다.
// 단 모집 인원을 넘으면 '신청 50/15' 처럼 보이므로 저장 시 모집 인원으로 제한한다.
const userRow = async () => {
  const r = await j(`${BASE}/user/mission/info?item=100`);
  return (r.data?.data || []).find(m => m.missionId === MISSION);
};
await setManual(maxEnroll - 1);
check('사용자 목록에도 임의 등록한 숫자가 노출된다', (await userRow())?.enrollCount === maxEnroll - 1);

await setManual(maxEnroll + 1000);
check('모집 인원을 넘겨 저장하면 모집 인원으로 제한된다', (await row()).displayEnrollCount === maxEnroll);
check('사용자 화면에도 제한된 숫자가 노출된다', (await userRow())?.enrollCount === maxEnroll);

await setManual(null);
check('해제하면 사용자 화면도 실제 신청 수로 돌아온다', (await userRow())?.enrollCount === real);

await db.end();
process.exit(failed ? 1 : 0);
