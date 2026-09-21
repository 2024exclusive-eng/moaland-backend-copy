import { equalSecret, mpError } from '../utils/wechat.js';
export function internalGuard(req, res, next) {
  const valid = equalSecret(req.get('X-Internal-Key'), process.env.INTERNAL_API_KEY);
  if (req.path.startsWith('/internal') && !valid) return mpError(res, 'UNAUTHORIZED', 401);
  req.isInternal = valid;
  req.clientChannel = valid && req.get('X-Client-Channel') === 'wechat_mp' ? 'wechat_mp' : 'web';
  next();
}
