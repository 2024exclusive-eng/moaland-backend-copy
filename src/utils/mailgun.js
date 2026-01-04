import * as crypto from "crypto";
import EC from './error.js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendSimpleMail = async (email, text) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject: '[K-Viewo] Your Verification Code from K-Viewo',
      text: `Hello,

Thank you for using K-Viewo. Your verification code is: ${text}

Please enter this code on the verification page to continue. This code will expire in 10 minutes.

If you did not request this code, please ignore this email or contact support if you have any questions.

Best regards,
The K-Viewo Team
`,
    });

    if (error) {
      console.log('메일 전송 실패:', error);
      return;
    }

    console.log('메일 전송 완료:', data.id);
  } catch (error) {
    console.error('메일 전송 중 오류 발생:', error);
  }
};

export const SendVerificationCode = async (email) => {
  const sendTime = new Date().getTime();
  const rawVerificationCode = String(Math.floor(100000 + Math.random() * 900000));
  const rawHash = `${email}-${rawVerificationCode}${process.env.CRYPTO_KEY}:${sendTime}`;

  await sendSimpleMail(email, rawVerificationCode);

  const hash = crypto.createHash("sha256").update(rawHash).digest("hex");
  return `${hash}:${sendTime}`;
};

export const VerifyVerificationCode = async (r, verificationCode, email, expire = 30) => {
  const [hash, sendTime] = r.split(":");
  console.log(r, verificationCode, email)
  const rawHash = `${email}-${verificationCode}${process.env.CRYPTO_KEY}:${sendTime}`;

  if (hash !== crypto.createHash("sha256").update(rawHash).digest("hex")) {
    return EC('NOT_MATCH_CODE');
  } else if (
    new Date().getTime() - parseInt(sendTime ?? "", 10) >
    1000 * 60 * expire
  ) {
    return EC('EXPIRE_CODE');
  }
  return null;
};
