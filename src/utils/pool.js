import * as mysql from "mysql2";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.staging", override: false });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: 30,
});

export default pool.promise();
