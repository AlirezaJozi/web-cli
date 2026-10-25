import mysql from 'mysql2/promise';
import { env } from './env.js';

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4_unicode_ci',
  // DATETIME به‌صورت رشته برگردد تا نیاز به تبدیل منطقه زمانی نباشد
  dateStrings: true,
});

/** اجرای کوئری با prepared statement و برگرداندن ردیف‌ها */
export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}
