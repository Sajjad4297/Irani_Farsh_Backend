import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseInterceptors, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { Files } from 'src/common/decorators/files.decorator';
import { FastifyFileInterceptor } from 'src/common/interceptors/fastify-file.interceptor';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { User } from 'src/common/decorators/user.decorator';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }
    @Post('register')
    login(@Body() registerUserDto: RegisterUserDto) {
        return this.usersService.register(registerUserDto);
    }

    @Post('login')
    register(@Body() loginUserDto: LoginUserDto) {
        return this.usersService.login(loginUserDto);
    }


    @Get()
    findAll() {
        return this.usersService.findAll();
    }

    @Put('profileImage')
    @UseGuards(AuthGuard)
    @UseInterceptors(FastifyFileInterceptor)
    updateProfile(@User() user, @Files() file) {
        return this.usersService.updateProfile(user, file);
    }

    @Put()
    @UseGuards(AuthGuard)
    update(@Body() updateUserDto: UpdateUserDto, @User() user) {
        return this.usersService.update(updateUserDto, user);
    }
    @Get('info')
    @UseGuards(AuthGuard)
    findUserInfo(@User() user) {
        return this.usersService.findUserInfo(user);
    }

}
