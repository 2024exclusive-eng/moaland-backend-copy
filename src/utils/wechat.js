import { timingSafeEqual, createHmac } from 'node:crypto';
export const equalSecret = (a, b) => typeof a === 'string' && typeof b === 'string' && b.length >= 32 && Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b));
export const isWechatVisible = m => !!m && Number(m.isPublic ?? m.is_public) === 1 && Number(m.isWechatPublic ?? m.is_wechat_public) === 1 && !['hospital', 'massage'].includes(String(m.category).toLowerCase());
export const mpError = (res, code, status = 400) => res.status(status).json({ success: false, error: { code } });
export async function notifyRelay(event, missionId) {
  if (!process.env.MP_RELAY_URL || !process.env.WEBHOOK_SECRET) return;
  const body = JSON.stringify({ event, ...(missionId ? { missionId: String(missionId) } : {}) });
  const timestamp = String(Date.now());
  try {
    const r = await fetch(new URL('/internal/hooks/mission', process.env.MP_RELAY_URL), { method: 'POST', body, signal: AbortSignal.timeout(3000), headers: { 'Content-Type': 'application/json', 'X-KV-Timestamp': timestamp, 'X-KV-Signature': createHmac('sha256', process.env.WEBHOOK_SECRET).update(timestamp + body).digest('hex') } });
    if (!r.ok) throw new Error('HOOK_FAILED');
  } catch { console.warn('MP_HOOK_FAILED'); }
}
export async function checkMpText(content, openid) {
  if (!process.env.MP_RELAY_URL || !process.env.INTERNAL_API_KEY) throw new Error('MP_MODERATION_UNAVAILABLE');
  const r = await fetch(new URL('/internal/moderate', process.env.MP_RELAY_URL), { method: 'POST', signal: AbortSignal.timeout(5000), headers: { 'Content-Type': 'application/json', 'X-Internal-Key': process.env.INTERNAL_API_KEY }, body: JSON.stringify({ content, openid }) });
  if (!r.ok || !(await r.json()).success) throw new Error('MP_CONTENT_REJECTED');
}
