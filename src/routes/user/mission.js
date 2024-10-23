import { Router } from 'express';
import { LoginCheck } from '../../middlewares/auth.js';
import * as mission from "../../controllers/user/mission.js";

const router = Router();
router.get('/info', mission.GetMissionList); // 미션 리스트 조회
router.get('/info/:missionId', mission.GetMissionDetail); // 미션 상세 조회
router.get('/my', LoginCheck, mission.GetMyMissionList); // 미션 신청 리스트 조회
router.post('/my/:missionId', LoginCheck, mission.EnrollMission); // 미션 신청
router.delete('/my/:missionId', LoginCheck, mission.CancelEnrollMission); // 미션 신청 취소
router.put('/my/:missionId', LoginCheck, mission.PostMissionContents); // 미션 컨텐츠 등록

export default router;
