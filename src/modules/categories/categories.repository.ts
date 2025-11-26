import { Injectable } from "@nestjs/common";
import { MysqlService } from "src/database/mysql.service";


@Injectable()
export class CategoriesRepository {
    constructor(private readonly mysql: MysqlService) { }

    async create(data) {
        const { title, slug, image } = data;
        const [result]: any = await this.mysql.getPool().query('INSERT INTO categories (title , slug , image) VALUES (?,?,?)',
            [title, slug.toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '') // Remove special characters
                .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
                .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens, image]);
                , image]);
        return result;
    }
    async findAll() {
        const [rows]: any = await this.mysql.getPool().query('SELECT id,title, slug, image from categories');
        return rows;
    }
    async update(id: number, data) {
        const { title, slug, image } = data;
        const [result]: any = await this.mysql.getPool().query(`
            UPDATE categories
            SET title = ?, slug = ?, image = ?
            WHERE id = ?;
            `, [title, slug, image, id])
        return result;
    }
    async delete(id: number) {
        const [result]: any = await this.mysql.getPool().query('DELETE FROM categories WHERE id = ?', [id]);
        return result;
    }
    async findProducts(slug: string) {
        const [result]: any = await this.mysql.getPool().query(
            `
            SELECT
                c.title AS category,
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', p.id,
                            'title', p.title,
                            'images', p.images,
                            'rating', p.rating,
                            'price', p.price,
                            'size', p.size,
                            'created_at', p.created_at
                        )
                    )
                ) AS products
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE c.slug = ?;

            `, [slug]);

        return result[0];

    }
}
