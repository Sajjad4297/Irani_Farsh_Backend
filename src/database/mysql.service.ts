import { Injectable } from '@nestjs/common';
import * as mysql from 'mysql2/promise';
import 'dotenv/config'

@Injectable()
export class MysqlService {
    private pool: mysql.Pool;

    constructor() {
        this.pool = mysql.createPool({
            host: 'localhost',
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
        })
    }
    getPool() {
        return this.pool;
    }

}
