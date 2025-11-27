import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { CartItemsService } from './cart-items.service';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { User } from 'src/common/decorators/user.decorator';

@Controller('cart-items')
export class CartItemsController {
    constructor(private readonly cartItemsService: CartItemsService) { }

    @Post()
    @UseGuards(AuthGuard)
    create(@Body() createCartItemDto: CreateCartItemDto, @User() user) {
        return this.cartItemsService.create(createCartItemDto, user);
    }


    @Put()
    @UseGuards(AuthGuard)
    update(@Body() updateCartItemDto: UpdateCartItemDto, @User() user) {
        return this.cartItemsService.update(updateCartItemDto, user);
    }

    @Post('order')
    @UseGuards(AuthGuard)
    buyAll(@User() user) {
        return this.cartItemsService.buyAll(user);
    }
    @Get('order')
    @UseGuards(AuthGuard)
    findAllOrders(@User() user) {
        return this.cartItemsService.findAllOrders(user);
    }
}
