import { pool } from '../../config/db.js'
import type { Comment } from "./types.js";
export const createComment = async (data: Comment) => {

    try {
        const { userId, productId, content, rating } = data;
        const [result]:any = await pool.query('INSERT INTO comments (user_id, product_id, content, rating) VALUES (?, ?, ?, ?)',
            [userId, productId, content, rating]);
        return result;
    }
    catch (err) {
        throw err;
    }
}
export const readPendingComments = async () => {

    try {
        const [result]:any = await pool.query(`
            SELECT c.id,c.content,c.rating,
            JSON_OBJECT('firstName' , u.first_name , 'lastName' , u.last_name, 'profileImage', u.profile_image ) AS user,
            JSON_OBJECT('slug',p.id, 'images',p.images) AS product
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN products p ON c.product_id = p.id
            WHERE c.status = 'pending'
            `);

        return result;
    } catch (error) {
        throw error;
    }

}
export const setPendingComments = async (id: string, status: "approved" | "rejected") => {

    try {
        const [result]:any = await pool.query('UPDATE comments SET status = ? WHERE id = ?', [status, id]);

        return result;
    } catch (error) {
        throw error;
    }

}
