import mysql from 'mysql2/promise';
import 'dotenv/config'

export const pool = mysql.createPool({
  host: 'localhost',      // or your DB host
  user: process.env.DB_USER,           // your MySQL user
  password: process.env.DB_PASSWORD,   // your MySQL password
  database: process.env.DB_NAME,     // your database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
