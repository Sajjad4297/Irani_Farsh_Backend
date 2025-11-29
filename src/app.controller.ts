import { Body, Controller, Get, Post, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { IsNotEmpty, IsString } from 'class-validator';
import type { FastifyReply } from 'fastify/types/reply';
import { AdminAuthGuard } from './common/guards/admin-auth.guard';
import { AuthAttemptLogInterceptor } from './common/interceptors/auth-attempt-log.interceptor';

export class loginAdminDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}

@UseInterceptors(AuthAttemptLogInterceptor)
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) { }
    @UseGuards(AdminAuthGuard)
    @Get()
    getHello(): string {
        return 'Hello From Backend!';
    }

    @Post('login')
    login(@Body() body: loginAdminDto, @Res({ passthrough: true }) reply: FastifyReply) {
        return this.appService.login(body, reply);
    }
}
