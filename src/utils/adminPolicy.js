export const isSuperAdmin = (admin) => admin?.role === 'super_admin';
export const adminOwner = (req) =>
  isSuperAdmin(req.admin) ? null : req.admin.id;
export const monthKey = (now = new Date()) =>
  new Date(now.getTime() + 9 * 3600000).toISOString().slice(0, 7);
export function adminError(code, message, status = 400) {
  return Object.assign(new Error(message), { adminError: true, code, status });
}
export function positiveId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1)
    throw adminError(
      'INVALID_ID',
      '올바른 계정 또는 캠페인 ID를 입력해 주세요.'
    );
  return id;
}
export function accountInput(body, create = false) {
  const {
    admin,
    name,
    companyName = '',
    contactEmail = '',
    role,
    isActive,
    monthlyLimit,
    password,
  } = body;
  if (
    !['super_admin', 'advertiser'].includes(role) ||
    ![true, false, 0, 1].includes(isActive)
  )
    throw adminError('INVALID_ACCOUNT', '권한과 계정 상태를 확인해 주세요.');
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    name.length > 80 ||
    typeof companyName !== 'string' ||
    companyName.length > 120 ||
    typeof contactEmail !== 'string' ||
    contactEmail.length > 254 ||
    (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))
  )
    throw adminError(
      'INVALID_ACCOUNT',
      '이름, 업체명과 이메일을 확인해 주세요.'
    );
  if (
    monthlyLimit !== null &&
    (!Number.isInteger(monthlyLimit) ||
      monthlyLimit < 0 ||
      monthlyLimit > 100000)
  )
    throw adminError(
      'INVALID_LIMIT',
      '월 한도는 0~100000의 정수 또는 무제한으로 지정해 주세요.'
    );
  if (
    create &&
    (typeof admin !== 'string' || !/^[a-zA-Z0-9._@-]{4,80}$/.test(admin))
  )
    throw adminError(
      'INVALID_LOGIN',
      '아이디는 영문·숫자·._@- 조합 4~80자로 입력해 주세요.'
    );
  if (create || password) {
    if (
      typeof password !== 'string' ||
      password.length < 12 ||
      Buffer.byteLength(password, 'utf8') > 72
    )
      throw adminError(
        'INVALID_PASSWORD',
        '비밀번호는 12자 이상, UTF-8 기준 72바이트 이하로 입력해 주세요.'
      );
  }
  return {
    admin,
    name: name.trim(),
    companyName: companyName.trim(),
    contactEmail: contactEmail.trim(),
    role,
    isActive: Number(isActive),
    monthlyLimit: role === 'super_admin' ? null : monthlyLimit,
    password,
  };
}
