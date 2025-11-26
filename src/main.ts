import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MyExceptionFilter } from './common/filters/exception.filter';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import multipart from '@fastify/multipart';

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter(),
    );
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: false,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 2MB per file
      files: 10,                 // max number of files
    },
  });
    await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
