import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoriesRepository } from './categories.repository';
import { safeJsonParse } from 'src/common/utils/json.util';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
@Injectable()
export class CategoriesService {

    constructor(private readonly categoriesRepository: CategoriesRepository) { }

    async create(body: CreateCategoryDto, file: { image: Express.Multer.File },) {
        // Extract filenames
        const image = file.image[0];
        // Generate a unique filename but keep original extension
        const uniqueSuffix = crypto.randomBytes(5).toString("hex");
        const ext = path.extname(image.filename); // ".png", ".jpg", etc.
        const newFilename = `img-${uniqueSuffix}${ext}`;
        const filePath = path.join("uploads/category", newFilename);

        // Save the file
        fs.writeFileSync(filePath, image.buffer);

        const data = { ...body, image: newFilename }


        await this.categoriesRepository.create(data);


        return ({
            success: true, message: 'Category added successfully'
        });

    }

    async findAll() {
        const data = await this.categoriesRepository.findAll();
        if (data) {
            return ({ success: true, message: 'Categories got successfully', data })
        }

    }

    async findProducts(slug: string) {
        const result = await this.categoriesRepository.findProducts(slug);
        if (!result || !result.category)
            throw new NotFoundException('Category not found');

        result.products = safeJsonParse(result.products, []);

        if (Array.isArray(result.products) && result.products.length > 0) {
            result.products.forEach((product: any) => {
                product.images = safeJsonParse(product.images, []);
                product.slug = "irf-" + (product.id ? product.id.toString().padStart(4, "0") : "");
            });
        } else return ({ success: true, message: 'no products in this category', data: result });



        return ({
            success: true,
            message: 'Products in category got successfully',
            data: result,
        });

    }

    async update(id: number, body: UpdateCategoryDto, file: { image: Express.Multer.File }) {
        // Extract filenames
        const image = file.image?.[0];
        if (image) {
            // Generate a unique filename but keep original extension
            const uniqueSuffix = crypto.randomBytes(5).toString("hex");
            const ext = path.extname(image.filename); // ".png", ".jpg", etc.
            const newFilename = `img-${uniqueSuffix}${ext}`;
            const filePath = path.join("uploads/category", newFilename);

            // Save the file
            fs.writeFileSync(filePath, image.buffer);

            const data = { ...body, image: newFilename }
            await this.categoriesRepository.update(id, data);

        } else {
            const data = { ...body }
            await this.categoriesRepository.update(id, data);
        }


        return ({
            success: true, message: 'Category added successfully'
        });
    }

    async remove(id: number) {
        await this.categoriesRepository.delete(id);

        return ({
            success: true, message: 'Category deleted successfully'
        });

    }
}
