import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { MysqlService } from "src/database/mysql.service";
import { Discount } from "./interfaces/discount.interface";

@Injectable()
export class DiscountsRepository {
    constructor(private readonly mysql: MysqlService) {}

async create(data: Discount) {
    const { productId, amount, days } = data;

    try {
        const [result]: any = await this.mysql.getPool().query(
            `INSERT INTO discounts (product_id, amount, duration_days)
             VALUES (?, ?, ?)`,
            [productId, amount, days]
        );

        return result;

    } catch (err: any) {
        // Duplicate product_id
        if (err.code === "ER_DUP_ENTRY") {
            throw new BadRequestException(
                `A discount already exists for this product`
            );
        }

        throw new InternalServerErrorException("Something went wrong");
    }
}

async findAll() {
    const [rows]: any = await this.mysql.getPool().query(`
        SELECT
            d.id,
            d.amount,
            DATEDIFF(d.expires_at, NOW()) AS days,
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

    // Parse images for each row
    return rows.map((row) => ({
        id:row.id,
        amount:row.amount,
        days:row.days,
        product: {
            title: row.title,
            price: row.price,
            rating: row.rating,
            size: row.size,
            slug: "irf-" + row.product_id.toString().padStart(4, "0"),
            images: JSON.parse(row.images)
        }
    }));
}

    async update(id: number, data: Discount) {
        const { productId, amount, days } = data;

        const [result]: any = await this.mysql.getPool().query(
            'UPDATE discounts SET product_id = ?, amount = ?, duration_days = ? WHERE id = ?',
            [productId, amount, days, id]
        );

        return result;
    }

    async delete(id: number) {
        const [result]: any = await this.mysql.getPool().query(
            'DELETE FROM discounts WHERE id = ?',
            [id]
        );
        return result;
    }
}
