import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MyExceptionFilter } from './common/filters/exception.filter';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { join } from 'path';
import fastifyCookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';

async function bootstrap() {
    const cookieSecret = process.env.COOKIE_SECRET;
    if (!cookieSecret) {
        throw new Error(
            'COOKIE_SECRET environment variable is required but not set. Refusing to start.',
        );
    }

    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        // Set TRUST_PROXY=true only when running behind a reverse proxy, so the
        // rate limiter sees the real client IP.
        new FastifyAdapter({
            trustProxy: process.env.TRUST_PROXY === 'true',
            rewriteUrl: (req) => {
                const url = req.url || '/';
                if (!url.startsWith('/api') && !url.startsWith('/uploads')) {
                    return '/api' + url;
                }
                return url;
            },
        }),
    );

    // Stricter per-route limits for SMS/OTP issuance and credential endpoints.
    // Must be registered BEFORE the rate-limit plugin so config is picked up.
    const fastify = app.getHttpAdapter().getInstance();
    fastify.addHook('onRoute', (routeOptions) => {
        const url = routeOptions.url;
        let limit: { max: number; timeWindow: string } | undefined;
        if (/\/users\/register(\/resend)?$/.test(url)) {
            limit = { max: 5, timeWindow: '10 minutes' };
        } else if (/\/users\/register\/verify$/.test(url)) {
            limit = { max: 10, timeWindow: '10 minutes' };
        } else if (/\/(users\/)?login$/.test(url)) {
            limit = { max: 10, timeWindow: '1 minute' };
        }
        if (limit) {
            routeOptions.config = { ...(routeOptions.config as object), rateLimit: limit };
        }
    });
    await app.register(rateLimit, { global: true, max: 300, timeWindow: '1 minute' });

    // Trusted origins only (override with comma-separated CORS_ORIGINS).
    const defaultOrigins = [
        'https://iranifarsh.gawyhub.online',
        'https://admin-iranifarsh.gawyhub.online',
        'https://iranifarsh.neofy.ir',
        'https://admin.iranifarsh.neofy.ir',
    ];
    const allowedOrigins = process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
        : defaultOrigins;

    app.enableCors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            const isAllowed = allowedOrigins.some(
                (o) => o === '*' || o.toLowerCase() === origin.toLowerCase(),
            );
            callback(null, isAllowed);
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new MyExceptionFilter());
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
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
        // Uploaded content must never execute as a document/script.
        setHeaders: (res) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader(
                'Content-Security-Policy',
                "default-src 'none'; img-src 'self'; style-src 'none'; sandbox",
            );
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        },
    });
    await app.register(fastifyCookie, {
        secret: cookieSecret,
    });

    const port = 3000;
    await app.listen(port, '0.0.0.0');
}
bootstrap();
