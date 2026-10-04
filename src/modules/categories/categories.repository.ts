import { Injectable } from '@nestjs/common';
import { PostgresService } from 'src/database/postgres.service';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly postgres: PostgresService) {}

  async create(data: any) {
    const { title, slug, image } = data;
    const normalizedSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

    const result = await this.postgres
      .getPool()
      .query(
        'INSERT INTO categories (title, slug, image) VALUES ($1, $2, $3) RETURNING *',
        [title, normalizedSlug, image],
      );
    return result.rows[0];
  }

  async findAll() {
    const result = await this.postgres
      .getPool()
      .query('SELECT id, title, slug, image FROM categories');
    return result.rows;
  }

  async update(id: number, data: any) {
    const { title, slug, image } = data;
    const result = await this.postgres.getPool().query(
      `UPDATE categories
             SET title = $1, slug = $2, image = $3
             WHERE id = $4
             RETURNING *;`,
      [title, slug, image, id],
    );
    return result.rows[0];
  }

  async delete(id: number) {
    const result = await this.postgres
      .getPool()
      .query('DELETE FROM categories WHERE id = $1', [id]);
    return result;
  }

  async findProducts(slug: string) {
    const result = await this.postgres.getPool().query(
      `
            SELECT
                c.title AS category,
                COALESCE(
                    (
                        SELECT json_agg(
                            json_build_object(
                                'id', p.id,
                                'title', p.title,
                                'images', p.images,
                                'rating', p.rating,
                                'price', p.price,
                                'size', p.size,
                                'created_at', p.created_at,
                                'discount', d.amount
                            )
                        )
                        FROM products p
                        LEFT JOIN discounts d ON p.id = d.product_id AND NOW() <= d.expires_at
                        WHERE p.category_id = c.id
                    ),
                    '[]'::json
                ) AS products
            FROM categories c
            WHERE c.slug = $1;
            `,
      [slug],
    );

    return result.rows[0];
  }
}
