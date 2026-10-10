import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import fs from "fs";
import crypto from "crypto";
import path from 'path';
import { ProductsRepository } from './products.repository';
import { product } from './interfaces/product.interface';
import { safeJsonParse } from 'src/common/utils/json.util';
@Injectable()
export class ProductsService {
    constructor(private readonly productsRepository: ProductsRepository) { }

    async create(body: CreateProductDto, files: { images: Express.Multer.File[] }) {
        const savedFiles: string[] = [];

        const uploadDir = path.join(process.cwd(), "uploads/product");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        for (const file of files?.images || []) {
            // Generate a unique filename but keep original extension
            const uniqueSuffix = crypto.randomBytes(5).toString("hex");
            const ext = (file as any).ext || path.extname(file.filename); // ".png", ".jpg", etc.
            const newFilename = `img-${uniqueSuffix}${ext}`;
            const filePath = path.join(uploadDir, newFilename);

            // Save the file
            fs.writeFileSync(filePath, file.buffer);

            savedFiles.push(newFilename); // keep track of saved files
        }
        const attributes = body.attributes ? (typeof body.attributes === 'string' ? safeJsonParse(body.attributes, []) : body.attributes) : [];

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
                product.images = safeJsonParse(product.images, []);
                product.slug = "irf-" + (product.id ? product.id.toString().padStart(4, "0") : "");
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
        product.images = safeJsonParse(product.images, []);
        product.attributes = safeJsonParse(product.attributes, []);
        product.comments = safeJsonParse(product.comments, []);
        product.similarProducts = safeJsonParse(product.similarProducts, []);

        if (Array.isArray(product.similarProducts)) {
            product.similarProducts.forEach(similarProduct => {
                similarProduct.slug = "irf-" + (similarProduct.id && similarProduct.id.toString().padStart(4, "0"));
                similarProduct.images = safeJsonParse(similarProduct.images, []);
            });
        }

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

    async update(id: number, updateProductDto: UpdateProductDto, files?: { images?: Express.Multer.File[] }) {
        const existing = await this.productsRepository.findById(id);
        if (!existing) {
            throw new NotFoundException(`Product with id ${id} not found`);
        }

        let savedFiles: string[] | undefined = undefined;
        if (files?.images && files.images.length > 0) {
            savedFiles = [];
            const uploadDir = path.join(process.cwd(), "uploads/product");
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            for (const file of files.images) {
                const uniqueSuffix = crypto.randomBytes(5).toString("hex");
                const ext = (file as any).ext || path.extname(file.filename);
                const newFilename = `img-${uniqueSuffix}${ext}`;
                const filePath = path.join(uploadDir, newFilename);

                fs.writeFileSync(filePath, file.buffer);
                savedFiles.push(newFilename);
            }
        }

        let attributes: any = undefined;
        if (updateProductDto.attributes !== undefined) {
            attributes = typeof updateProductDto.attributes === 'string'
                ? safeJsonParse(updateProductDto.attributes, [])
                : updateProductDto.attributes;
        }

        const productData: any = {
            ...updateProductDto,
            ...(savedFiles ? { images: savedFiles } : {}),
            ...(attributes !== undefined ? { attributes } : {}),
        };

        const result = await this.productsRepository.update(id, productData);
        if (!result) {
            throw new NotFoundException(`Product with id ${id} not found`);
        }

        return {
            success: true,
            message: "Product updated successfully"
        };
    }

    async remove(id: number) {
        await this.productsRepository.delete(id);

        return ({ success: true, message: 'Product deleted successfully' })
    }
    async findByTitle(title: string) {
        const products: product[] = await this.productsRepository.findByTitle(title);

        if (products.length > 0) {
            products.forEach((product: any) => {
                product.images = safeJsonParse(product.images, []);
                product.slug = "irf-" + (product.id ? product.id.toString().padStart(4, "0") : "");
            });
            return ({ success: true, message: 'Products got successfully', data: products })
        } else {
            return ({ success: true, message: 'No products found', data: [] })
        }

    }
}
