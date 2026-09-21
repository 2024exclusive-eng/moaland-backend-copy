import {SuperAdminOnly,MissionAccess,EnrollmentAccess} from '../../middlewares/adminAccess.js';
import {assignCampaign} from '../../libs/adminManagement.js';
import { Router } from 'express';
import * as mission from "../../controllers/admin/mission.js";

import { SetWechatVisibility } from '../../controllers/admin/wechat.js';
const router = Router();
router.put('/:missionId/wechat', SuperAdminOnly, MissionAccess, SetWechatVisibility);
router.get('/', mission.GetMissionList); // 미션 리스트 조회
router.get('/status', mission.GetMissionStatus); // 미션 상태 조회
router.get('/filter-counts', mission.GetMissionFilterCounts); // 필터 카운트 조회
router.get('/pin/:section', SuperAdminOnly, mission.GetPinnedMissions); // 홈 섹션 고정 슬롯 조회 ('/:id' 보다 위)
router.put('/pin/:section', SuperAdminOnly, mission.SetPinnedMissions); // 홈 섹션 고정 슬롯 저장
router.get('/:id', MissionAccess, mission.GetMissionDetail); // 미션 상세 조회
router.post('/:id', MissionAccess, mission.PostMission); // 미션 생성 또는 수정
router.delete('/:id', MissionAccess, mission.DeleteMission); // 미션 삭제
router.post('/status/:enrollId/:type', EnrollmentAccess, mission.SelectMissionUser); // 미션 선정자 지정
router.put('/:missionId/draft', MissionAccess, mission.UpdatePublicMission); // 미션 공개/비공개 설정
router.put('/:missionId/enroll-count', SuperAdminOnly, mission.SetManualEnrollCount); // 신청자 수 임의 등록/해제 (P36)
router.put('/:missionId/recommended', SuperAdminOnly, mission.UpdateRecommendedMission); // 미션 공개/비공개 설정

router.put('/:missionId/owner', SuperAdminOnly, MissionAccess, async(req,res,next)=>{try{await assignCampaign(req.params.missionId,req.body.ownerAdminId);res.json({success:true});}catch(e){next(e);}});
export default router;

