import { Module } from '@nestjs/common';
import { ProductsModule } from './modules/products/products.module';
import { DatabaseModule } from './database/mysql.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { UsersModule } from './modules/users/users.module';
import { CommentsModule } from './modules/comments/comments.module';
import { CartItemsModule } from './modules/cart-items/cart-items.module';
import { DiscountsModule } from './modules/discounts/discounts.module';

@Module({
  imports: [ ProductsModule, DatabaseModule, CategoriesModule, UsersModule, CommentsModule, CartItemsModule, DiscountsModule],
})
export class AppModule {}
