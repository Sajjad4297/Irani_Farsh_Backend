import { pool } from '../../config/db.js';
import type { Category } from './types.js'
export const createCategory = async (data: Category) => {
    try {
        const { title, slug, image } = data;
        const [result]: any = await pool.query('INSERT INTO categories (title , slug , image) VALUES (?,?,?)', [title, slug, image]);
        return result;
    } catch (error) {
        throw error;
    }
}
export const readCategories = async () => {
    try {
        const [result]: any = await pool.query('SELECT id,title, slug, image from categories');
        return result;
    } catch (error) {
        throw error;
    }
}
export const updateCategory = async (id: string, data: Category) => {
    try {
        const { title, slug, image } = data;
        const [result]: any = await pool.query(`
            UPDATE categories
            SET title = ?, slug = ?, image = ?
            WHERE id = ?;
            `, [title, slug, image, id])
        return result;
    } catch (error) {
        throw error;
    }
}
export const deleteCategory = async (id: string) => {
    try {
        const [result]: any = await pool.query('DELETE FROM categories WHERE id = ?', [id])
        return result;
    } catch (error) {
        throw error;
    }
}
export const readCategoryBySlug = async (slug: string) => {
    try {
        const [result]: any = await pool.query(
            `
            SELECT
                c.title AS category,
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', p.id,
                            'title', p.title,
                            'images', p.images,
                            'rating', p.rating,
                            'price', p.price,
                            'size', p.size,
                            'created_at', p.created_at
                        )
                    )
                ) AS products
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE c.slug = ?;

            `, [slug]);
            
        return result[0] ;
    } catch (error) {
        throw error;
    }
}
