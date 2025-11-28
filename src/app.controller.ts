import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { IsNotEmpty, IsString } from 'class-validator';

export class loginAdminDto {
    @IsString()
    @IsNotEmpty()
    userName: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) { }
    @Get()
    getHello(): string {
        return 'Hello From Backend!';
    }

    @Post('login')
    login(@Body() body: loginAdminDto) {
        return this.appService.login(body);
    }
}
