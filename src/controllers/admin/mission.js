import pool from '../../utils/pool.js';
import EC from '../../utils/error.js';
import * as Mission from '../../libs/mission.js';
import * as MissionEnroll from '../../libs/missionEnroll.js';
import { isEmpty } from '../../utils/common.js';

/**
 * @function GetMissionStatus
 * @description 미션 상황 조회
 * @returns {obj}
 */
export const GetMissionStatus = async (req, res, next) => {
  try {

    const newMissions = await Mission.GetMissionListByStatus('new');
    const selectMissions = await Mission.GetMissionListByStatus('select');
    const selectedMissions = await Mission.GetMissionListByStatus('selected');
    const completeMissions = await Mission.GetMissionListByStatus('complete');

    return res.status(200).json({
      success: true,
      newMissions: newMissions.paging.totalItems,
      selectMissions: selectMissions.paging.totalItems,
      selectedMissions: selectedMissions.paging.totalItems,
      completeMissions: completeMissions.paging.totalItems
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
    const { page, item, type } = req.query;

    const missions = await Mission.GetMissionListByStatus(type, { page, item });

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
    }, { enroll: [], select: [], complete: [] });

    const enrollUsers = enrollUsersByStatus.enroll;
    const selectUsers = enrollUsersByStatus.select;
    const completeUsers = enrollUsersByStatus.complete;

    return res.status(200).json({ success: true, mission, enrollUsers, selectUsers, completeUsers });
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