const ERROR = {
  // AUTH 10XX
  NOT_MATCH_CODE: { code: 1001, msg: '인증코드가 일치하지 않습니다.' },
  EXPIRE_CODE: { code: 1002, msg: "인증코드가 만료되었습니다." },
  DUPLICATED_EMAIL: { code: 1003, msg: '이미 가입된 이메일입니다.' },
  NO_USER_BY_EMAIL: { code: 1004, msg: '가입된 이메일이 없습니다.' },
  DUPLICATED_DISCORD: { code: 1034, msg: 'Duplicate discord' },
  ALREADY_TWITTER: { code: 1035, msg: 'Twitter already connected' },
  DUPLICATED_TWITTER: { code: 1036, msg: 'Duplicate twitter' },
  DUPLICATED_NICKNAME: { code: 1040, msg: 'Duplicate nickname' },
  // POINT 20XX
  NOT_ENOUGH_POINT: { code: 2010, msg: 'Not enough points' },
  // EVENT 90XX
  ALREADY_ATTENDED: { code: 9050, msg: 'Already attended' },
  MAX_ATTENDED: { code: 9051, msg: 'Already Max attended' },
  ALREADY_MBTI: { code: 9052, msg: 'Already attended mbti/blood' },
  MAX_CHAT_TODAY: { code: 9060, msg: 'Already Max chat today' },
  MAX_IMAGE_TODAY: { code: 9070, msg: 'Already Max image today' },
  MAX_RAFFLE_TODAY: { code: 9080, msg: 'Already Max raffle today' },
};

export default code => {
  return ERROR[code];
};
