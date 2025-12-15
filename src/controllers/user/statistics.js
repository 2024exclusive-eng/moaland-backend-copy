import * as UserBlockClock from '../../libs/userBlockClick.js';
import * as UserStatistics from '../../libs/userStatistics.js';
import moment from 'moment';

/**
 * @function GetStatistics
 * @description 사용자 분석 조회
 * @returns {obj}
 */
export const GetStatistics = async (req, res, next) => {
  try {
    const userId = req.decoded.id;
    const date = req.query.date ? req.query.date : moment().format('YYYY-MM-DD');

    const blockClick = await UserBlockClock.GetUserBlockClickByDate(userId, date);
    const linkView = await UserStatistics.GetUserStatisticsByDate(userId, date);
    const blockRank = await UserBlockClock.GetUserBlockClickRank(userId, date);

    return res.status(200).json({ success: true, data: { blockClick, linkView, blockRank } });
  } catch (e) {
    return next(e);
  }
};
