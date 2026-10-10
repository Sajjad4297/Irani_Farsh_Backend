import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
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
import { SmsService } from 'src/common/utils/sms.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly verificationService: VerificationService,
    private readonly smsService: SmsService,
  ) {}

  async register(
    body: RegisterUserDto,
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const cookie = request.cookies.reg_session;

    if (cookie) {
      throw new BadRequestException('try some later');
    }

    // Check if phone is already registered
    const existingPhone = await this.usersRepository.findByPhone(body.phone);
    if (existingPhone) {
      throw new ConflictException('Phone number is already registered');
    }

    // Check if email is already registered if provided
    if (body.email) {
      const existingEmail = await this.usersRepository.findByEmail(body.email);
      if (existingEmail) {
        throw new ConflictException('Email is already registered');
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(body.password);

    // Create registration session
    const sessionId = await this.verificationService.createRegistrationSession({
      phone: body.phone,
      email: body.email || null,
      firstName: body.firstName,
      lastName: body.lastName,
      password: hashedPassword,
    });

    // Set HTTP-only cookie
    const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
    reply.setCookie('reg_session', sessionId, {
      signed: true,
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 10, // 10 minutes in seconds,
      domain: cookieDomain,
    });

    // Get OTP and send SMS
    const otp: string = (await this.verificationService.getOtpForSession(
      sessionId,
    )) as string;
    await this.smsService.sendOtp(body.phone, otp, body.firstName);

    return {
      success: true,
      message: 'OTP sent to phone',
      sessionId,
    };
  }

  async login(body: LoginUserDto) {
    const identifier = body.phone || body.email;
    if (!identifier) {
      throw new BadRequestException('Phone number or email is required');
    }

    const existingUser: any = await this.usersRepository.login(body);
    if (
      existingUser?.password &&
      (await comparePassword(body.password, existingUser.password))
    ) {
      const token = generateUserToken(
        existingUser.id,
        existingUser.phone,
        existingUser.email,
      );
      return {
        success: true,
        message: 'User logged in successfully',
        sajy: token,
        user: {
          id: existingUser.id,
          phone: existingUser.phone,
          email: existingUser.email,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          profileImage: existingUser.profileImage,
        },
      };
    } else {
      throw new BadRequestException('Invalid credentials');
    }
  }

  async findAll() {
    const data = await this.usersRepository.findAll();
    if (data) {
      return { success: true, message: 'Users got successfully', data };
    }
  }

  async updateProfile(
    user: { id: number; email: string },
    file: { image: Express.Multer.File },
  ) {
    // Extract filenames
    const image = file.image[0];
    // Generate a unique filename but keep original extension
    const uniqueSuffix = crypto.randomBytes(5).toString('hex');
    const ext = path.extname(image.filename); // ".png", ".jpg", etc.
    const newFilename = `img-${uniqueSuffix}${ext}`;
    const filePath = path.join('uploads/user', newFilename);

    // Save the file
    fs.writeFileSync(filePath, image.buffer);

    await this.usersRepository.updateProfile(user.id, newFilename);

    return {
      success: true,
      message: 'Profile updated successfully',
    };
  }

  async update(body: UpdateUserDto, user: { id: number; email: string }) {
    if (
      !body.address &&
      !body.email &&
      !body.firstName &&
      !body.lastName &&
      !body.password &&
      !body.phone
    ) {
      throw new BadRequestException('No data provided');
    }

    // Ensure phone/email aren't already used by another account
    if (body.phone) {
      const existing = await this.usersRepository.findByPhone(body.phone);
      if (existing && existing.id !== user.id) {
        throw new ConflictException('Phone number is already registered');
      }
    }
    if (body.email) {
      const existing = await this.usersRepository.findByEmail(body.email);
      if (existing && existing.id !== user.id) {
        throw new ConflictException('Email is already registered');
      }
    }

    if (body.password) {
      body.password = await hashPassword(body.password);
    }
    if (body.address) {
      body.address = JSON.stringify(body.address);
    }

    try {
      await this.usersRepository.update(user.id, body);
    } catch (err: any) {
      // Race between the pre-check and the update
      if (err?.code === '23505') {
        throw new ConflictException('Phone number or email is already registered');
      }
      throw err;
    }
    return { success: true, message: 'User updated successfully' };
  }

  async findUserInfo(user: { id: number; email: string }) {
    const result = await this.usersRepository.findUserInfo(user.id);
    return { success: true, message: 'User info got successfully', result };
  }

  async verify(
    body: VerifyUserDto,
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    // Get session ID from signed cookie, with fallback to body.sessionId
    let sessionId: string | undefined;
    const signed: any = request.cookies?.reg_session;

    if (signed) {
      const unsignResult = request.unsignCookie(signed);
      if (unsignResult.valid) {
        sessionId = unsignResult.value;
      }
    }

    if (!sessionId && body.sessionId) {
      sessionId = body.sessionId;
    }

    if (!sessionId) {
      throw new BadRequestException(
        'Registration session expired. Please start again.',
      );
    }

    // Verify OTP
    const result = await this.verificationService.verifySession(
      sessionId,
      body.otp,
    );

    if (!result.isValid || !result.userData) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Create user in database
    const newUser = await this.usersRepository.register(result.userData);

    if (!newUser) {
      throw new ConflictException('Failed to create user');
    }

    // Clear registration cookie
    const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
    reply.clearCookie('reg_session', { path: '/', domain: cookieDomain });

    // Generate auth token
    const token = generateUserToken(
      newUser.insertId,
      result.userData.phone,
      result.userData.email,
    );

    return {
      success: true,
      message: 'User registered successfully',
      sajy: token,
      user: {
        id: newUser.insertId,
        phone: result.userData.phone,
        email: result.userData.email,
        firstName: result.userData.firstName,
        lastName: result.userData.lastName,
      },
    };
  }

  async resend(request: FastifyRequest) {
    // Get session ID from signed cookie, with fallback to body.sessionId
    let sessionId: string | undefined;
    const signed: any = request.cookies?.reg_session;

    if (signed) {
      const unsignResult = request.unsignCookie(signed);
      if (unsignResult.valid) {
        sessionId = unsignResult.value;
      }
    }

    if (!sessionId && (request.body as any)?.sessionId) {
      sessionId = (request.body as any).sessionId;
    }

    if (!sessionId) {
      throw new BadRequestException('No active registration session');
    }

    const session = await this.verificationService.getSession(sessionId);

    if (!session) {
      throw new BadRequestException('Session expired');
    }

    // Generate new OTP
    const newOtp = await this.verificationService.regenerateOtp(sessionId);

    // Send new OTP SMS
    await this.smsService.sendOtp(
      session.userData.phone,
      newOtp,
      session.userData.firstName,
    );

    return {
      success: true,
      message: 'New OTP sent to phone',
    };
  }
}
