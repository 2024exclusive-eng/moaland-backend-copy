import * as crypto from "crypto";
import EC from './error.js';
import FormData from 'form-data';
import axios from 'axios';

const API_KEY = process.env.MAILGUN_API_KEY;
const DOMAIN = process.env.MAILGUN_DOMAIN;

export const sendSimpleMail = async (email, text) => {
  const formData = new FormData();
  formData.append('from', process.env.MAILGUN_SEND_EMAIL);
  formData.append('to', email);
  formData.append('subject', '[K-Viewo] Your Verification Code from K-Viewo');
  formData.append('text', `Hello,

  Thank you for using K-Viewo. Your verification code is: ${text}

  Please enter this code on the verification page to continue. This code will expire in 10 minutes.

  If you did not request this code, please ignore this email or contact support if you have any questions.

  Best regards,
  The K-Viewo Team
  `);

  try {
    const response = await axios({
      method: 'post',
      url: `https://api.mailgun.net/v3/${DOMAIN}/messages`,
      headers: {
        'Authorization': `Basic ${Buffer.from(`api:${API_KEY}`).toString('base64')}`,
        ...formData.getHeaders(),
      },
      data: formData
    });

    if (response.status === 200) {
      console.log('메일 전송 완료');
    } else {
      console.log('메일 전송 실패:', response.data);
    }
  } catch (error) {
    console.error('메일 전송 중 오류 발생:', error);
  }
};

export const SendVerificationCode = async (email) => {
  const sendTime = new Date().getTime();
  // const rawVerificationCode = Math.floor(10000 + Math.random() * 90000);
  const rawVerificationCode = "000000";
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
