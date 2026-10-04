import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PostgresService } from 'src/database/postgres.service';
import { Discount } from './interfaces/discount.interface';

@Injectable()
export class DiscountsRepository {
  constructor(private readonly postgres: PostgresService) {}

  async create(data: Discount) {
    const { productId, amount, days } = data;

    try {
      const result = await this.postgres.getPool().query(
        `INSERT INTO discounts (product_id, amount, duration_days, expires_at)
                 VALUES ($1, $2, $3, NOW() + ($3 || ' days')::interval)
                 RETURNING *`,
        [productId, amount, days],
      );

      return result.rows[0];
    } catch (err: any) {
      // Duplicate product_id (23505 in PostgreSQL, ER_DUP_ENTRY in MySQL)
      if (err.code === '23505' || err.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException(
          `A discount already exists for this product`,
        );
      }

      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async findAll() {
    const result = await this.postgres.getPool().query(`
            SELECT
                d.id,
                d.amount,
                GREATEST(0, (d.expires_at::date - CURRENT_DATE)) AS days,
                p.id AS product_id,
                p.title,
                p.images,
                p.price,
                p.rating,
                p.size
            FROM discounts d
            JOIN products p ON p.id = d.product_id
            WHERE NOW() <= d.expires_at;
        `);

    return result.rows.map((row: any) => ({
      id: row.id,
      amount: Number(row.amount),
      days: Number(row.days),
      product: {
        title: row.title,
        price: Number(row.price),
        rating: Number(row.rating),
        size: row.size,
        slug: 'irf-' + row.product_id.toString().padStart(4, '0'),
        images:
          typeof row.images === 'string' ? JSON.parse(row.images) : row.images,
      },
    }));
  }

  async update(id: number, data: Discount) {
    const { amount, days } = data;

    const result = await this.postgres.getPool().query(
      `UPDATE discounts
             SET amount = $1, duration_days = $2, expires_at = NOW() + ($2 || ' days')::interval
             WHERE id = $3
             RETURNING *`,
      [amount, days, id],
    );

    return result.rows[0];
  }

  async delete(id: number) {
    const result = await this.postgres
      .getPool()
      .query('DELETE FROM discounts WHERE id = $1', [id]);
    return result;
  }
}
