 import { Injectable } from "@nestjs/common";
import { MysqlService } from "src/database/mysql.service";

@Injectable()
export class ProductsRepository {
    constructor(private readonly mysql: MysqlService) { }

    async create(data) {
        const { title, images, rating, price, size, attributes, categoryId } = data;

        const conn = await this.mysql.getPool().getConnection();
        try {
            await conn.beginTransaction();

            // 1. Insert product
            const [newProduct]: any = await conn.query(
                `INSERT INTO products (title, images, rating, price, size, category_id)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [title, JSON.stringify(images), rating, price, size, categoryId]
            );
            const productId = newProduct.insertId;

            // 2. Insert attributes (bulk)
            if (attributes && attributes.length > 0) {
                const values: any[] = [];
                const placeholders: string[] = [];

                attributes.forEach(attr => {
                    if (!attr.key || !attr.value) {
                        throw new Error("Attribute key and value are required");
                    }
                    values.push(attr.key, attr.value);
                    placeholders.push("(?, ?)");
                });

                const insertAttrSql = `
                    INSERT INTO attributes (attr_key, attr_value)
                    VALUES ${placeholders.join(", ")}
                `;
                const [result]: any = await conn.query(insertAttrSql, values);

                const firstAttrId = result.insertId;
                const attrIds = Array.from({ length: result.affectedRows }, (_, i) => firstAttrId + i);

                // 3. Insert link table data
                const linkPlaceholders = attrIds.map(() => "(?, ?)").join(", ");
                const linkValues: any[] = [];
                attrIds.forEach(attrId => linkValues.push(productId, attrId));

                await conn.query(
                    `INSERT INTO products_attributes (product_id, attribute_id)
                     VALUES ${linkPlaceholders}`,
                    linkValues
                );
            }

            await conn.commit();
            return { id: productId };
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    async findAll() {
        const [rows]: any = await this.mysql.getPool().query(`
            SELECT p.id, p.title, p.images, p.rating, p.price, p.size, p.created_at,d.amount as discount
            FROM products p
            LEFT JOIN discounts d ON p.id = d.product_id AND NOW() <= d.expires_at
        `);
        return rows;
    }

async findById(id: number) {
    const pool = this.mysql.getPool();

    // 1) Product + category
    const productQuery = pool.query(`
        SELECT p.*, c.title AS category,d.amount as discount
        FROM products p
        JOIN categories c ON c.id = p.category_id
        LEFT JOIN discounts d ON p.id = d.product_id AND NOW() <= d.expires_at
        WHERE p.id = ?
    `, [id]);

    // 2) Attributes
    const attributesQuery = pool.query(`
        SELECT a.attr_key AS \`key\`, a.attr_value AS \`value\`
        FROM products_attributes pa
        JOIN attributes a ON pa.attribute_id = a.id
        WHERE pa.product_id = ?
    `, [id]);

    // 3) Comments
    const commentsQuery = pool.query(`
        SELECT
            co.content,
            co.rating,
            JSON_OBJECT(
                'firstName', u.first_name,
                'lastName', u.last_name,
                'profileImage', u.profile_image
            ) AS user
        FROM comments co
        JOIN users u ON co.user_id = u.id
        WHERE co.product_id = ? AND co.status = 'approved'
    `, [id]);

    // 4) Similar products (LIMIT 3)
    const similarQuery = pool.query(`
        SELECT p.id, p.title, p.images, p.price, p.rating, p.size, d.amount as discount
        FROM products p
        LEFT JOIN discounts d ON p.id = d.product_id AND NOW() <= d.expires_at
        WHERE category_id = p.category_id
        AND p.id != ?
        ORDER BY created_at DESC
        LIMIT 3
    `, [id, id]);

    // Run all in parallel
    const [
        [productRows],
        [attributeRows],
        [commentRows],
        [similarRows]
    ] = await Promise.all([
        productQuery,
        attributesQuery,
        commentsQuery,
        similarQuery
    ]);

    // If product not found
    if ((productRows as any).length === 0) return null;

    // Build final result
    const product = productRows[0];

    return {
        ...product,
        images: JSON.parse(product.images),
        attributes: attributeRows,
        comments: (commentRows as any).map(c => ({
            content: c.content,
            rating: c.rating,
            user: typeof c.user === 'string' ? JSON.parse(c.user) : c.user
        })),
        similarProducts: similarRows
    };
}

    async delete(id: number) {
        const conn = await this.mysql.getPool().getConnection();
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
    }

    async findByTitle(title: string) {
        const [products]: any = await this.mysql.getPool().query(`
            SELECT
            id,
            title,
            images,
            rating,
            price,
            size,
            created_at
            FROM products
            WHERE title LIKE ?
        `, [`%${title}%`])
        return products;

    }
}
