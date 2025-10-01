import { pool } from '../../config/db.js'
import type { Product } from "./types.js";
export const createProduct = async (data: Product) => {
    try {
        const { title, images, rating, price, size, attributes, categoryId } = data;

        // 1. Insert the product
        const [newProduct]: any = await pool.query(
            `INSERT INTO products (title, images, rating, price, size, category_id) VALUES (?, ?, ?, ?, ?, ?)`,
            [title, JSON.stringify(images), rating, price, size, categoryId]
        );
        const productId = newProduct.insertId;

        // 2. Insert attributes in bulk (if any)
        if (attributes && attributes.length > 0) {
            // Flatten values for bulk insert
            const values: any[] = [];
            const placeholders: string[] = [];

            attributes.forEach(attr => {
                if (!attr.key || !attr.value) throw new Error("Attribute key and value are required");
                values.push(attr.key, attr.value);
                placeholders.push("(?, ?)");
            });
            const sql = `
                INSERT INTO attributes (attr_key, attr_value)
                VALUES ${placeholders.join(", ")}
            `;

            const [result]: any = await pool.query(sql, values);

            // result.insertId = first inserted ID
            // result.affectedRows = number of rows inserted
            const firstAttrId = result.insertId;
            const attrIds = Array.from({ length: result.affectedRows }, (_, i) => firstAttrId + i);

            // 3. Insert product-attribute links in bulk
            const linkPlaceholders = attrIds.map(() => "(?, ?)").join(", ");
            const linkValues: any[] = [];
            attrIds.forEach(attrId => {
                linkValues.push(productId, attrId);
            });

            await pool.query(
                `INSERT INTO products_attributes (product_id, attribute_id) VALUES ${linkPlaceholders}`,
                linkValues
            );

        }

    } catch (err) {
        throw err;
    }

}
export const readProductById = async (id: string) => {
    try {
        const [product]: any = await pool.query(`
            SELECT
                p.id,
                p.title,
                p.images,
                p.rating,
                p.price,
                p.size,
                c.title AS category,
                p.created_at,
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', a.id,
                            'key', a.attr_key,
                            'value', a.attr_value
                        )
                    )
                    FROM products_attributes pa
                    JOIN attributes a ON pa.attribute_id = a.id
                    WHERE pa.product_id = p.id
                ) AS attributes,
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'content', co.content,
                            'rating',co.rating,
                            'user', JSON_OBJECT('firstName', u.first_name, 'lastName', u.last_name, 'profileImage', u.profile_image)
                        )
                    )
                    FROM comments co
                    JOIN users u ON co.user_id = u.id
                    WHERE co.product_id = p.id AND co.status = "approved"
                ) AS comments
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?;
    `, [id])
        return product[0];

    } catch (err) {
        throw err;
    }
}
export const readProductsOverView = async () => {
    try {
        const [products]: any = await pool.query(`
        SELECT
        id,
        title,
        images,
        rating,
        price,
        size,
        created_at
        FROM products
    `)
        return products;

    } catch (err) {
        throw err;
    }


}
export const deleteProduct = async (id: string) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        await conn.query(
            `DELETE a
       FROM attributes a
       JOIN products_attributes pa ON a.id = pa.attribute_id
       WHERE pa.product_id = ?`,
            [id]
        );

        await conn.query(`DELETE FROM products_attributes WHERE product_id = ?`, [id]);
        await conn.query(`DELETE FROM products WHERE id = ?`, [id]);

        await conn.commit();
        return { success: true };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};
