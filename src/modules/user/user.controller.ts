import { Request, Response } from 'express';
import { createUser, readUserForLogin, updateUserProfileImage, readUsers, createCartItem, updateCartItem } from './user.model.js';
import { hashPassword, comparePassword } from "../../utilities/password.js";
import { generateUserToken } from "../../utilities/token.js";
import type { User } from "./types.js";
import { profile } from 'console';
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
            user: { id: newUser.id, firstName: userData.firstName, lastName: userData.lastName }
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

        const existingUser: User = await readUserForLogin(userData);
        if (existingUser.id && existingUser.email && existingUser.password && await comparePassword(req.body.password, existingUser.password)) {
            const token = generateUserToken(existingUser.id, existingUser.email);
            res.status(200).json({
                status: 'success', message: 'User logged in successfully', sajy: token,
                user: { firstName: existingUser.firstName, lastName: existingUser.lastName, profileImage: existingUser.profileImage }
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
export const putUserProfileImage = async (req: Request, res: Response) => {
    try {
        const file = req.file as Express.Multer.File;
        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        // Extract filenames
        const image = file.filename;
        const { id: userId } = (req as any).user;

        await updateUserProfileImage(userId, image);

        res.status(201).json({ status: 'success', message: 'Image added successfully' });


    } catch (error) {
        console.log(error)

        res.status(500).json({ status: 'error', message: 'Failed to set image for user' });
    }
}
export const getUsers = async (req: Request, res: Response) => {
    try {
        const data = await readUsers();
        if (data) {
            res.status(200).json({ status: 'success', message: 'Users got successfully', data });
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 'error', message: 'Failed to get users' });
    }
}
export const addCartItem = async (req: Request, res: Response) => {
    try {
        const { productId, quantity } = req.body;
        if (!productId || !quantity)
            return res.status(400).json({ status: 'error', message: 'Data is required' });
        const { id: userId } = (req as any).user;

        await createCartItem(userId, productId, quantity);

        res.status(201).json({ status: 'success', message: 'Cart item added successfully' });

    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 'error', message: 'Failed to add cart item' });
    }
}
export const putCartItem = async (req: Request, res: Response) => {
    try {
        const { productId, quantity } = req.body;
        if (!productId || (!quantity && quantity !== 0))
            return res.status(400).json({ status: 'error', message: 'Data is required' });
        const { id: userId } = (req as any).user;

        await updateCartItem(userId, productId, quantity);

        res.status(200).json({ status: 'success', message: 'Cart item updated successfully' });

    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 'error', message: 'Failed to updated cart item' });
    }
}
