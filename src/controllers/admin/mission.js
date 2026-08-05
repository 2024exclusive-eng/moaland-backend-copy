import EC from '../../utils/error.js';
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
        inProgress: statistics.inProgress,
        ended: statistics.ended
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

    // P35: 상세를 열었다 = 신청 건을 확인했다. 리스트의 빨간색 표기를 해제한다.
    await Mission.MarkEnrollSeen(id);

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

/**
 * @function GetPinnedMissions
 * @description 섹션 고정 슬롯 목록 조회 (P34)
 * @returns {obj}
 */
export const GetPinnedMissions = async (req, res, next) => {
  try {
    const { section } = req.params;

    if (!Mission.PIN_COLUMNS[section]) {
      throw { status: 400, code: EC.INVALID_PARAMETER, message: 'Invalid section (new | deadline)' };
    }

    const data = await Mission.GetPinnedMissions(section);

    return res.status(200).json({ success: true, data });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function SetPinnedMissions
 * @description 섹션 고정 슬롯을 통째로 교체 (배열 순서 = 슬롯 순서). 목록에 없으면 고정 해제. (P34)
 * @returns {obj}
 */
export const SetPinnedMissions = async (req, res, next) => {
  try {
    const { section } = req.params;
    const { missionIds } = req.body;

    if (!Mission.PIN_COLUMNS[section]) {
      throw { status: 400, code: EC.INVALID_PARAMETER, message: 'Invalid section (new | deadline)' };
    }

    if (!Array.isArray(missionIds) || missionIds.some(id => !Number.isInteger(Number(id)))) {
      throw { status: 400, code: EC.INVALID_PARAMETER, message: 'missionIds must be an array of mission ids' };
    }

    await Mission.SetPinnedMissions(section, missionIds.map(Number));

    return res.status(200).json({ success: true, message: 'Pinned missions updated successfully' });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function SetManualEnrollCount
 * @description 캠페인 리스트에 노출할 신청자 수를 임의로 지정/해제한다. (P36)
 *              count 가 null 이면 실제 신청 수 표기로 되돌린다.
 * @returns {obj}
 */
export const SetManualEnrollCount = async (req, res, next) => {
  try {
    const { missionId } = req.params;
    const { count } = req.body;

    // null / '' 은 '임의 지정 해제'로 다룬다
    const manualCount = count === null || count === undefined || count === '' ? null : Number(count);

    if (manualCount !== null && (!Number.isInteger(manualCount) || manualCount < 0)) {
      throw { status: 400, code: EC.INVALID_PARAMETER, message: 'count must be a non-negative integer or null' };
    }

    const mission = await Mission.GetMissionByMissionId(missionId);
    if (!mission) {
      throw { status: 404, code: EC.NOT_FOUND, message: 'Mission not found' };
    }

    // 이 숫자는 사용자 화면에도 그대로 노출되므로 모집 인원을 넘지 않게 제한한다.
    // (넘기면 사용자에게 '신청 50/15' 처럼 보인다)
    const capped =
      manualCount !== null && mission.maxEnroll > 0
        ? Math.min(manualCount, mission.maxEnroll)
        : manualCount;

    await Mission.SetManualEnrollCount(missionId, capped);

    return res.status(200).json({ success: true, count: capped, message: 'Enroll count updated successfully' });
  } catch (e) {
    return next(e);
  }
};
