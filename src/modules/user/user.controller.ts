import { Request, Response } from 'express';
import { createUser, readUserData } from './user.model.js';
import { hashPassword, comparePassword } from "../../utilities/password.js";
import { generateUserToken } from "../../utilities/auth.js";
import type { User } from "./types.js";
export const registerUser = async (req: Request, res: Response) => {
    try {
        const userData: User = { ...req.body, password: await hashPassword(req.body.password) };
        if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
            return res.status(400).json({ status: 'error', message: 'All fields are required' });
        }
        const newUser = await createUser(userData);

        if (!newUser) throw new Error('Failed to create user');
        const token = generateUserToken(newUser.insertId, userData.email);
        res.status(201).json({
            status: 'success', message: 'User registered successfully', sajy: token,
            user: { id: newUser.id,firstName: userData.firstName, lastName: userData.lastName }
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'Email is already registered') {
                res.status(409).json({ status: 'error', message: 'Email is already registered' });
            } else {
                res.status(500).json({ status: 'error', message: 'Failed to register user' });
            }
        }
    }
};
export const loginUser = async (req: Request, res: Response) => {

    try {
        const userData = req.body;

        const existingUser: User = await readUserData(userData);
        if (existingUser.id && existingUser.email && existingUser.password && await comparePassword(req.body.password, existingUser.password)) {
            const token = generateUserToken(existingUser.id, existingUser.email);
            res.status(200).json({
                status: 'success', message: 'User logged in successfully', sajy: token,
                user: { id: existingUser.id,firstName: existingUser.firstName, lastName: existingUser.lastName }
            });
        } else {
            res.status(401).json({ status: 'error', message: 'Invalid email or password' });
        }

    } catch (error) {
        if (error instanceof Error) {
            console.log(error)
            if (error.message === 'Invalid email') {
                res.status(409).json({ status: 'error', message: 'Invalid email or password' });
            } else {
                res.status(500).json({ status: 'error', message: 'Failed to login user' });
            }
        }

    }
}
