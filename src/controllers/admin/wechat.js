import pool from '../../utils/pool.js';
import { checkMpText, mpError, notifyRelay } from '../../utils/wechat.js';
export async function SetWechatVisibility(req,res,next) {
  try {
    const enabled=req.body.enabled;
    if(typeof enabled!=='boolean') return mpError(res,'INVALID_VISIBILITY');
    const [rows]=await pool.query('SELECT category,title_cn,goods_contents_cn FROM mission WHERE id=?',[req.params.missionId]);
    if(!rows.length)return mpError(res,'MISSION_NOT_FOUND',404);
    const m=rows[0];
    if(enabled) {
      if(['hospital','massage'].includes(String(m.category).toLowerCase()))return mpError(res,'MP_CATEGORY_BLOCKED');
      try { await checkMpText([m.title_cn,m.goods_contents_cn].filter(Boolean).join('\n')); } catch { return mpError(res,'MP_CONTENT_REJECTED',422); }
    }
    // Compare the checked text/category to avoid publishing a concurrently edited mission.
    const [result]=await pool.query('UPDATE mission SET is_wechat_public=? WHERE id=? AND category <=> ? AND title_cn <=> ? AND goods_contents_cn <=> ?', [enabled?1:0,req.params.missionId,m.category,m.title_cn,m.goods_contents_cn]);
    if(!result.affectedRows)return mpError(res,'MISSION_CHANGED_RETRY',409);
    await notifyRelay('mission.visibility',req.params.missionId);
    res.json({success:true,data:{isWechatPublic:enabled}});
  } catch(e){next(e);}
}
