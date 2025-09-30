import { createCategory, readCategories, updateCategory, deleteCategory } from "./category.model.js"
import type { Request, Response } from 'express'
export const addCategory = async (req: Request, res: Response) => {
    try {
        const file = req.file as Express.Multer.File;
        if (!file) {
            return res.status(400).json({ message: "No files uploaded" });
        }
        // Extract filenames
        const image = file.filename;

        const data = { ...req.body, image }
        if (!data.title || !data.slug) {
            return res.status(400).json({ status: 'error', message: 'All fields are required' });
        }
        await createCategory(data);

        res.status(201).json({
            status: 'success', message: 'Category added successfully'
        });

    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 'error', message: 'Failed to add Category' });

    }
}
export const getCategories = async (req: Request, res: Response) => {
    try {
        const data = await readCategories();
        if (data) {
            res.status(200).json({ status: 'success', message: 'Categories got successfully', data })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 'error', message: 'Failed to get Categories' });

    }
}
export const putCategory = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        if (!id)
            res.status(400).json({ status: 'error', message: 'Id is required' })

        const data = { ...req.body }
        if (!data.title || !data.slug) {
            return res.status(400).json({ status: 'error', message: 'All fields are required' });
        }

        const file = req.file as Express.Multer.File;
        if (file) {
            // Extract filenames
            const image = file.filename;
            await updateCategory(id, { ...data, image },);
        } else {
            await updateCategory(id, { ...data });
        }

        res.status(200).json({
            status: 'success', message: 'Category updated successfully'
        });

    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 'error', message: 'Failed to updated Category' });

    }
}
export const removeCategory = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        if (!id)
            res.status(400).json({ status: 'error', message: 'Id is required' })

        await deleteCategory(id);

        res.status(200).json({
            status: 'success', message: 'Category deleted successfully'
        });

    } catch (error: any) {
        console.log(error)
        if (error.code == 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({ status: 'error', message: 'Can not delete a category that have products' });
        }

        res.status(500).json({ status: 'error', message: 'Failed to deleted Category' });
    }
}
