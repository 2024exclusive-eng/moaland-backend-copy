export const getRandomNumber = async (min, max) => {
  return Math.random() * (max - min) + min;
};

export const getRandomString = num => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < num; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === "object" && Object.keys(value).length === 0) return true;

  return false;
};

/**
 * Get current date/time in KST (Korea Standard Time, UTC+9)
 * @returns {Date} Current date/time adjusted to KST
 */
export const getKSTDate = () => {
  const now = new Date();
  // Convert to KST by adding 9 hours to UTC
  const kstOffset = 9 * 60 * 60 * 1000; // 9 hours in milliseconds
  return new Date(now.getTime() + kstOffset + now.getTimezoneOffset() * 60 * 1000);
};

/**
 * Get KST date-only (midnight) for a given date
 * @param {Date|string} date - Date to convert
 * @returns {Date} Date set to midnight in KST
 */
export const getKSTDateOnly = (date) => {
  const d = new Date(date);
  // Convert to KST
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(d.getTime() + kstOffset + d.getTimezoneOffset() * 60 * 1000);
  // Set to midnight
  kstDate.setHours(0, 0, 0, 0);
  return kstDate;
};

/**
 * Get end of day (23:59:59.999) in KST for a given date
 * @param {Date|string} date - Date to convert
 * @returns {Date} Date set to end of day in KST
 */
export const getKSTEndOfDay = (date) => {
  const d = new Date(date);
  // Convert to KST
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(d.getTime() + kstOffset + d.getTimezoneOffset() * 60 * 1000);
  // Set to end of day
  kstDate.setHours(23, 59, 59, 999);
  return kstDate;
};