import type { Product } from "./types.js";
import { Request, Response } from 'express';
import { createProduct, readProductById, readProductsOverView, deleteProduct } from "./product.model.js";
export const addProduct = async (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            return res.status(400).json({ message: "No files uploaded" });
        }
        // Extract filenames
        const images = files.map(file => file.filename);

        const attributes = req.body.attributes ? JSON.parse(req.body.attributes) : [];

        const productData: Product = { ...req.body, images: images, attributes };
        if (!productData.title || !productData.images || !productData.rating || !productData.price || !productData.size || !productData.categoryId) {
            return res.status(400).json({ status: 'error', message: 'All fields are required' });
        }

        await createProduct(productData);
        res.status(201).json({
            status: 'success', message: 'Product added successfully'
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 'error', message: 'Failed to add product' });
    }
}
export const getProductById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        if (!id)
            return res.status(400).json({ status: 'error', message: 'Id is required' })

        const product = await readProductById(id);
        if (product) {
            const slug = "irf-" + product.id?.toString()?.padStart(4, "0");
            product.slug = slug;
            product.attributes = JSON.parse(product.attributes);
            product.comments = JSON.parse(product?.comments);
            product.images = JSON.parse(product?.images);
            product.comments.rating = Number(product.comments.rating);
            res.status(200).json({ status: 'success', message: 'Product got successfully', data: product })

        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 'error', message: 'Failed to get product' });

    }
}
export const getProductsOverView = async (req: Request, res: Response) => {
    try {
        const products: Product[] = await readProductsOverView();
        if (products) {
            products.forEach((product: any) => {
                product.images = JSON.parse(product.images);
            });

            res.status(200).json({ status: 'success', message: 'Products got successfully', data: products })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 'error', message: 'Failed to get products' });

    }
}
export const removeProductsOverView = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        if (!id)
            res.status(400).json({ status: 'error', message: 'Id is required' })


        const result = await deleteProduct(id);
        if (result) {
            res.status(200).json({ status: 'success', message: 'Product deleted successfully' })

        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 'error', message: 'Failed to delete product' });

    }
}
