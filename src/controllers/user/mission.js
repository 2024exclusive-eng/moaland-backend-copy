import pool from '../../utils/pool.js';
import EC from '../../utils/error.js';
import * as Mission from '../../libs/mission.js';
import * as MissionEnroll from '../../libs/missionEnroll.js';
import { isEmpty, getKSTDate, getKSTDateOnly, getKSTEndOfDay } from '../../utils/common.js';

/**
 * @function GetMissionList
 * @description 미션 리스트 조회
 * @returns {obj}
 */
export const GetMissionList = async (req, res, next) => {
  try {
    const { page, item, category, social, is_recommended, deadline_days, sort, region, search } = req.query;
    const data = await Mission.GetMissionList({ page, item, category, social, is_recommended, search, deadline_days, sort, region });

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
    const userId = req.decoded?.id ? req.decoded.id : -1;
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
    const { name, instagramLink, wechatId, visitDatetimeStart, visitDatetimeEnd, memo } = req.body;

    // 유효성 검사
    if (isEmpty(name)) return res.status(200).json({ success: false, error: EC('MISSION_NEED_NAME') });
    if (isEmpty(instagramLink)) return res.status(200).json({ success: false, error: EC('MISSION_NEED_INSTAGRAM') });
    if (isEmpty(wechatId)) return res.status(200).json({ success: false, error: EC('MISSION_NEED_WECHAT') });
    if (isEmpty(visitDatetimeStart)) return res.status(200).json({ success: false, error: EC('MISSION_NEED_VISIT_DATE') });
    if (isEmpty(visitDatetimeEnd)) return res.status(200).json({ success: false, error: EC('MISSION_NEED_VISIT_DATE') });

    // 미션 정보 확인 (신청자 수, 시작/종료 날짜 등)
    const missionDetail = await Mission.GetMissionByMissionId(missionId);

    const existingEnroll = await MissionEnroll.CheckUserMissionEnroll(missionId, userId);
    if (existingEnroll)
      return res.status(200).json({ success: false, error: EC('MISSION_ALREADY_ENROLLED') });

    // 1. 신청자가 max_enroll을 넘었는지 확인
    const enrollCount = await MissionEnroll.GetMissionEnrollCount(missionId);
    if (enrollCount >= missionDetail.maxEnroll)
      return res.status(200).json({ success: false, error: EC('MISSION_MAX_ENROLL_REACHED') });

    // 2. 미션이 시작 전인지 확인 (KST 기준으로 날짜만 비교하여 당일 전체 가능)
    const currentDateKST = getKSTDate();
    const currentDateOnlyKST = getKSTDateOnly(currentDateKST);
    const enrollStartDateKST = getKSTDateOnly(missionDetail.enrollStartDate);
    const enrollEndDateKST = getKSTEndOfDay(missionDetail.enrollEndDate);

    if (currentDateOnlyKST < enrollStartDateKST)
      return res.status(200).json({ success: false, error: EC('MISSION_ALREADY_STARTED') });

    // 3. 미션이 종료되지 않았는지 확인 (종료일 23:59:59 KST까지 가능)
    if (currentDateKST > enrollEndDateKST)
      return res.status(200).json({ success: false, error: EC('MISSION_ALREADY_ENDED') });

    // 미션 신청 등록 (mission_enroll 테이블에 row 생성)
    await MissionEnroll.InsertMissionEnroll(missionId, userId, name, instagramLink, wechatId, visitDatetimeStart, visitDatetimeEnd, memo);

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function CheckEnrollStatus
 * @description Check if user is enrolled in a mission and get enrollment details
 * @returns {obj}
 */
export const CheckEnrollStatus = async (req, res, next) => {
  try {
    const { missionId } = req.params;
    const userId = req.decoded.id;

    const enrollment = await MissionEnroll.GetUserMissionEnroll(missionId, userId);

    if (!enrollment) {
      return res.status(200).json({
        success: true,
        isEnrolled: false,
        enrollment: null
      });
    }

    return res.status(200).json({
      success: true,
      isEnrolled: true,
      enrollment
    });
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
 * @description 미션 컨텐츠 등록 (전체 링크 객체)
 * @param {object} req.body.links - JSON object with platform URLs: {Xiaohongshu: "url", Instagram: "url"}
 * @returns {obj}
 */
export const PostMissionContents = async (req, res, next) => {
  try {
    const { missionId } = req.params;
    const userId = req.decoded.id;
    const { links } = req.body;  // Expects full object: {Xiaohongshu: "url", Instagram: "url"}

    // Validate links is provided
    if (!links || typeof links !== 'object' || Object.keys(links).length === 0) {
      return res.status(400).json({
        success: false,
        error: EC('MISSION_NEED_LINKS')
      });
    }

    // Get mission details to validate
    const mission = await Mission.GetMissionByMissionId(missionId);

    if (!mission) {
      return res.status(404).json({
        success: false,
        error: EC('MISSION_NOT_FOUND')
      });
    }

    // Check if within mission period OR content registration period using KST
    const nowKST = getKSTDate();
    const nowKSTDateOnly = getKSTDateOnly(nowKST);

    // Convert mission dates to KST for comparison
    const missionStartDateKST = mission.missionStartDate ? getKSTDateOnly(mission.missionStartDate) : null;
    const missionEndDateKST = mission.missionEndDate ? getKSTEndOfDay(mission.missionEndDate) : null;
    const contentStartDateKST = mission.contentStartDate ? getKSTDateOnly(mission.contentStartDate) : null;
    const contentEndDateKST = mission.contentEndDate ? getKSTEndOfDay(mission.contentEndDate) : null;

    // Check if within mission period (until end of day KST)
    const withinMissionPeriod = missionStartDateKST && missionEndDateKST
      ? (nowKST >= missionStartDateKST && nowKST <= missionEndDateKST)
      : false;

    // Check if within content period (until 11:59 PM KST on end date)
    const withinContentPeriod = (() => {
      if (contentEndDateKST && nowKST > contentEndDateKST) return false;
      if (contentStartDateKST && nowKSTDateOnly < contentStartDateKST) return false;
      // If both dates are null, consider it as no restriction
      if (!contentStartDateKST && !contentEndDateKST) return true;
      return true;
    })();

    // Allow if within either period
    if (!withinMissionPeriod && !withinContentPeriod) {
      // Determine which error to show
      if (contentEndDateKST && nowKST > contentEndDateKST) {
        return res.status(403).json({
          success: false,
          error: EC('MISSION_CONTENT_PERIOD_EXPIRED')
        });
      }
      if (contentStartDateKST && nowKSTDateOnly < contentStartDateKST) {
        return res.status(403).json({
          success: false,
          error: EC('MISSION_CONTENT_PERIOD_NOT_STARTED')
        });
      }
    }

    // Validate all required platforms are submitted
    const requiredPlatforms = mission.social ? mission.social.split(',').map(p => p.trim()) : [];
    const submittedPlatforms = Object.keys(links);
    const missingPlatforms = requiredPlatforms.filter(p => !submittedPlatforms.includes(p));

    if (missingPlatforms.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSION_MISSING_PLATFORMS',
          message: `Missing links for: ${missingPlatforms.join(', ')}`
        }
      });
    }

    // Validate all URLs are valid
    for (const [platform, url] of Object.entries(links)) {
      if (!url || !isValidUrl(url)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSION_INVALID_URL',
            message: `Invalid URL for ${platform}`
          }
        });
      }
    }

    // Update mission content with JSON object
    await MissionEnroll.UpdateMissionContent({ missionId, userId, links });

    return res.status(200).json({
      success: true,
      data: { links }
    });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function isValidUrl
 * @description Validate URL format - accepts full URLs or domain patterns
 * @param {string} url - Can be "https://google.com" or "google.com"
 * @returns {boolean}
 */
function isValidUrl(url) {
  try {
    // Try validating as-is first (for full URLs with protocol)
    new URL(url);
    return true;
  } catch {
    // If that fails, try prepending https:// (for domain patterns like "google.com")
    try {
      new URL(`https://${url}`);
      return true;
    } catch {
      return false;
    }
  }
}
