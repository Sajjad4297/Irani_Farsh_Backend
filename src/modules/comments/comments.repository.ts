import { Injectable } from "@nestjs/common";
import { MysqlService } from "src/database/mysql.service";

@Injectable()
export class CommentsRepository {
    constructor(private readonly mysql: MysqlService) { }

    async create(data) {
        const { userId, productId, content, rating } = data;
        const [result]: any = await this.mysql.getPool().query('INSERT INTO comments (user_id, product_id, content, rating) VALUES (?, ?, ?, ?)',
            [userId, productId, content, rating]);
        return result;

    }

    async findPendingComments() {
        const [result]: any = await this.mysql.getPool().query(`
            SELECT c.id,c.content,c.rating,
            JSON_OBJECT('firstName' , u.first_name , 'lastName' , u.last_name, 'profileImage', u.profile_image ) AS user,
            JSON_OBJECT('slug',p.id, 'images',p.images) AS product
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN products p ON c.product_id = p.id
            WHERE c.status = 'pending'
            `);

        return result;

    }

    async updatePendingComments(id: number, status: "approved" | "rejected") {
        const [result]: any = await this.mysql.getPool().query('UPDATE comments SET status = ? WHERE id = ?', [status, id]);
        return result;

    }
}
