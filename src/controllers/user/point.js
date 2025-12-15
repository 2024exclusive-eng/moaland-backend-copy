import EC from '../../utils/error.js';
import * as Point from '../../libs/point.js';
import { isEmpty } from '../../utils/common.js';

/**
 * @function GetPoint
 * @description 포인트 내역 조회
 * @returns {obj}
 */
export const GetPoint = async (req, res, next) => {
  try {
    const userId = req.decoded.id;
    const { page, item, type = 'deposit' } = req.query;

    const totalPoint = await Point.GetTotalPoint(userId);
    const expectedPoint = await Point.GetExpectedPoint(userId);
    const pointData = await Point.GetPointList({ userId, page, item, type: isEmpty(type) ? 'deposit' : type });

    return res.status(200).json({ success: true, totalPoint, expectedPoint, data: pointData });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function WithdrawalPoint
 * @description 포인트 출금 신청
 * @returns {obj}
 */
export const WithdrawalPoint = async (req, res, next) => {
  try {
    const userId = req.decoded.id;
    const { point } = req.body;

    const totalPoint = await Point.GetTotalPoint(userId);
    if (parseInt(totalPoint) < parseInt(point))
      return res.status(200).json({ success: false, error: EC('NOT_ENOUGH_BALANCE') });

    await Point.WithdrawalPoint(userId, parseInt(point) * -1);


    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};
