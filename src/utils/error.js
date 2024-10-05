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

  // USER PROFILE 20XX
  NEED_TITLE: { code: 2001, msg: '프로필명이 필요합니다.' },
  NEED_PROFILE_IMAGE: { code: 2002, msg: '프로필 이미지가 필요합니다.' },
  NEED_PROFILE_BACKGROUND_IMAGE: { code: 2003, msg: '프로필 배경 이미지가 필요합니다.' },
  NEED_DESIGN_BACKGROUND_TYPE: { code: 2004, msg: '프로필 디자인 배경 타입이 필요합니다.' },
  NEED_DESIGN_BACKGROUND_IMAGE: { code: 2005, msg: '프로필 디자인 배경 이미지가 필요합니다.' },
  NEED_DESIGN_BACKGROUND_COLOR: { code: 2006, msg: '프로필 디자인 배경 색상이 필요합니다.' },
  NEED_DESIGN_BUTTON_TEXT: { code: 2007, msg: '프로필 디자인 버튼 텍스트가 필요합니다.' },
  NEED_DESIGN_BUTTON_BACKGROUND_COLOR: { code: 2008, msg: '프로필 디자인 버튼 배경 색상이 필요합니다.' },
  NEED_DESIGN_BUTTON_TEXT_COLOR: { code: 2009, msg: '프로필 디자인 버튼 텍스트 색상이 필요합니다.' },
  NEED_DESIGN_BUTTON_TEXT_FONT: { code: 2010, msg: '프로필 디자인 버튼 폰트가 필요합니다.' },

  // USER INQUIRY 30XX
  NEED_INQUIRY_BLOCK_ID: { code: 3001, msg: 'block id가 필요합니다.' },
  NEED_INQUIRY_CONTENTS: { code: 3002, msg: '문의내용을 입력해주세요.' },
  NEED_INQUIRY_NAME: { code: 3003, msg: '이름을 입력해주세요.' },
  NEED_INQUIRY_LINE_ID: { code: 3004, msg: '라인 ID를 입력해주세요.' },
  NEED_INQUIRY_TITLE: { code: 3005, msg: 'block title이 필요합니다.' },

  // COMMON 90XX
  NEED_IMAGE: { code: 9001, msg: '업로드할 이미지가 없습니다.' },

};

export default code => {
  return ERROR[code];
};
