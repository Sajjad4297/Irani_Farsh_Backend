import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, Put, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FastifyFileInterceptor } from 'src/common/interceptors/fastify-file.interceptor';
import { Files } from 'src/common/decorators/files.decorator';
import { ImageValidationPipe, OptionalImageValidationPipe } from 'src/common/pipes/image-validation.pipe';
import { AdminAuthGuard } from 'src/common/guards/admin-auth.guard';

@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @UseGuards(AdminAuthGuard)
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
    @UseGuards(AdminAuthGuard)
    @UseInterceptors(FastifyFileInterceptor)
    update(@Param('id',ParseIntPipe) id: string, @Body() updateCategoryDto: UpdateCategoryDto , @Files(OptionalImageValidationPipe) file) {
        return this.categoriesService.update(+id, updateCategoryDto, file);
    }
    @Delete(':id')
    @UseGuards(AdminAuthGuard)
    remove(@Param('id',ParseIntPipe) id: string) {
        return this.categoriesService.remove(+id);
    }

    @Get(":slug")
    findProducts(@Param('slug') slug: string) {
        return this.categoriesService.findProducts(slug);
    }
}
