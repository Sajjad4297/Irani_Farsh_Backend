import { BadGatewayException, BadRequestException, Injectable } from "@nestjs/common";
import { MysqlService } from "src/database/mysql.service";

@Injectable()
export class UsersRepository {
    constructor(private readonly mysql: MysqlService) { }
    async register(userData) {
        const { email, firstName, lastName, password } = userData;

        // 1. Check if email exists
        const [existingUser]: any = await this.mysql.getPool().query('SELECT 1 FROM users WHERE email = ? LIMIT 1', [email]);

        if (existingUser.length > 0) {
            throw new BadRequestException('Email is already registered');
        }

        const [result]: any = await
            this.mysql.getPool().query('INSERT INTO users (email, first_name, last_name, password) VALUES (?, ?, ?, ?)', [email, firstName, lastName, password]);
        return result;

    }
    async login(userData) {
        const { email } = userData;
        const [user]: any =
            await this.mysql.getPool().query('SELECT id, email, password,first_name AS firstName , last_name AS lastName, profile_image AS profileImage FROM users WHERE email = ? LIMIT 1', [email]);
        return user[0];

    }
    async findAll() {
        const [users]: any =
            await this.mysql.getPool().query('SELECT id, email,first_name AS firstName ,last_name AS lastName ,profile_image AS profileImage FROM users');
        return users;
    }
    async update(id: number, data: any) {
        const fields: any = [];
        const values: any = [];

        // For each possible field, add it only if user sent it
        if (data.email !== undefined) {
            fields.push("email = ?");
            values.push(data.email);
        }

        if (data.firstName !== undefined) {
            fields.push("first_name = ?");
            values.push(data.firstName);
        }

        if (data.lastName !== undefined) {
            fields.push("last_name = ?");
            values.push(data.lastName);
        }

        if (data.phone !== undefined) {
            fields.push("phone = ?");
            values.push(data.phone);
        }

        if (data.address !== undefined) {
            fields.push("address = ?");
            values.push(data.address);
        }

        if (data.password !== undefined) {
            fields.push("password = ?");
            values.push(data.password);
        }

        // If user sent nothing → return
        if (fields.length === 0) {
            return { message: "No fields to update" };
        }

        const sql = `
        UPDATE users
        SET ${fields.join(", ")}
        WHERE id = ?
    `;

        values.push(id);

        const [result]: any = await this.mysql.getPool().query(sql, values);
        return result;
    }
    async updateProfile(id: number, image: string) {
        const [result]: any = await this.mysql.getPool().query('UPDATE users SET profile_image = ? WHERE id = ?', [image, id]);
        return result;
    }
    async findUserInfo(id: number) {
        const pool = this.mysql.getPool();

        const [usersResult, cartItemsResult, orderItemsResult, commentsResult]: any = await Promise.all([
            pool.query(
                `SELECT
                id,
                email,
                first_name AS firstName,
                last_name AS lastName,
                profile_image AS profileImage,
                address,
                phone
            FROM users
            WHERE id = ?
            LIMIT 1`,
                [id]
            ),

            pool.query(
                `SELECT
                ci.id,
                ci.user_id AS userId,
                ci.quantity,
                p.id AS productId,
                p.title AS productTitle,
                p.images AS productImages,
                p.price AS productPrice,
                d.amount AS discount
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            LEFT JOIN discounts d ON p.id = d.product_id AND NOW() <= d.expires_at
            WHERE ci.user_id = ?`,
                [id]
            ),
            pool.query(
                `SELECT
                o.id,
                o.user_id AS userId,
                o.quantity,
                p.id AS productId,
                p.title AS productTitle,
                p.images AS productImages,
                p.price AS productPrice,
                d.amount AS discount
            FROM orders o
            JOIN products p ON o.product_id = p.id
            LEFT JOIN discounts d ON p.id = d.product_id AND NOW() <= d.expires_at
            WHERE o.user_id = ?
                `, [id]),
            pool.query(
                `SELECT
                    count(*) as count
                FROM comments
                WHERE user_id = ?
                `, [id]
            )
        ]);

        const user = usersResult[0][0] ?? null;
        if (!user) return null;

        const cartItems = cartItemsResult[0].length > 0 ? cartItemsResult[0].map(item => ({
            id: item.id,
            quantity: item.quantity,
            product: {
                id: item.productId,
                title: item.productTitle,
                images: JSON.parse(item.productImages),
                price: item.productPrice,
                slug: "irf-" + item.id.toString().padStart(4, "0"),
                discount: item.discount
            }
        })) : null;

        const orders = orderItemsResult[0].length > 0 ? orderItemsResult[0].map(item => ({
            id: item.id,
            quantity: item.quantity,
            product: {
                id: item.productId,
                title: item.productTitle,
                images: JSON.parse(item.productImages),
                price: item.productPrice,
                slug: "irf-" + item.id.toString().padStart(4, "0"),
                discount: item.discount
            }
        })) : null;
        try {
            user.address = JSON.parse(user.address);
        } catch (e) {

        }

        return { ...user, address: user.address, commentsCount: commentsResult[0][0].count, cartItems, orders };
    }
}
