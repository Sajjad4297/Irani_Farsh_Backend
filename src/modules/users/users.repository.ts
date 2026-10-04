import { Injectable } from '@nestjs/common';
import { PostgresService } from 'src/database/postgres.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly postgres: PostgresService) {}

  async register(userData: any) {
    const { phone, email, firstName, lastName, password } = userData;

    const result = await this.postgres
      .getPool()
      .query(
        'INSERT INTO users (phone, email, first_name, last_name, password) VALUES ($1, $2, $3, $4, $5) RETURNING id, phone, email, first_name AS "firstName", last_name AS "lastName"',
        [phone, email || null, firstName, lastName, password],
      );
    const id = result.rows[0]?.id;
    return {
      id,
      insertId: id,
      ...result.rows[0],
    };
  }

  async findByPhone(phone: string) {
    const result = await this.postgres
      .getPool()
      .query('SELECT id, phone, email FROM users WHERE phone = $1 LIMIT 1', [
        phone,
      ]);
    return result.rows[0];
  }

  async findByEmail(email: string) {
    const result = await this.postgres
      .getPool()
      .query('SELECT 1 FROM users WHERE email = $1 LIMIT 1', [email]);
    return result.rows[0];
  }

  async login(userData: any) {
    const identifier = userData.phone || userData.email;
    const result = await this.postgres
      .getPool()
      .query(
        'SELECT id, phone, email, password, first_name AS "firstName", last_name AS "lastName", profile_image AS "profileImage" FROM users WHERE phone = $1 OR email = $1 LIMIT 1',
        [identifier],
      );
    return result.rows[0];
  }

  async findAll() {
    const result = await this.postgres
      .getPool()
      .query(
        'SELECT id, phone, email, first_name AS "firstName", last_name AS "lastName", profile_image AS "profileImage" FROM users',
      );
    return result.rows;
  }

  async update(id: number, data: any) {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.phone !== undefined) {
      fields.push(`phone = $${paramIndex++}`);
      values.push(data.phone);
    }

    if (data.email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(data.email);
    }

    if (data.firstName !== undefined) {
      fields.push(`first_name = $${paramIndex++}`);
      values.push(data.firstName);
    }

    if (data.lastName !== undefined) {
      fields.push(`last_name = $${paramIndex++}`);
      values.push(data.lastName);
    }

    if (data.address !== undefined) {
      fields.push(`address = $${paramIndex++}`);
      values.push(data.address);
    }

    if (data.password !== undefined) {
      fields.push(`password = $${paramIndex++}`);
      values.push(data.password);
    }

    if (fields.length === 0) {
      return { message: 'No fields to update' };
    }

    values.push(id);
    const sql = `
            UPDATE users
            SET ${fields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

    const result = await this.postgres.getPool().query(sql, values);
    return result.rows[0];
  }

  async updateProfile(id: number, image: string) {
    const result = await this.postgres
      .getPool()
      .query('UPDATE users SET profile_image = $1 WHERE id = $2 RETURNING *', [
        image,
        id,
      ]);
    return result.rows[0];
  }

  async findUserInfo(id: number) {
    const pool = this.postgres.getPool();

    const [usersResult, cartItemsResult, orderItemsResult, commentsResult] =
      await Promise.all([
        pool.query(
          `SELECT
                id,
                phone,
                email,
                first_name AS "firstName",
                last_name AS "lastName",
                profile_image AS "profileImage",
                address
            FROM users
            WHERE id = $1
            LIMIT 1`,
          [id],
        ),

        pool.query(
          `SELECT
                ci.id,
                ci.user_id AS "userId",
                ci.quantity,
                p.id AS "productId",
                p.title AS "productTitle",
                p.images AS "productImages",
                p.price AS "productPrice",
                d.amount AS discount
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            LEFT JOIN discounts d ON p.id = d.product_id AND NOW() <= d.expires_at
            WHERE ci.user_id = $1`,
          [id],
        ),
        pool.query(
          `SELECT
                id,
                user_id AS "userId",
                quantity,
                product
            FROM orders
            WHERE user_id = $1
                `,
          [id],
        ),
        pool.query(
          `SELECT
                    count(*)::int as count
                FROM comments
                WHERE user_id = $1
                `,
          [id],
        ),
      ]);

    const user = usersResult.rows[0] ?? null;
    if (!user) return null;

    const cartItems =
      cartItemsResult.rows.length > 0
        ? cartItemsResult.rows.map((item: any) => ({
            id: item.id,
            quantity: item.quantity,
            product: {
              id: item.productId,
              title: item.productTitle,
              images:
                typeof item.productImages === 'string'
                  ? JSON.parse(item.productImages)
                  : item.productImages,
              price: item.productPrice,
              slug: 'irf-' + item.id.toString().padStart(4, '0'),
              discount: item.discount,
            },
          }))
        : null;

    const orders =
      orderItemsResult.rows.length > 0
        ? orderItemsResult.rows.map((item: any) => {
            const parsedProduct =
              typeof item.product === 'string'
                ? JSON.parse(item.product)
                : item.product;
            const images =
              typeof parsedProduct.images === 'string'
                ? JSON.parse(parsedProduct.images)
                : parsedProduct.images;
            return {
              id: item.id,
              quantity: item.quantity,
              product: {
                ...parsedProduct,
                images,
                slug:
                  'irf-' +
                  (parsedProduct.id
                    ? parsedProduct.id.toString().padStart(4, '0')
                    : item.id.toString().padStart(4, '0')),
              },
            };
          })
        : null;

    try {
      if (typeof user.address === 'string') {
        user.address = JSON.parse(user.address);
      }
    } catch (e) {
      // Keep user address as is if not valid JSON
    }

    return {
      ...user,
      address: user.address,
      commentsCount: commentsResult.rows[0]?.count ?? 0,
      cartItems,
      orders,
    };
  }
}
