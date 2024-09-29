import pool from '../utils/pool.js';

/**
 * @function GetNotice
 * @param {obj}
 * @returns {Promise([obj] | null)} {noticeData, Paging}
 */
export const GetNotice = async paging => {
  try {
    const itemsPerPage = Number(paging?.item ? paging.item : 30);
    const currentPage = paging?.page ? parseInt(paging.page) : 1;
    const offset = (currentPage - 1) * itemsPerPage;

    const [totalResult] = await pool.query(`SELECT count(id) AS total FROM notice`);
    const totalItems = totalResult[0].total;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const [data] = await pool.query(
      `SELECT notice.id, notice.title, notice.contents, notice.created FROM notice
      ORDER BY id DESC LIMIT ? OFFSET ?`,
      [itemsPerPage, offset],
    );

    return {
      data,
      paging: {
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage,
      },
    };
  } catch (e) {
    throw e;
  }
};
