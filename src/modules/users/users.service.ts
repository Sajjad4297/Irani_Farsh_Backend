import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { comparePassword, hashPassword } from 'src/common/utils/password';
import { UsersRepository } from './users.repository';
import { generateUserToken } from 'src/common/utils/token';
import { User } from './interfaces/user.interface';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { VerifyUserDto } from './dto/verify-user.dto';
import { FastifyReply, FastifyRequest } from 'fastify';
import { VerificationService } from './verification.service';
import { MailService } from 'src/common/utils/mail.service';

@Injectable()
export class UsersService {
    constructor(private readonly usersRepository: UsersRepository,
        private readonly verificationService: VerificationService,
        private readonly mailService: MailService) { }
    async register(body: RegisterUserDto, request: FastifyRequest, reply: FastifyReply) {
        const cookie = request.cookies.reg_session;

        if (cookie) {
            throw new BadRequestException('try some later');
        }

        // Check if user already exists
        const existingUser = await this.usersRepository.findByEmail(body.email);
        if (existingUser) {
            throw new ConflictException('Email is already registered');
        }

        // Hash password
        const hashedPassword = await hashPassword(body.password);

        // Create registration session
        const sessionId = await this.verificationService.createRegistrationSession({
            email: body.email,
            firstName: body.firstName,
            lastName: body.lastName,
            password: hashedPassword,
        });

        // Set HTTP-only cookie
        reply.setCookie('reg_session', sessionId, {
            signed: true,
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 10, // 10 minutes in seconds,
            domain: '.sajlab.ir',   // <-- required for cross-subdomain cookie
        });

        // Get OTP and send email
        const otp: string = await this.verificationService.getOtpForSession(sessionId) as string;
        await this.mailService.send(body.email, otp, body.firstName);

        return {
            success: true,
            message: 'OTP sent to email',
        };
    }

    async login(body: LoginUserDto) {
        const userData = body;
        const existingUser: User = await this.usersRepository.login(userData);
        if (existingUser.id && existingUser.email && existingUser.password && await comparePassword(body.password, existingUser.password)) {
            const token = generateUserToken(existingUser.id, existingUser.email);
            return ({
                success: true, message: 'User logged in successfully', sajy: token,
                user: { firstName: existingUser.firstName, lastName: existingUser.lastName, profileImage: existingUser.profileImage }
            });
        } else {
            throw new BadRequestException('Invalid email or password');
        }

    }


    async findAll() {
        const data = await this.usersRepository.findAll();
        if (data) {
            return ({ success: true, message: 'Users got successfully', data });
        }
    }

    async updateProfile(user: { id: number; email: string }, file: { image: Express.Multer.File }) {

        // Extract filenames
        const image = file.image[0];
        // Generate a unique filename but keep original extension
        const uniqueSuffix = crypto.randomBytes(5).toString("hex");
        const ext = path.extname(image.filename); // ".png", ".jpg", etc.
        const newFilename = `img-${uniqueSuffix}${ext}`;
        const filePath = path.join("uploads/user", newFilename);

        // Save the file
        fs.writeFileSync(filePath, image.buffer);


        await this.usersRepository.updateProfile(user.id, newFilename);


        return ({
            success: true, message: 'Profile updated successfully'
        });
    }
    async update(body: UpdateUserDto, user: { id: number; email: string }) {
        if (!body.address && !body.email && !body.firstName && !body.lastName && !body.password && !body.phone) {
            return new BadRequestException('No data provided');
        }
        if (body.password) {
            body.password = await hashPassword(body.password);
        }
        if (body.address) {
            body.address = JSON.stringify(body.address);
        }
        await this.usersRepository.update(user.id, body);
        return ({ success: true, message: 'User updated successfully' });
    }

    async findUserInfo(user: { id: number; email: string }) {
        const result = await this.usersRepository.findUserInfo(user.id);
        return ({ success: true, message: 'User info got successfully', result });
    }
    async verify(body: VerifyUserDto, request: FastifyRequest, reply: FastifyReply) {
        // Get session ID from cookie
        const signed: any = request.cookies?.reg_session;

        if (!signed) {
            throw new BadRequestException('Registration session expired. Please start again.');
        }
        const unsignResult = request.unsignCookie(signed);


        if (!unsignResult.valid) {
            throw new UnauthorizedException("Invalid cookie signature");
        }
        const sessionId = unsignResult.value;

        // Verify OTP
        const result = await this.verificationService.verifySession(sessionId, body.otp);

        if (!result.isValid || !result.userData) {
            throw new BadRequestException('Invalid or expired OTP');
        }

        // Create user in database
        const newUser = await this.usersRepository.register(result.userData);

        if (!newUser) {
            throw new ConflictException('Failed to create user');
        }

        // Clear registration cookie
        reply.clearCookie('reg_session');

        // Generate auth token
        const token = generateUserToken(newUser.insertId, result.userData.email);

        return {
            success: true,
            message: 'User registered successfully',
            sajy: token,
            user: {
                firstName: result.userData.firstName,
                lastName: result.userData.lastName,
                email: result.userData.email
            }
        };

    }
    async resend(request: FastifyRequest) {
        // Get session ID from cookie
        const signed: any = request.cookies?.reg_session;

        if (!signed) {
            throw new BadRequestException('Registration session expired. Please start again.');
        }
        const unsignResult = request.unsignCookie(signed);


        if (!unsignResult.valid) {
            throw new UnauthorizedException("Invalid cookie signature");
        }
        const sessionId = unsignResult.value;

        if (!sessionId) {
            throw new BadRequestException('No active registration session');
        }

        const session = await this.verificationService.getSession(sessionId);

        if (!session) {
            throw new BadRequestException('Session expired');
        }

        // Generate new OTP
        const newOtp = await this.verificationService.regenerateOtp(sessionId);

        // Send new OTP email
        await this.mailService.send(
            session.userData.email,
            newOtp,
            session.userData.firstName
        );

        return {
            success: true,
            message: 'New OTP sent to email'
        };

    }
}
