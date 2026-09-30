import test from 'node:test';import assert from 'node:assert/strict';import {timestamp,templates} from '../src/utils/notificationPolicy.js';
test('invalid calendar days must not roll into another month',()=>{assert.throws(()=>timestamp('2026-02-30T12:00:00+09:00'));assert.equal(timestamp('2028-02-29T12:00:00+09:00').toISOString(),'2028-02-29T03:00:00.000Z');});
test('null template configuration fails closed instead of crashing',()=>{assert.deepEqual(templates({WX_NOTIFICATION_TEMPLATES:'null'}),{});});
