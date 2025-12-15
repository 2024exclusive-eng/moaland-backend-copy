import pool from '../utils/pool.js';


/**
 * @function GetUserProfile
 * @param {object} txPool - 트랜잭션 풀
 * @param {object} params - 함수 파라미터
 * @param {number} params.userId - 생성된 사용자의 ID
 * @returns {Promise<number>}
 */
export const GetUserProfile = async (userId) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
         name,
         description,
         layout,
         profile_img AS profileImg,
         profile_background_image AS profileBackgroundImage,
         background_type AS backgroundType,
         background_img AS backgroundImg,
         background_color AS backgroundColor,
         effect,
         is_button AS isButton,
         button_text AS buttonText,
         button_url AS buttonUrl,
         block_background_color AS blockBackgroundColor,
         block_text_font AS blockTextFont,
         block_layout AS blockLayout
       FROM user_profile
       WHERE user_id = ?`,
      [userId]
    );

    return rows.length ? rows[0] : null;
  } catch (e) {
    throw e;
  }
};

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
export const UpdateUserProfile = async (txPool, { userId, name, description, layout, profileImg, profileBackgroundImage, isButton, buttonText, buttonUrl }) => {
  try {
    const conn = txPool ?? pool;

    const [data] = await conn.query(
      `UPDATE user_profile
       SET
         name = ?,
         description = ?,
         layout = ?,
         profile_img = CASE WHEN ? IS NOT NULL THEN ? ELSE profile_img END,
         profile_background_image = CASE WHEN ? IS NOT NULL THEN ? ELSE profile_background_image END,
         is_button = ?,
         button_text = CASE WHEN ? IS NOT NULL THEN ? ELSE button_text END,
         button_url = CASE WHEN ? IS NOT NULL THEN ? ELSE button_url END
       WHERE user_id = ?`,
      [
        name,
        description ? description : null,
        layout ?? 'LAYOUT_BASIC',
        profileImg, profileImg,
        profileBackgroundImage, profileBackgroundImage,
        isButton,
        buttonText, buttonText,
        buttonUrl, buttonUrl,
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
  blockBackgroundColor,
  blockTextFont,
  blockLayout
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
         block_background_color = CASE WHEN ? IS NOT NULL THEN ? ELSE block_background_color END,
         block_text_font = CASE WHEN ? IS NOT NULL THEN ? ELSE block_text_font END,
         block_layout = ?
       WHERE user_id = ?`,
      [
        backgroundType,
        backgroundImg, backgroundImg,
        backgroundColor, backgroundColor,
        effect,
        blockBackgroundColor, blockBackgroundColor,
        blockTextFont, blockTextFont,
        blockLayout,
        userId
      ]
    );

    return data.insertId;
  } catch (e) {
    throw e;
  }
};