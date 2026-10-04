import { Injectable } from '@nestjs/common';
import { PostgresService } from 'src/database/postgres.service';

@Injectable()
export class CommentsRepository {
  constructor(private readonly postgres: PostgresService) {}

  async create(data: any) {
    const { userId, productId, content, rating } = data;
    const result = await this.postgres
      .getPool()
      .query(
        'INSERT INTO comments (user_id, product_id, content, rating) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, productId, content, rating],
      );
    return result.rows[0];
  }

  async findPendingComments() {
    const result = await this.postgres.getPool().query(`
            SELECT c.id, c.content, c.rating,
            json_build_object('firstName', u.first_name, 'lastName', u.last_name, 'profileImage', u.profile_image) AS user,
            json_build_object('slug', p.id, 'images', p.images, 'title', p.title) AS product
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN products p ON c.product_id = p.id
            WHERE c.status = 'pending'
        `);

    return result.rows;
  }

  async updatePendingComments(id: number, status: 'approved' | 'rejected') {
    const result = await this.postgres
      .getPool()
      .query('UPDATE comments SET status = $1 WHERE id = $2 RETURNING *', [
        status,
        id,
      ]);
    return result.rows[0];
  }
}
