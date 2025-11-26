import { Injectable } from "@nestjs/common";
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
}
