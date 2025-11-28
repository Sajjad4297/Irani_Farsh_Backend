import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MyExceptionFilter } from './common/filters/exception.filter';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { join } from 'path';

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter(),
    );

    app.enableCors({
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: false,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // Register multipart
    await app.register(multipart, {
        limits: {
            fileSize: 10 * 1024 * 1024,
            files: 10,
        },
    });

    // Register static file serving - BEFORE setGlobalPrefix or with explicit prefix
    await app.register(fastifyStatic, {
        root: join(__dirname, '..', 'uploads'),
        prefix: '/uploads/', // Explicit prefix
        decorateReply: false, // Important for NestJS with Fastify
    });

    await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
