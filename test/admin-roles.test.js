import test from 'node:test';
import assert from 'node:assert/strict';
import pool from '../src/utils/pool.js';
import {
  monthKey,
  accountInput,
  adminOwner,
} from '../src/utils/adminPolicy.js';
import { AdminLoginCheck } from '../src/middlewares/auth.js';
import {
  MissionAccess,
  EnrollmentAccess,
  SuperAdminOnly,
} from '../src/middlewares/adminAccess.js';
import {
  createCampaign,
  saveAccount,
  listAccounts,
} from '../src/libs/adminManagement.js';
import {
  GetMissionListByStatus,
  GetMissionStatistics,
  GetMissionFilterCounts,
} from '../src/libs/mission.js';
const advertiser = {
  id: 10,
  role: 'advertiser',
  isActive: 1,
  tokenVersion: 0,
  monthlyLimit: 1,
};
const response = () => ({
  statusCode: 200,
  body: null,
  status(n) {
    this.statusCode = n;
    return this;
  },
  json(x) {
    this.body = x;
    return this;
  },
});
const run = async (fn, req) => {
  const res = response();
  let next = false;
  await fn(req, res, (e) => {
    if (e) throw e;
    next = true;
  });
  return { res, next };
};
test('month resets at midnight Korea time, including year boundary', () => {
  assert.equal(monthKey(new Date('2026-09-30T14:59:59Z')), '2026-09');
  assert.equal(monthKey(new Date('2026-09-30T15:00:00Z')), '2026-10');
  assert.equal(monthKey(new Date('2026-12-31T15:00:00Z')), '2027-01');
});
test('only explicit roles and bounded limits/passwords accepted', () => {
  const base = {
    admin: 'advertiser',
    name: 'Test',
    role: 'advertiser',
    isActive: true,
    monthlyLimit: 3,
    password: 'valid-test-password',
  };
  assert.equal(accountInput(base, true).monthlyLimit, 3);
  for (const patch of [
    { monthlyLimit: -1 },
    { monthlyLimit: 1.5 },
    { monthlyLimit: '3' },
    { role: 'admin' },
    { isActive: 'false' },
    { password: 'short' },
  ])
    assert.throws(() => accountInput({ ...base, ...patch }, true));
  assert.equal(
    accountInput({ ...base, monthlyLimit: null }, true).monthlyLimit,
    null
  );
  assert.equal(adminOwner({ admin: advertiser }), 10);
});
test('database role and revocation override token claims', async () => {
  pool.query = async () => [[advertiser]];
  const req = { decoded: { id: 10, service: 'ADMIN', role: 'super_admin' } };
  assert.equal((await run(AdminLoginCheck, req)).next, true);
  assert.equal(req.admin.role, 'advertiser');
  assert.equal((await run(SuperAdminOnly, req)).res.statusCode, 403);
  pool.query = async () => [[{ ...advertiser, isActive: 0 }]];
  assert.equal((await run(AdminLoginCheck, req)).res.statusCode, 401);
  pool.query = async () => [[{ ...advertiser, tokenVersion: 1 }]];
  assert.equal((await run(AdminLoginCheck, req)).res.statusCode, 401);
  assert.equal(
    (await run(AdminLoginCheck, { decoded: { service: 'USER', id: 10 } })).res
      .statusCode,
    401
  );
});
test('foreign and unassigned campaign IDs are inaccessible; own and super allowed', async () => {
  for (const owner of [11, null]) {
    pool.query = async () => [[{ id: 5, ownerAdminId: owner }]];
    assert.equal(
      (await run(MissionAccess, { admin: advertiser, params: { id: '5' } })).res
        .statusCode,
      404
    );
  }
  pool.query = async () => [[{ id: 5, ownerAdminId: 10 }]];
  assert.equal(
    (await run(MissionAccess, { admin: advertiser, params: { id: '5' } })).next,
    true
  );
  pool.query = async () => [[{ id: 5, ownerAdminId: 11 }]];
  assert.equal(
    (
      await run(MissionAccess, {
        admin: { id: 1, role: 'super_admin' },
        params: { id: '5' },
      })
    ).next,
    true
  );
});
test('applicant status endpoints check the campaign owner and allowed transition targets', async () => {
  pool.query = async () => [[{ ownerAdminId: 11 }]];
  assert.equal(
    (
      await run(EnrollmentAccess, {
        admin: advertiser,
        params: { enrollId: '22', type: 'selected' },
      })
    ).res.statusCode,
    404
  );
  pool.query = async () => [[{ ownerAdminId: 10 }]];
  assert.equal(
    (
      await run(EnrollmentAccess, {
        admin: advertiser,
        params: { enrollId: '22', type: 'selected' },
      })
    ).next,
    true
  );
  for (const type of ['completed', 'rewarded', 'garbage'])
    assert.equal(
      (
        await run(EnrollmentAccess, {
          admin: advertiser,
          params: { enrollId: '22', type },
        })
      ).res.statusCode,
      403
    );
});
test('campaign rows/count/search and all dashboard totals include owner constraints', async () => {
  const calls = [];
  pool.query = async (sql, args = []) => {
    assert.equal(
      (sql.match(/\?/g) || []).length,
      args.length,
      'placeholder mismatch'
    );
    calls.push({ sql, args });
    if (
      /COUNT\(\*\) AS total|COUNT\(\*\) as count|COUNT\(\*\) AS totalCount/i.test(
        sql
      )
    )
      return [[{ total: 0, count: 0, totalCount: 0 }]];
    return [[{}]];
  };
  await GetMissionListByStatus({
    ownerAdminId: 10,
    search: 'cafe',
    page: 1,
    item: 10,
  });
  assert.equal(calls.length, 2);
  for (const q of calls) {
    assert.match(q.sql, /scopeOwnerAdminId = \?/);
    assert.equal(q.args[0], 10);
  }
  calls.length = 0;
  await GetMissionStatistics(10);
  await GetMissionFilterCounts(10);
  assert.equal(calls.length, 11);
  for (const q of calls) {
    assert.match(q.sql, /owner_admin_id=\?/);
    assert.deepEqual(q.args.slice(-2), [10, 10]);
  }
});
// Transaction simulator supplies a real asynchronous mutex to exercise competing creations.
function campaignDB({
  limit = 1,
  used = 0,
  failInsert = false,
  role = 'advertiser',
} = {}) {
  const state = { used, missions: 0, commits: 0, rollbacks: 0, params: null };
  let tail = Promise.resolve();
  pool.getConnection = async () => {
    let unlock, snapshot;
    return {
      beginTransaction: async () => {},
      query: async (sql, args) => {
        if (sql.includes('FROM admin WHERE id=? FOR UPDATE')) {
          const before = tail;
          tail = new Promise((r) => {
            unlock = r;
          });
          await before;
          snapshot = { used: state.used, missions: state.missions };
          return [[{ ...advertiser, role, monthlyLimit: limit }]];
        }
        if (sql.startsWith('SELECT used')) return [[{ used: state.used }]];
        if (sql.includes('INSERT INTO mission (')) {
          if (failInsert) throw new Error('insert failed');
          assert.equal((sql.match(/\?/g) || []).length, args.length);
          state.params = args;
          return [{ insertId: ++state.missions }];
        }
        if (sql.startsWith('UPDATE mission SET owner_admin_id')) {
          assert.equal(args[0], 10);
          return [{ affectedRows: 1 }];
        }
        if (sql.startsWith('INSERT INTO admin_campaign_usage')) {
          state.used++;
          return [{ affectedRows: 1 }];
        }
        throw new Error('Unexpected SQL: ' + sql);
      },
      commit: async () => {
        state.commits++;
      },
      rollback: async () => {
        state.rollbacks++;
        if (snapshot) Object.assign(state, snapshot);
      },
      release: () => unlock?.(),
    };
  };
  return state;
}
test('two concurrent submissions with one remaining slot create exactly one campaign', async () => {
  const state = campaignDB();
  const result = await Promise.allSettled([
    createCampaign(advertiser, { isRecommended: true, ownerAdminId: 999 }),
    createCampaign(advertiser, {}),
  ]);
  assert.equal(result.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(
    result.find((r) => r.status === 'rejected').reason.code,
    'MONTHLY_LIMIT_REACHED'
  );
  assert.equal(state.missions, 1);
  assert.equal(state.used, 1);
  assert.equal(state.params.at(-2), 0);
});
test('failed campaign insert rolls back; zero blocks and unlimited allows', async () => {
  let state = campaignDB({ failInsert: true });
  await assert.rejects(createCampaign(advertiser, {}), /insert failed/);
  assert.equal(state.used, 0);
  assert.equal(state.rollbacks, 1);
  state = campaignDB({ limit: 0 });
  await assert.rejects(
    createCampaign(advertiser, {}),
    (e) => e.code === 'MONTHLY_LIMIT_REACHED'
  );
  assert.equal(state.missions, 0);
  state = campaignDB({ limit: null, used: 55 });
  await createCampaign(advertiser, {});
  assert.equal(state.used, 56);
});
test('self-demotion and disabling your own super administrator are refused', async () => {
  for (const patch of [{ role: 'advertiser' }, { isActive: false }])
    await assert.rejects(
      saveAccount({ id: 1 }, '1', {
        name: 'Super',
        role: 'super_admin',
        isActive: true,
        monthlyLimit: null,
        ...patch,
      }),
      (e) => e.code === 'SELF_LOCKOUT'
    );
});
test('account list uses selected month with bound parameters and no password fields', async () => {
  const calls = [];
  pool.query = async (sql, args) => {
    calls.push({ sql, args });
    return sql.includes('COUNT(*)') ? [[{ total: 1 }]] : [[{}]];
  };
  await listAccounts({ month: '2026-09', search: "' OR 1=1", page: 2 });
  assert.equal(calls[1].args[0], '2026-09');
  assert.ok(!calls[1].sql.includes('pw'));
  assert.ok(!calls[1].sql.includes("' OR 1=1"));
  assert.equal(calls[1].args.at(-1), 20);
  await assert.rejects(listAccounts({ month: '2026-99' }));
});
test.after(async () => {
  await pool.end();
});
import bcrypt from 'bcryptjs';
test('account creation hashes password and quota updates preserve usage',async()=>{
 const calls=[];pool.getConnection=async()=>({beginTransaction:async()=>{},commit:async()=>{},rollback:async()=>{},release:()=>{},query:async(sql,args=[])=>{calls.push({sql,args});if(sql.includes('admin_security_lock'))return [[{id:1}]];if(sql.startsWith('SELECT role,is_active'))return [[{role:'super_admin',is_active:1}]];if(sql.startsWith('SELECT id,role,is_active'))return [[{id:2,role:'advertiser',is_active:1}]];if(sql.startsWith('INSERT INTO admin '))return [{insertId:2}];if(sql.startsWith('UPDATE admin SET'))return [{affectedRows:1}];throw new Error('Unexpected account SQL');}});
 const body={admin:'sample.advertiser',name:'Sample',role:'advertiser',isActive:true,monthlyLimit:3,password:'Only-For-Local-Test-123'};
 assert.equal(await saveAccount({id:1},'new',body),2);const insert=calls.find(c=>c.sql.startsWith('INSERT INTO admin '));assert.notEqual(insert.args[1],body.password);assert.equal(await bcrypt.compare(body.password,insert.args[1]),true);
 calls.length=0;await saveAccount({id:1},'2',{...body,password:undefined,monthlyLimit:0});assert.equal(calls.filter(c=>c.sql.includes('admin_campaign_usage')).length,0);const update=calls.find(c=>c.sql.startsWith('UPDATE admin SET'));assert.equal(update.args[5],0);assert.equal(update.args[6],0);
 calls.length=0;await saveAccount({id:1},'2',{...body,password:undefined,isActive:false});assert.equal(calls.find(c=>c.sql.startsWith('UPDATE admin SET')).args[6],1);
});
test('advertiser cannot reopen a completed or rewarded enrollment',async()=>{for(const status of ['completed','rewarded']){pool.query=async()=>[[{ownerAdminId:10,status}]];assert.equal((await run(EnrollmentAccess,{admin:advertiser,params:{enrollId:'22',type:'applied'}})).res.statusCode,403)}});
