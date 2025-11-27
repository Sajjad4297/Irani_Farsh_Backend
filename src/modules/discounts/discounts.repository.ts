import { Injectable } from "@nestjs/common";
import { MysqlService } from "src/database/mysql.service";

@Injectable()
export class DiscountsRepository {
    constructor(private readonly mysql: MysqlService){}

    async create(data){

    }

    async findAll(){
        const [rows]: any = await this.mysql.getPool().query('SELECT * FROM discounts');
        return rows;
    }

    async update(id, data){

    }
    async delete(id){

    }
}
