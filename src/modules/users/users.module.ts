import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { VerificationService } from './verification.service';
import { MailService } from 'src/common/utils/mail.service';

@Module({
    controllers: [UsersController],
    providers: [UsersService, UsersRepository, VerificationService, MailService],
})
export class UsersModule { }
