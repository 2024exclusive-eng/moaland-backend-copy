import * as FormData from 'form-data';
import * as crypto from "crypto";
import axios from 'axios';
import EC from './error.js';

const API_KEY = process.env.MAILGUN_API_KEY;
const DOMAIN = process.env.MAILGUN_DOMAIN;

const sendSimpleMail = async (email, subject, text) => {
  const formData = new FormData();
  formData.append('from', process.env.MAILGUN_SEND_EMAIL);
  formData.append('to', email);
  formData.append('subject', subject);
  formData.append('text', text);

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
      return true;
    } else {
      throw ("메일전송 실패")
    }
  } catch (error) {
    throw (error)
  }
};

export const SendVerificationCode = async (email) => {
  const sendTime = new Date().getTime();
  // const rawVerificationCode = Math.floor(10000 + Math.random() * 90000);
  const rawVerificationCode = "000000";
  const rawHash = `${email}-${rawVerificationCode}${process.env.CRYPTO_KEY}:${sendTime}`;

  // await sendSimpleMail(email, "메일 제목", rawVerificationCode);

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
