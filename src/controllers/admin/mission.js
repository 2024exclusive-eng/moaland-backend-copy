import * as Mission from '../../libs/mission.js';
import * as MissionEnroll from '../../libs/missionEnroll.js';

/**
 * @function GetMissionStatus
 * @description 미션 상황 조회
 * @returns {obj}
 */
export const GetMissionStatus = async (req, res, next) => {
  try {
    const statistics = await Mission.GetMissionStatistics();

    return res.status(200).json({
      success: true,
      statistics: {
        totalMissions: statistics.totalMissions,
        mustSelectToday: statistics.mustSelectToday,
        delayedEnrollments: statistics.delayedEnrollments,
        inProgress: statistics.inProgress
      }
    });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function GetMissionList
 * @description 미션 리스트 조회
 * @returns {obj}
 */
export const GetMissionList = async (req, res, next) => {
  try {
    const { page, item, search, status, selection_status, region, category, social, is_recommended } = req.query;

    const missions = await Mission.GetMissionListByStatus({
      page,
      item,
      search,
      status,
      selection_status,
      is_recommended,
      region,
      category,
      social
    });

    return res.status(200).json({ success: true, missions });
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
    const { id } = req.params;

    const mission = await Mission.GetMissionByMissionId(id);
    const enrollUser = await MissionEnroll.GetUsersByMissionId(id);

    const enrollUsersByStatus = enrollUser.reduce((acc, user) => {
      if (!acc[user.status]) {
        acc[user.status] = [];
      }
      acc[user.status].push(user);
      return acc;
    }, { applied: [], selected: [], completed: [], rejected: [] });

    const enrollUsers = enrollUsersByStatus.applied;
    const selectUsers = enrollUsersByStatus.selected;
    const completeUsers = enrollUsersByStatus.completed;
    const rejectUsers = enrollUsersByStatus.rejected;

    return res.status(200).json({ success: true, mission, enrollUsers, selectUsers, completeUsers, rejectUsers });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function PostMission
 * @description 미션 생성 또는 수정
 * @returns {obj}
 */
export const PostMission = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(req.body);

    if (id === "new") {
      await Mission.InsertMission(req.body);
    } else {
      await Mission.UpdateMission(id, req.body);
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function DeleteMission
 * @description 미션 삭제
 * @returns {obj}
 */
export const DeleteMission = async (req, res, next) => {
  try {
    const { id } = req.params;

    await Mission.DeleteMission(id);

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function SelectMissionUser
 * @description 사용자 선정
 * @returns {obj}
 */
export const SelectMissionUser = async (req, res, next) => {
  try {
    const { enrollId, type } = req.params;
    await MissionEnroll.UpdateMissionEnrollStatus(enrollId, type);

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function SelectMissionUser
 * @description 사용자 선정
 * @returns {obj}
 */
export const UpdatePublicMission = async (req, res, next) => {
  try {
    const { missionId } = req.params;
    const { status } = req.body;
    await Mission.UpdatePublicMission(missionId, status);

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function SelectMissionUser
 * @description 사용자 선정
 * @returns {obj}
 */
export const UpdateRecommendedMission = async (req, res, next) => {
  try {
    const { missionId } = req.params;
    const { is_recommended } = req.body;
    await Mission.UpdateRecommendedMission(missionId, is_recommended);

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function GetMissionFilterCounts
 * @description 미션 필터 카운트 조회 (UI 필터 옵션에 표시할 숫자)
 * @returns {obj}
 */
export const GetMissionFilterCounts = async (req, res, next) => {
  try {
    const counts = await Mission.GetMissionFilterCounts();

    return res.status(200).json({ success: true, counts });
  } catch (e) {
    return next(e);
  }
};
