import { Module } from '@nestjs/common';
import { ProductsModule } from './modules/products/products.module';
import { DatabaseModule } from './database/mysql.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { UsersModule } from './modules/users/users.module';
import { CommentsModule } from './modules/comments/comments.module';
import { CartItemsModule } from './modules/cart-items/cart-items.module';
import { DiscountsModule } from './modules/discounts/discounts.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ActionLogInterceptor } from './common/interceptors/action-log.interceptor';

@Module({
    imports: [ProductsModule, DatabaseModule, CategoriesModule, UsersModule, CommentsModule, CartItemsModule, DiscountsModule],
    controllers: [AppController],
    providers: [AppService,{
      provide: APP_INTERCEPTOR,
      useClass: ActionLogInterceptor,
    }],
})
export class AppModule { }
