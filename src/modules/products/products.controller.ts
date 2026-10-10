import { Controller, Get, Post, Body, Param, Delete, UseInterceptors, ParseIntPipe, Put, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FastifyFileInterceptor } from 'src/common/interceptors/fastify-file.interceptor';
import { Files } from 'src/common/decorators/files.decorator';
import { ImageValidationPipe, OptionalImageValidationPipe } from 'src/common/pipes/image-validation.pipe';
import { AdminAuthGuard } from 'src/common/guards/admin-auth.guard';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    @UseGuards(AdminAuthGuard)
    @UseInterceptors(FastifyFileInterceptor)
    create(@Body() createProductDto: CreateProductDto, @Files(ImageValidationPipe) files) {
        return this.productsService.create(createProductDto , files);
    }

    @Get()
    findAll() {
        return this.productsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id',ParseIntPipe) id: string) {
        return this.productsService.findOne(+id);
    }

    @Put(':id')
    @UseGuards(AdminAuthGuard)
    @UseInterceptors(FastifyFileInterceptor)
    update(
      @Param('id', ParseIntPipe) id: string,
      @Body() updateProductDto: UpdateProductDto,
      @Files(OptionalImageValidationPipe) files: any,
    ) {
        return this.productsService.update(+id, updateProductDto, files);
    }

    @Delete(':id')
    @UseGuards(AdminAuthGuard)
    remove(@Param('id',ParseIntPipe) id: string) {
        return this.productsService.remove(+id);
    }

    @Get('search/:title')
    findByTitle(@Param('title') title: string) {
        return this.productsService.findByTitle(title);
    }
}
