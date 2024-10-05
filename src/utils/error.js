const ERROR = {
  // AUTH 10XX
  NOT_MATCH_CODE: { code: 1001, msg: '인증코드가 일치하지 않습니다.' },
  EXPIRE_CODE: { code: 1002, msg: "인증코드가 만료되었습니다." },
  DUPLICATED_EMAIL: { code: 1003, msg: '이미 가입된 이메일입니다.' },
  NO_USER_BY_EMAIL: { code: 1004, msg: '가입된 이메일이 없습니다.' },
  NOT_MATCH_LOGIN_INFO: { code: 1005, msg: '이메일이나 비밀번호가 일치하지 않습니다.' },

  NEED_PASSWORD: { code: 1010, msg: '비밀번호를 입력해주세요.' },
  NEED_LINK: { code: 1011, msg: '링크를 입력해주세요.' },
  DUPLICATED_LINK: { code: 1012, msg: '이미 등록된 링크입니다.' },
  NEED_ACCOUNT: { code: 1013, msg: '계좌번호를 입력해주세요.' },
  NEED_DEPOSITOR: { code: 1014, msg: '예금주를 입력해주세요.' },

  // COMMON 90XX
  NEED_IMAGE: { code: 9001, msg: '업로드할 이미지가 없습니다.' },

};

export default code => {
  return ERROR[code];
};
