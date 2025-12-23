import * as User from '../../libs/user.js';
import * as MissionEnroll from '../../libs/missionEnroll.js';

/**
 * @function GetUserList
 * @description 사용자 리스트 조회
 * @returns {obj}
 */
export const GetUserList = async (req, res, next) => {
  try {
    const { page, item, search } = req.query;
    const data = await User.GetUserList({ page, item }, search);

    return res.status(200).json({ success: true, data });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function GetUserDetail
 * @description 사용자 상세 조회
 * @returns {obj}
 */
export const GetUserDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.GetUserOneById(id);

    delete user.password;

    const enrollMission = await MissionEnroll.GetMissionListByUserId({ userId: id, page: 1, item: 10000, type: "selected" });
    const selectMission = await MissionEnroll.GetMissionListByUserId({ userId: id, page: 1, item: 10000, type: "applied" });
    const completeMission = await MissionEnroll.GetMissionListByUserId({ userId: id, page: 1, item: 10000, type: "completed" });
    const endedMission = await MissionEnroll.GetMissionListByUserId({ userId: id, page: 1, item: 10000, type: "ended" });

    return res.status(200).json({ success: true, user, enrollMission, selectMission, completeMission, endedMission });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function GetUserStatus
 * @description 사용자 통계 조회 (총 사용자 수, 최근 30일 신규 가입자, 탈퇴 회원)
 * @returns {obj}
 */
export const GetUserStatus = async (req, res, next) => {
  try {
    const data = await User.GetUserStatus();

    return res.status(200).json({ success: true, data });
  } catch (e) {
    return next(e);
  }
};
