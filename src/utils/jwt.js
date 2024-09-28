import jwt from 'jsonwebtoken';

export const sign = (payload, expire) =>
  new Promise((resolve, reject) => {
    jwt.sign(payload, process.env.JWT_KEY, { algorithm: 'HS256' }, (err, token) => {
      if (err) return reject(err);
      return resolve(token);
    });
  });

export const verify = token =>
  new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
      if (err) return reject(err);
      return resolve(decoded);
    });
  });
