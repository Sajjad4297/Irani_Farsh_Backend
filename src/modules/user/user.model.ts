import { pool } from '../../config/db.js'
import type { User } from "./types.js";
export const createUser = async (userData: User) => {
    const { email, firstName, lastName, password } = userData;

    try {
        // 1. Check if email exists
        const [existingUser]: any = await pool.query('SELECT 1 FROM users WHERE email = ? LIMIT 1', [email]);

        if (existingUser.length > 0) {
            throw new Error('Email is already registered');
        }

        const [result]: any = await
            pool.query('INSERT INTO users (email, first_name, last_name, password) VALUES (?, ?, ?, ?)', [email, firstName, lastName, password]);
        return result;
    }
    catch (err: any) {
        if (err.code === 'ER_DUP_ENTRY') { // MySQL example code for duplicate key
            throw new Error('Email is already registered');
        }
        throw err; // other errors
    }
}

export const readUserForLogin = async (userData: User) => {
    const { email } = userData;
    try {
        const [user]: any =
        await pool.query('SELECT id, email, password,first_name AS firstName , last_name AS lastName, profile_image AS profileImage FROM users WHERE email = ? LIMIT 1', [email]);
        if (user.length === 0) {
            throw new Error('Invalid email');
        }
        return user[0];
    } catch (error) {
        if (error instanceof Error)
            return Error(error.message);
    }

}

export const readUserById = async (id: string): Promise<any> => {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows;
}

export const updateUserProfileImage = async (id: string, image: string) => {
    try {
        const [result]: any = await pool.query('UPDATE users SET profile_image = ? WHERE id = ?', [image, id]);
        return result;
    } catch (error) {
        throw error;
    }
}
export const readUsers = async () => {
    try {
        const [users]: any =
        await pool.query('SELECT id, email,first_name AS firstName ,last_name AS lastName ,profile_image AS profileImage FROM users');
        return users;
    } catch (error) {
        throw error;
    }

}
