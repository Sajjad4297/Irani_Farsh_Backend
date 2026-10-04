import { Module } from '@nestjs/common';
import { ProductsModule } from './modules/products/products.module';
import { DatabaseModule } from './database/postgres.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { UsersModule } from './modules/users/users.module';
import { CommentsModule } from './modules/comments/comments.module';
import { CartItemsModule } from './modules/cart-items/cart-items.module';
import { DiscountsModule } from './modules/discounts/discounts.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ActionLogInterceptor } from './common/interceptors/action-log.interceptor';
import { MailService } from './common/utils/mail.service';
import { SmsService } from './common/utils/sms.service';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    ProductsModule,
    DatabaseModule,
    CategoriesModule,
    UsersModule,
    CommentsModule,
    CartItemsModule,
    DiscountsModule,
    CacheModule.register({
      isGlobal: true,
      ttl: 600000, // 10 minutes in milliseconds
      max: 1000, // Maximum 1000 sessions
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    MailService,
    SmsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ActionLogInterceptor,
    },
  ],
})
export class AppModule {}
