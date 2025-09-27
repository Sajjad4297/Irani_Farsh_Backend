import { pool } from '../../config/db.js';

export const test = async (): Promise<any> => {
    try {
        const [rows] = await pool.query('SELECT NOW() AS currentTime');
        return rows;
    } catch (error) {
        console.error('Database connection failed:', error);
    }
}
