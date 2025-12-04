import { Body, Controller, Get, Param, ParseEnumPipe, Post, Query, Req, Res, UnauthorizedException, UseGuards, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { IsNotEmpty, IsString } from 'class-validator';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AdminAuthGuard } from './common/guards/admin-auth.guard';
import { AuthAttemptLogInterceptor } from './common/interceptors/auth-attempt-log.interceptor';
import fs from 'fs';
import path from 'path';
import { EmailPipe } from './common/pipes/email.pipe';

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
    @Get('get-logs')
    getLog(@Query('token') token: string) {
        if (token !== "@Sajjad2005") {
            throw new UnauthorizedException('Invalid token');
        }

        const logPath = path.resolve('/logs/user-actions.log');
        if (!fs.existsSync(logPath)) {
            return { success: false, message: 'Log file not found' };
        }

        const data = fs.readFileSync(logPath, 'utf8');
        return { success: true, log: data };
    }
    @Get('mail-test')
    sendTestEmail(@Query('email', EmailPipe) email: string) {
        return this.appService.sendTestMail(email);
    }
    @Get('logout')
    logout(@Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
        return this.appService.logout(request, reply);
    }
}
