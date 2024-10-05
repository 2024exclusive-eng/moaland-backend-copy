import pool from '../utils/pool.js';

/**
 * @function InsertUserProfile
 * @param {object} txPool - 트랜잭션 풀
 * @param {object} params - 함수 파라미터
 * @param {number} params.userId - 생성된 사용자의 ID
 * @returns {Promise<number>}
 */
export const InsertUserProfile = async (txPool, { userId }) => {
  try {
    const conn = txPool ?? pool;

    const [data] = await conn.query(
      `INSERT INTO user_profile (user_id) VALUES (?)`,
      [userId]
    );

    return data.insertId;
  } catch (e) {
    throw e;
  }
};

/**
 * @function UpdateUserProfile
 * @param {object} txPool - 트랜잭션 풀
 * @param {object} params - 함수 파라미터
 * @param {number} params.userId - 생성된 사용자의 ID
 * @returns {Promise<number>}
 */
export const UpdateUserProfile = async (txPool, { userId, name, description, layout, profileImg, profileBackgroundImage }) => {
  try {
    const conn = txPool ?? pool;

    const [data] = await conn.query(
      `UPDATE user_profile
       SET
         name = ?,
         description = ?,
         layout = ?,
         profile_img = CASE WHEN ? IS NOT NULL THEN ? ELSE profile_img END,
         profile_background_image = CASE WHEN ? IS NOT NULL THEN ? ELSE profile_background_image END
       WHERE user_id = ?`,
      [
        name,
        description ? description : null,
        layout ?? 'LAYOUT_BASIC',
        profileImg, profileImg,
        profileBackgroundImage, profileBackgroundImage,
        userId
      ]
    );

    return data.insertId;
  } catch (e) {
    throw e;
  }
};

/**
 * @function UpdateUserProfileDesign
 * @param {object} txPool - 트랜잭션 풀
 * @param {object} params - 함수 파라미터
 * @returns {Promise<number>}
 */
export const UpdateUserProfileDesign = async (txPool, {
  userId,
  backgroundType,
  backgroundImg,
  backgroundColor,
  effect,
  isButton,
  buttonText,
  buttonBackgroundColor,
  buttonTextColor,
  buttonTextFont,
  buttonLayout
}) => {
  try {
    const conn = txPool ?? pool;
    const [data] = await conn.query(
      `UPDATE user_profile
       SET
         background_type = ?,
         background_img = CASE WHEN ? IS NOT NULL THEN ? ELSE background_img END,
         background_color = CASE WHEN ? IS NOT NULL THEN ? ELSE background_color END,
         effect = ?,
         is_button = ?,
         button_text = CASE WHEN ? IS NOT NULL THEN ? ELSE button_text END,
         button_background_color = CASE WHEN ? IS NOT NULL THEN ? ELSE button_background_color END,
         button_text_color = CASE WHEN ? IS NOT NULL THEN ? ELSE button_text_color END,
         button_text_font = CASE WHEN ? IS NOT NULL THEN ? ELSE button_text_font END,
         button_layout = ?
       WHERE user_id = ?`,
      [
        backgroundType,
        backgroundImg, backgroundImg,
        backgroundColor, backgroundColor,
        effect,
        isButton,
        buttonText, buttonText,
        buttonBackgroundColor, buttonBackgroundColor,
        buttonTextColor, buttonTextColor,
        buttonTextFont, buttonTextFont,
        buttonLayout,
        userId
      ]
    );

    return data.insertId;
  } catch (e) {
    throw e;
  }
};