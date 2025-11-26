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
    async update(id: number, userdata: any) {
        const { email, firstName, lastName, password, address } = userdata;
        const [result]: any = await this.mysql.getPool().query('UPDATE users SET email = ?, first_name = ?, last_name = ?, address = ?, password = ? WHERE id = ?', [email, firstName, lastName, address, password, id]);
        return result;
    }
    async updateProfile(id: number, image: string) {
        const [result]: any = await this.mysql.getPool().query('UPDATE users SET profile_image = ? WHERE id = ?', [image, id]);
        return result;
    }
async findUserInfo(id: number) {
    const pool = this.mysql.getPool();

    const [usersResult, cartItemsResult]: any = await Promise.all([
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
                p.price AS productPrice
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.user_id = ?`,
            [id]
        )
    ]);

    const user = usersResult[0][0] ?? null;
    if (!user) return null;

    const cartItems = cartItemsResult[0].map(item => ({
        id: item.id,
        quantity: item.quantity,
        product: {
            id: item.productId,
            title: item.productTitle,
            images: JSON.parse(item.productImages),
            price: item.productPrice,
            slug: "irf-" + item.id.toString().padStart(4, "0")
        }
    }));

    return { ...user, cartItems };
}
}
