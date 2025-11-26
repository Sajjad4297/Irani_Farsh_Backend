import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, Put, ParseIntPipe } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FastifyFileInterceptor } from 'src/common/interceptors/fastify-file.interceptor';
import { Files } from 'src/common/decorators/files.decorator';
import { ImageValidationPipe } from 'src/common/pipes/image-validation.pipe';

@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Post()
    @UseInterceptors(FastifyFileInterceptor)
    create(@Body() createCategoryDto: CreateCategoryDto, @Files(ImageValidationPipe) file) {
        return this.categoriesService.create(createCategoryDto, file);
    }

    @Get()
    findAll() {
        return this.categoriesService.findAll();
    }


    @Put(':id')
    @UseInterceptors(FastifyFileInterceptor)
    update(@Param('id',ParseIntPipe) id: string, @Body() updateCategoryDto: UpdateCategoryDto , @Files() file) {
        return this.categoriesService.update(+id, updateCategoryDto, file);
    }

    @Delete(':id')
    remove(@Param('id',ParseIntPipe) id: string) {
        return this.categoriesService.remove(+id);
    }

    @Get(":slug")
    findProducts(@Param('slug') slug: string) {
        return this.categoriesService.findProducts(slug);
    }
}
