import { Router } from 'express';
import * as mission from "../../controllers/admin/mission.js";

const router = Router();
router.get('/', mission.GetMissionList); // 미션 리스트 조회
router.get('/status', mission.GetMissionStatus); // 미션 상태 조회
router.get('/filter-counts', mission.GetMissionFilterCounts); // 필터 카운트 조회
router.get('/pin/:section', mission.GetPinnedMissions); // 홈 섹션 고정 슬롯 조회 ('/:id' 보다 위)
router.put('/pin/:section', mission.SetPinnedMissions); // 홈 섹션 고정 슬롯 저장
router.get('/:id', mission.GetMissionDetail); // 미션 상세 조회
router.post('/:id', mission.PostMission); // 미션 생성 또는 수정
router.delete('/:id', mission.DeleteMission); // 미션 삭제
router.post('/status/:enrollId/:type', mission.SelectMissionUser); // 미션 선정자 지정
router.put('/:missionId/draft', mission.UpdatePublicMission); // 미션 공개/비공개 설정
router.put('/:missionId/recommended', mission.UpdateRecommendedMission); // 미션 공개/비공개 설정

export default router;

