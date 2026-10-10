import { BadRequestException, Injectable } from '@nestjs/common';
import { PostgresService } from 'src/database/postgres.service';
import { safeJsonParse } from 'src/common/utils/json.util';

@Injectable()
export class CartItemsRepository {
  constructor(private readonly postgres: PostgresService) {}

  async create(data: any) {
    const { userId, productId, quantity } = data;
    const result = await this.postgres.getPool().query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, product_id)
             DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
             RETURNING *;`,
      [userId, productId, quantity],
    );
    return result.rows[0];
  }

  async update(data: any) {
    const { userId, productId, quantity } = data;
    if (quantity > 0) {
      const result = await this.postgres.getPool().query(
        `UPDATE cart_items
                 SET quantity = $1
                 WHERE user_id = $2 AND product_id = $3
                 RETURNING *;`,
        [quantity, userId, productId],
      );
      return result.rows[0];
    } else {
      const result = await this.postgres.getPool().query(
        `DELETE FROM cart_items
                 WHERE user_id = $1 AND product_id = $2
                 RETURNING *;`,
        [userId, productId],
      );
      return result.rows[0];
    }
  }

  async buyAll(userId: number) {
    const client = await this.postgres.getPool().connect();

    try {
      await client.query('BEGIN');

      // 1. Get user's cart items
      const cartItemsResult = await client.query(
        `SELECT product_id, quantity FROM cart_items WHERE user_id = $1`,
        [userId],
      );
      const cartItems = cartItemsResult.rows;

      if (cartItems.length === 0) {
        await client.query('ROLLBACK');
        throw new BadRequestException('Cart is empty');
      }

      // 2. Get products
      const productIds = cartItems.map((item: any) => item.product_id);
      const productsResult = await client.query(
        `SELECT
                p.id,
                p.title,
                p.images,
                p.price,
                d.amount AS discount
                FROM products p
                LEFT JOIN discounts d ON p.id = d.product_id AND NOW() <= d.expires_at
                WHERE p.id = ANY($1::int[])`,
        [productIds],
      );
      const products = productsResult.rows;

      cartItems.forEach((item: any) => {
        const product = products.find((p: any) => p.id === item.product_id);
        item.product = JSON.stringify(product);
      });

      // 3. Insert into orders table
      const placeholders: string[] = [];
      const values: any[] = [];
      cartItems.forEach((item: any, idx: number) => {
        const offset = idx * 4;
        placeholders.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`,
        );
        values.push(userId, item.product_id, item.product, item.quantity);
      });

      await client.query(
        `INSERT INTO orders (user_id, product_id, product, quantity)
                 VALUES ${placeholders.join(', ')}`,
        values,
      );

      // 4. Delete the cart
      await client.query(`DELETE FROM cart_items WHERE user_id = $1`, [userId]);

      // 5. Commit the transaction
      await client.query('COMMIT');

      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findAllOrders(userId: number) {
    const result = await this.postgres.getPool().query(
      `SELECT
                o.id,
                o.user_id AS "userId",
                o.quantity,
                p.id AS "productId",
                p.title AS "productTitle",
                p.images AS "productImages",
                p.price AS "productPrice"
            FROM orders o
            JOIN products p ON o.product_id = p.id
            WHERE o.user_id = $1
            `,
      [userId],
    );

    const orders =
      result.rows.length > 0
        ? result.rows.map((item: any) => ({
            id: item.id,
            quantity: item.quantity,
            product: {
              id: item.productId,
              title: item.productTitle,
              images: safeJsonParse(item.productImages, []),
              price: item.productPrice,
              slug: 'irf-' + item.id.toString().padStart(4, '0'),
            },
          }))
        : null;

    return orders;
  }
}
