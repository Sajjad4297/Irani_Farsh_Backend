import { BadRequestException, Injectable } from "@nestjs/common";
import { MysqlService } from "src/database/mysql.service";

@Injectable()
export class CartItemsRepository {
    constructor(private readonly mysql: MysqlService) { }
    async create(data) {
        const { userId, productId, quantity } = data;
        const [result]: any =
            await this.mysql.getPool().query('INSERT INTO cart_items (user_id , product_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?;'
                , [userId, productId, quantity, quantity]);
        return result;

    }

    async update(data) {
        const { userId, productId, quantity } = data;
        if (quantity > 0) {
            const [result]: any =
                await this.mysql.getPool().query('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?;'
                    , [quantity, userId, productId]);
            return result;
        } else {
            const [result]: any =
                await this.mysql.getPool().query('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?;'
                    , [userId, productId]);
            return result;
        }

    }
    async buyAll(userId: number) {
        const pool = this.mysql.getPool();
        const conn = await pool.getConnection();

        try {
            await conn.beginTransaction();

            // 1. Get user's cart items
            const [cartItems]: any = await conn.query(
                `SELECT product_id, quantity FROM cart_items WHERE user_id = ?`,
                [userId]
            );

            if (cartItems.length === 0) {
                await conn.rollback();
                throw new BadRequestException("Cart is empty");
            }
            // 2. Get products
            const [products]: any = await conn.query(
                `SELECT
                p.id,
                p.title,
                p.images,
                p.price,
                d.amount AS discount
                FROM products p
                LEFT JOIN discounts d ON p.id = d.product_id AND NOW() <= d.expires_at
                  WHERE p.id IN (?)`,
                [cartItems.map((item: any) => item.product_id)]
            )
            cartItems.forEach((item: any) => {
                const product = products.find((p: any) => p.id === item.product_id);
                item.product = JSON.stringify(product);
            })
            // 3. Insert into orders table
            // Assuming orders table has: user_id, product_id,product, quantity
            const orderInserts = cartItems.map((item: any) =>
                [userId, item.product_id,item.product, item.quantity]
            );

            await conn.query(
                `INSERT INTO orders (user_id, product_id, product, quantity)
             VALUES ?`,
                [orderInserts]
            );

            // 3. Delete the cart
            await conn.query(
                `DELETE FROM cart_items WHERE user_id = ?`,
                [userId]
            );

            // 4. Commit the transaction
            await conn.commit();

            return true;

        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }
    async findAllOrders(userId: number) {
        const [rows]: any = await this.mysql.getPool().query(
            `SELECT
                o.id,
                o.user_id AS userId,
                o.quantity,
                p.id AS productId,
                p.title AS productTitle,
                p.images AS productImages,
                p.price AS productPrice
            FROM orders o
            JOIN products p ON o.product_id = p.id
            WHERE o.user_id = ?
            `, [userId]);
        const orders = rows.length > 0 ? rows.map(item => ({
            id: item.id,
            quantity: item.quantity,
            product: {
                id: item.productId,
                title: item.productTitle,
                images: JSON.parse(item.productImages),
                price: item.productPrice,
                slug: "irf-" + item.id.toString().padStart(4, "0")
            }
        })) : null;

        return  orders ;
    }
}
