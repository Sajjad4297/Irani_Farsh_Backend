import { Injectable } from '@nestjs/common';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartItemsRepository } from './cart-items.repository';

@Injectable()
export class CartItemsService {
    constructor(private readonly cartItemsRepository: CartItemsRepository) { }
    async create(body: CreateCartItemDto, user: { id: number, email: string }) {
        const { productId, quantity } = body;
        const { id: userId } = user;
        await this.cartItemsRepository.create({userId, productId, quantity});

        return({ success: true, message: 'Cart item added successfully' });
    }


    async update(body: UpdateCartItemDto, user: { id: number, email: string }) {
        const { productId, quantity } = body;
        const { id: userId } = user;

        await this.cartItemsRepository.update({userId, productId, quantity});

        return({ success: true, message: 'Cart item updated successfully' });
    }
    async buyAll(user: { id: number, email: string }) {
        const { id: userId } = user;
        await this.cartItemsRepository.buyAll(userId);

        return({ success: true, message: 'Cart items bought successfully' });
    }
    async findAllOrders(user: { id: number, email: string }) {
        const { id: userId } = user;
        const orders = await this.cartItemsRepository.findAllOrders(userId);
        return({ success: true, message: 'Orders got successfully', orders });
    }

}
