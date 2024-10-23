import pool from '../../utils/pool.js';
import EC from '../../utils/error.js';
import * as Mission from '../../libs/mission.js';
import * as MissionEnroll from '../../libs/missionEnroll.js';
import { isEmpty } from '../../utils/common.js';

/**
 * @function GetMissionList
 * @description 미션 리스트 조회
 * @returns {obj}
 */
export const GetMissionList = async (req, res, next) => {
  try {
    const { page, item, category, social } = req.query;
    const data = await Mission.GetMissionList({ page, item, category, social });

    return res.status(200).json({ success: true, data });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function GetMissionDetail
 * @description 미션 상세 조회
 * @returns {obj}
 */
export const GetMissionDetail = async (req, res, next) => {
  try {
    const userId = req.decoded.id ? req.decoded.id : -1;
    const { missionId } = req.params;

    const mission = await Mission.GetMissionByMissionId(missionId);
    const isEnrolled = await MissionEnroll.CheckUserMissionEnroll(missionId, userId);

    return res.status(200).json({ success: true, mission, isEnrolled });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function GetMyMissionList
 * @description 미션 신청 리스트 조회
 * @returns {obj}
 */
export const GetMyMissionList = async (req, res, next) => {
  try {
    const userId = req.decoded.id;
    const { page, item, type } = req.query;

    const myMissionList = await MissionEnroll.GetMissionListByUserId({ userId, page, item, type });

    return res.status(200).json({ success: true, data: myMissionList });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function EnrollMission
 * @description 미션 신청
 * @returns {obj}
 */
export const EnrollMission = async (req, res, next) => {
  try {
    const { missionId } = req.params;
    const userId = req.decoded.id;
    const { name, social, address } = req.body;

    // 유효성 검사
    if (isEmpty(name)) return res.status(200).json({ success: false, error: EC('MISSION_NEED_NAME') });
    if (isEmpty(social)) return res.status(200).json({ success: false, error: EC('MISSION_NEED_SOCIAL') });
    if (isEmpty(address)) return res.status(200).json({ success: false, error: EC('MISSION_NEED_ADDRESS') });

    // 미션 정보 확인 (신청자 수, 시작/종료 날짜 등)
    const missionDetail = await Mission.GetMissionByMissionId(missionId);

    const existingEnroll = await MissionEnroll.CheckUserMissionEnroll(missionId, userId);
    if (existingEnroll)
      return res.status(200).json({ success: false, error: EC('MISSION_ALREADY_ENROLLED') });

    // 1. 신청자가 max_enroll을 넘었는지 확인
    const enrollCount = await MissionEnroll.GetMissionEnrollCount(missionId);
    if (enrollCount >= missionDetail.maxEnroll)
      return res.status(200).json({ success: false, error: EC('MISSION_MAX_ENROLL_REACHED') });

    // 2. 미션이 시작 전인지 확인
    const currentDate = new Date();
    if (currentDate < new Date(missionDetail.enrollStartDate))
      return res.status(200).json({ success: false, error: EC('MISSION_ALREADY_STARTED') });

    // 3. 미션이 종료되지 않았는지 확인
    if (currentDate > new Date(missionDetail.enrollEndDate))
      return res.status(200).json({ success: false, error: EC('MISSION_ALREADY_ENDED') });

    // 미션 신청 등록 (mission_enroll 테이블에 row 생성)
    await MissionEnroll.InsertMissionEnroll(missionId, userId);

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function CancelEnrollMission
 * @description 미션 신청 취소
 * @returns {obj}
 */
export const CancelEnrollMission = async (req, res, next) => {
  try {
    const { missionId } = req.params;
    const userId = req.decoded.id;

    await MissionEnroll.DeleteMissionEnroll(missionId, userId);

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function PostMissionContents
 * @description 미션 컨텐츠 등록
 * @returns {obj}
 */
export const PostMissionContents = async (req, res, next) => {
  try {
    const { missionId } = req.params;
    const userId = req.decoded.id;
    const { link } = req.body;

    await MissionEnroll.UpdateMissionContent({ missionId, userId, link });

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};
