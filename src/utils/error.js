const ERROR = {
  // AUTH 10XX
  NOT_MATCH_CODE: { code: 1001, msg: '인증코드가 일치하지 않습니다.' },
  EXPIRE_CODE: { code: 1002, msg: "인증코드가 만료되었습니다." },
  DUPLICATED_EMAIL: { code: 1003, msg: '이미 가입된 이메일입니다.' },
  NO_USER_BY_EMAIL: { code: 1004, msg: '가입된 이메일이 없습니다.' },

  NEED_PASSWORD: { code: 1010, msg: '비밀번호를 입력해주세요.' },
};

export default code => {
  return ERROR[code];
};
