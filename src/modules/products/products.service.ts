import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import fs from "fs";
import crypto from "crypto";
import path from 'path';
import { ProductsRepository } from './products.repository';
import { product } from './interfaces/product.interface';
@Injectable()
export class ProductsService {
    constructor(private readonly productsRepository: ProductsRepository) { }

    async create(body: CreateProductDto, files: { images: Express.Multer.File[] }) {
        const savedFiles: string[] = [];

        for (const file of files.images) {
            // Generate a unique filename but keep original extension
            const uniqueSuffix = crypto.randomBytes(5).toString("hex");
            const ext = path.extname(file.filename); // ".png", ".jpg", etc.
            const newFilename = `img-${uniqueSuffix}${ext}`;
            const filePath = path.join("uploads/product", newFilename);

            // Save the file
            fs.writeFileSync(filePath, file.buffer);

            savedFiles.push(newFilename); // keep track of saved files
        }
        const attributes = body.attributes ? typeof body.attributes === 'string' && JSON.parse(body.attributes) : [];

        const productData = { ...body, images: savedFiles, attributes };

        await this.productsRepository.create(productData);

        return {
            success: true,
            message: "Product created successfully"
        };
    }

    async findAll() {
        const products: product[] = await this.productsRepository.findAll();

        if (products) {
            products.forEach((product: any) => {
                product.images = JSON.parse(product.images);
                product.slug = "irf-" + product.id.toString().padStart(4, "0");
            });

            return ({ success: true, message: 'Products got successfully', data: products })

        }
    }

    async findOne(id: number) {
        const product: product = await this.productsRepository.findById(id);
        if (!product) {
            throw new NotFoundException('Product not found');
        }

        product.slug = "irf-" + (product.id && product.id.toString().padStart(4, "0"));

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
        if (typeof product.similarProducts === "string") {
            product.similarProducts = JSON.parse(product.similarProducts);
        }
        product.similarProducts.forEach(similarProduct => {
            similarProduct.slug = "irf-" + (product.id && product.id.toString().padStart(4, "0"));
            if (typeof similarProduct.images === "string") {
                try {
                    similarProduct.images = JSON.parse(similarProduct.images);
                } catch {
                    similarProduct.images = [];
                }
            }
        });

        if (Array.isArray(product.comments)) {
            product.comments = product.comments.map((c: any) => ({
                ...c,
                rating: Number(c.rating),
            }));
        }
        return ({
            success: true,
            message: 'Product got successfully',
            data: product,
        });

    }

    async update(id: number, updateProductDto: UpdateProductDto) {
        return `This action updates a #${id} product`;
    }

    async remove(id: number) {
        await this.productsRepository.delete(id);

        return ({ success: true, message: 'Product deleted successfully' })
    }
    async findByTitle(title: string) {
        const products: product[] = await this.productsRepository.findByTitle(title);

        if (products.length > 0) {
            products.forEach((product: any) => {
                product.images = JSON.parse(product.images);
                product.slug = "irf-" + product.id.toString().padStart(4, "0");

            });
            return ({ success: true, message: 'Products got successfully', data: products })
        } else {
            return ({ success: true, message: 'No products found', data: [] })
        }

    }
}
