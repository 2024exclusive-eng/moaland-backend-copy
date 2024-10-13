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
  NEED_DESIGN_BLOCK_BACKGROUND_COLOR: { code: 2008, msg: '프로필 디자인 버튼 배경 색상이 필요합니다.' },
  NEED_DESIGN_BLOCK_TEXT_FONT: { code: 2010, msg: '프로필 디자인 버튼 폰트가 필요합니다.' },

  NEED_PROFILE_BUTTON_TEXT: { code: 2011, msg: '프로필 버튼 텍스트가 필요합니다.' },
  NEED_PROFILE_BUTTON_URL: { code: 2012, msg: '프로필 버튼 링크가 필요합니다.' },

  // USER INQUIRY 30XX
  NEED_INQUIRY_BLOCK_ID: { code: 3001, msg: 'block id가 필요합니다.' },
  NEED_INQUIRY_CONTENTS: { code: 3002, msg: '문의내용을 입력해주세요.' },
  NEED_INQUIRY_NAME: { code: 3003, msg: '이름을 입력해주세요.' },
  NEED_INQUIRY_LINE_ID: { code: 3004, msg: '라인 ID를 입력해주세요.' },
  NEED_INQUIRY_TITLE: { code: 3005, msg: 'block title이 필요합니다.' },

  // USER BLOCK 40XX
  NEED_BLOCK_LINK_LINK: { code: 4001, msg: '링크 블록의 링크가 필요합니다.' },
  NEED_BLOCK_LINK_TITLE: { code: 4002, msg: '링크 블록의 제목이 필요합니다.' },
  NEED_BLOCK_LINK_LAYOUT: { code: 4003, msg: '링크 블록의 레이아웃이 필요합니다.' },
  NEED_BLOCK_LINK_IMAGE: { code: 4004, msg: '링크 블록의 이미지가 필요합니다.' },

  NEED_BLOCK_TEXT_TITLE: { code: 4011, msg: '텍스트 블록의 제목이 필요합니다.' },
  NEED_BLOCK_TEXT_ALIGN: { code: 4012, msg: '텍스트 블록의 정렬 정보가 필요합니다.' },

  NEED_BLOCK_IMAGE_LIST: { code: 4021, msg: '이미지 블록의 이미지 리스트가 필요합니다.' },
  NEED_BLOCK_IMAGE_LAYOUT: { code: 4022, msg: '이미지 블록의 레이아웃이 필요합니다.' },

  NEED_BLOCK_VIDEO_URL: { code: 4031, msg: '비디오 블록의 URL이 필요합니다.' },

  NEED_BLOCK_DIVIDER_TYPE: { code: 4041, msg: '구분 블록의 타입이 필요합니다.' },
  NEED_BLOCK_DIVIDER_MARGIN: { code: 4042, msg: '구분 블록의 여백 정보가 필요합니다.' },

  NEED_BLOCK_SCHEDULE_LIST: { code: 4051, msg: '캘린더 블록의 일정 리스트가 필요합니다.' },
  NEED_BLOCK_SCHEDULE_TITLE: { code: 4052, msg: '캘린더 블록의 일정 제목이 필요합니다.' },
  NEED_BLOCK_SCHEDULE_START_DATE: { code: 4053, msg: '캘린더 블록의 일정 시작 날짜가 필요합니다.' },
  NEED_BLOCK_SCHEDULE_END_DATE: { code: 4054, msg: '캘린더 블록의 일정 종료 날짜가 필요합니다.' },

  NEED_BLOCK_MAP_ADDRESS: { code: 4061, msg: '지도 블록의 주소가 필요합니다.' },
  NEED_BLOCK_MAP_LATITUDE: { code: 4062, msg: '지도 블록의 위도 정보가 필요합니다.' },
  NEED_BLOCK_MAP_LONGITUDE: { code: 4063, msg: '지도 블록의 경도 정보가 필요합니다.' },

  NEED_BLOCK_SNS_LIST: { code: 4071, msg: 'SNS 블록의 SNS 리스트가 필요합니다.' },
  NEED_BLOCK_SNS_LINK: { code: 4072, msg: 'SNS 블록의 링크가 필요합니다.' },
  NEED_BLOCK_SNS_TITLE: { code: 4073, msg: 'SNS 블록의 제목이 필요합니다.' },
  NEED_BLOCK_SNS_LAYOUT: { code: 4074, msg: 'SNS 블록의 레이아웃이 필요합니다.' },

  NEED_BLOCK_INQUIRY_LIST: { code: 4081, msg: '문의 블록의 문의 리스트가 필요합니다.' },
  NEED_BLOCK_INQUIRY_FORM: { code: 4082, msg: '문의 블록의 문의 양식이 필요합니다.' },
  NEED_BLOCK_INQUIRY_TITLE: { code: 4083, msg: '문의 블록의 제목이 필요합니다.' },


  // COMMON 90XX
  NEED_IMAGE: { code: 9001, msg: '업로드할 이미지가 없습니다.' },

};

export default code => {
  return ERROR[code];
};
