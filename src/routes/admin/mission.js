import { Router } from 'express';
import * as mission from "../../controllers/admin/mission.js";

const router = Router();
router.get('/', mission.GetMissionList); // 미션 리스트 조회
router.get('/status', mission.GetMissionStatus); // 미션 리스트 조회
router.get('/:id', mission.GetMissionDetail); // 미션 상세 조회
router.post('/:id', mission.PostMission); // 미션 생성 또는 수정
router.delete('/:id', mission.DeleteMission); // 미션 삭제
router.post('/status/:enrollId/:type', mission.SelectMissionUser); // 미션 선정자 지정

export default router;

