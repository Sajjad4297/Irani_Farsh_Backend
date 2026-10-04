import { Injectable } from '@nestjs/common';
import { PostgresService } from 'src/database/postgres.service';

@Injectable()
export class ProductsRepository {
  constructor(private readonly postgres: PostgresService) {}

  async create(data: any) {
    const { title, images, rating, price, size, attributes, categoryId } = data;

    const client = await this.postgres.getPool().connect();
    try {
      await client.query('BEGIN');

      // 1. Insert product
      const newProduct = await client.query(
        `INSERT INTO products (title, images, rating, price, size, category_id)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id`,
        [title, JSON.stringify(images), rating, price, size, categoryId],
      );
      const productId = newProduct.rows[0].id;

      // 2. Insert attributes (bulk)
      if (attributes && attributes.length > 0) {
        const values: any[] = [];
        const placeholders: string[] = [];

        attributes.forEach((attr: any, idx: number) => {
          if (!attr.key || !attr.value) {
            throw new Error('Attribute key and value are required');
          }
          const offset = idx * 2;
          values.push(attr.key, attr.value);
          placeholders.push(`($${offset + 1}, $${offset + 2})`);
        });

        const insertAttrSql = `
                    INSERT INTO attributes (attr_key, attr_value)
                    VALUES ${placeholders.join(', ')}
                    RETURNING id
                `;
        const attrResult = await client.query(insertAttrSql, values);
        const attrIds = attrResult.rows.map((row: any) => row.id);

        // 3. Insert link table data
        const linkPlaceholders: string[] = [];
        const linkValues: any[] = [];
        attrIds.forEach((attrId: number, idx: number) => {
          const offset = idx * 2;
          linkValues.push(productId, attrId);
          linkPlaceholders.push(`($${offset + 1}, $${offset + 2})`);
        });

        await client.query(
          `INSERT INTO products_attributes (product_id, attribute_id)
                     VALUES ${linkPlaceholders.join(', ')}`,
          linkValues,
        );
      }

      await client.query('COMMIT');
      return { id: productId };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findAll() {
    const result = await this.postgres.getPool().query(`
            SELECT p.id, p.title, p.images, p.rating, p.price, p.size, p.created_at, d.amount as discount
            FROM products p
            LEFT JOIN discounts d ON p.id = d.product_id AND NOW() <= d.expires_at
        `);
    return result.rows;
  }

  async findById(id: number) {
    const pool = this.postgres.getPool();

    // 1) Product + category
    const productQuery = pool.query(
      `
            SELECT p.*, c.title AS category, d.amount as discount
            FROM products p
            JOIN categories c ON c.id = p.category_id
            LEFT JOIN discounts d ON p.id = d.product_id AND NOW() <= d.expires_at
            WHERE p.id = $1
        `,
      [id],
    );

    // 2) Attributes
    const attributesQuery = pool.query(
      `
            SELECT a.attr_key AS "key", a.attr_value AS "value"
            FROM products_attributes pa
            JOIN attributes a ON pa.attribute_id = a.id
            WHERE pa.product_id = $1
        `,
      [id],
    );

    // 3) Comments
    const commentsQuery = pool.query(
      `
            SELECT
                co.content,
                co.rating,
                json_build_object(
                    'firstName', u.first_name,
                    'lastName', u.last_name,
                    'profileImage', u.profile_image
                ) AS user
            FROM comments co
            JOIN users u ON co.user_id = u.id
            WHERE co.product_id = $1 AND co.status = 'approved'
        `,
      [id],
    );

    // 4) Similar products (LIMIT 3)
    const similarQuery = pool.query(
      `
            SELECT p.id, p.title, p.images, p.price, p.rating, p.size, d.amount as discount
            FROM products p
            LEFT JOIN discounts d ON p.id = d.product_id AND NOW() <= d.expires_at
            WHERE p.category_id = (SELECT category_id FROM products WHERE id = $1)
            AND p.id != $1
            ORDER BY p.created_at DESC
            LIMIT 3
        `,
      [id],
    );

    // Run all in parallel
    const [productResult, attributeResult, commentResult, similarResult] =
      await Promise.all([
        productQuery,
        attributesQuery,
        commentsQuery,
        similarQuery,
      ]);

    if (productResult.rows.length === 0) return null;

    const product = productResult.rows[0];

    return {
      ...product,
      images:
        typeof product.images === 'string'
          ? JSON.parse(product.images)
          : product.images,
      attributes: attributeResult.rows,
      comments: commentResult.rows.map((c: any) => ({
        content: c.content,
        rating: c.rating,
        user: typeof c.user === 'string' ? JSON.parse(c.user) : c.user,
      })),
      similarProducts: similarResult.rows.map((sp: any) => ({
        ...sp,
        images:
          typeof sp.images === 'string' ? JSON.parse(sp.images) : sp.images,
      })),
    };
  }

  async delete(id: number) {
    const client = await this.postgres.getPool().connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `DELETE FROM attributes a
                 USING products_attributes pa
                 WHERE a.id = pa.attribute_id AND pa.product_id = $1`,
        [id],
      );

      await client.query(
        `DELETE FROM products_attributes WHERE product_id = $1`,
        [id],
      );
      await client.query(`DELETE FROM products WHERE id = $1`, [id]);

      await client.query('COMMIT');
      return { success: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findByTitle(title: string) {
    const result = await this.postgres.getPool().query(
      `
            SELECT
            id,
            title,
            images,
            rating,
            price,
            size,
            created_at
            FROM products
            WHERE title ILIKE $1
        `,
      [`%${title}%`],
    );
    return result.rows;
  }
}
