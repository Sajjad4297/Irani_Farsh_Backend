import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseInterceptors, UseGuards, Req, Res } from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { Files } from 'src/common/decorators/files.decorator';
import { FastifyFileInterceptor } from 'src/common/interceptors/fastify-file.interceptor';
import { UserAuthGuard } from 'src/common/guards/user-auth.guard';
import { User } from 'src/common/decorators/user.decorator';
import { AuthAttemptLogInterceptor } from 'src/common/interceptors/auth-attempt-log.interceptor';
import { ImageValidationPipe } from 'src/common/pipes/image-validation.pipe';
import { VerifyUserDto } from './dto/verify-user.dto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AdminAuthGuard } from 'src/common/guards/admin-auth.guard';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @UseInterceptors(AuthAttemptLogInterceptor)
    @Post('register')
    register(@Body() registerUserDto: RegisterUserDto,@Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
        return this.usersService.register(registerUserDto,request, reply);
    }

    @UseInterceptors(AuthAttemptLogInterceptor)
    @Post('register/verify')
    verify(@Body() verifyUserDto: VerifyUserDto, @Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
        return this.usersService.verify(verifyUserDto, request, reply);
    }

    @UseInterceptors(AuthAttemptLogInterceptor)
    @Post('register/resend')
    resend(@Req() request: FastifyRequest) {
        return this.usersService.resend(request);
    }

    @UseInterceptors(AuthAttemptLogInterceptor)
    @Post('login')
    login(@Body() loginUserDto: LoginUserDto) {
        return this.usersService.login(loginUserDto);
    }


    @Get()
    @UseGuards(AdminAuthGuard)
    findAll() {
        return this.usersService.findAll();
    }

    @Put('profileImage')
    @UseGuards(UserAuthGuard)
    @UseInterceptors(FastifyFileInterceptor)
    updateProfile(@User() user, @Files(ImageValidationPipe) file) {
        return this.usersService.updateProfile(user, file);
    }

    @Put()
    @UseGuards(UserAuthGuard)
    update(@Body() updateUserDto: UpdateUserDto, @User() user) {
        return this.usersService.update(updateUserDto, user);
    }
    @Get('info')
    @UseGuards(UserAuthGuard)
    findUserInfo(@User() user) {
        return this.usersService.findUserInfo(user);
    }

}
