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
            return res.status(400).json({ status: 'error', message: 'Id is required' });

        const product = await readProductById(id);
        if (!product)
            return res.status(404).json({ status: 'error', message: 'Product not found' });

        product.slug = "irf-" + product.id.toString().padStart(4, "0");

        if (typeof product.images === "string") {
            try {
                product.images = JSON.parse(product.images);
            } catch {
                product.images = [];
            }
        }

        if (typeof product.attributes === "string") {
            product.attributes = JSON.parse(product.attributes);
        }

        if (typeof product.comments === "string") {
            product.comments = JSON.parse(product.comments);
        }

        if (Array.isArray(product.comments)) {
            product.comments = product.comments.map((c: any) => ({
                ...c,
                rating: Number(c.rating),
            }));
        }

        res.status(200).json({
            status: 'success',
            message: 'Product got successfully',
            data: product,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Failed to get product' });
    }
};
export const getProductsOverView = async (req: Request, res: Response) => {
    try {
        const products: Product[] = await readProductsOverView();
        if (products) {
            products.forEach((product: any) => {
                product.images = JSON.parse(product.images);
                product.slug = "irf-" + product.id.toString().padStart(4, "0");
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
