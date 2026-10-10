import { BadRequestException, Injectable } from '@nestjs/common';
import { loginAdminDto } from './app.controller';
import { generateAdminToken, verifyAdminToken } from './common/utils/token';
import { FastifyReply, FastifyRequest } from 'fastify';
import { MailService } from './common/utils/mail.service';
import { SmsService } from './common/utils/sms.service';
import bcrypt from 'bcrypt';

@Injectable()
export class AppService {
  constructor(
    private readonly mailService: MailService,
    private readonly smsService: SmsService,
  ) {}

  private static readonly DUMMY_HASH = bcrypt.hashSync('dummy-password', 12);

  /**
   * Admin accounts come from the ADMIN_USERS env var: a JSON array of
   * { name, username, passwordHash } where passwordHash is a bcrypt hash.
   */
  private loadAdmins(): { name: string; username: string; passwordHash: string }[] {
    const raw = process.env.ADMIN_USERS;
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async login(body: loginAdminDto, reply: FastifyReply) {
    const { username, password } = body;
    const admins = this.loadAdmins();
    const candidate = admins.find((a) => a.username === username);
    // Always run a bcrypt compare to keep timing uniform for unknown users.
    const hash = candidate?.passwordHash ?? AppService.DUMMY_HASH;
    const passwordOk = await bcrypt.compare(String(password), hash);
    const admin = candidate && passwordOk ? candidate : undefined;
    if (admin) {
      const token = generateAdminToken(admin.username);
      const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

      reply.setCookie('token', token, {
        httpOnly: true,
        signed: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 1,
        path: '/',
        domain: cookieDomain,
      });
      reply.setCookie('adminName', admin.name, {
        httpOnly: false,
        signed: false,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 1,
        path: '/',
        domain: cookieDomain,
      });

      return {
        success: true,
        message: 'Admin logged in successfully',
        adminName: admin.name,
        token,
      };
    }

    throw new BadRequestException('Invalid username or password');
  }
  async logout(request: FastifyRequest, reply: FastifyReply) {
    const token = request.cookies?.token;
    if (!token) {
      throw new BadRequestException('Admin not logged in');
    }
    const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

    reply.clearCookie('token', {
      path: '/',
      domain: cookieDomain,
    });

    reply.clearCookie('adminName', {
      path: '/',
      domain: cookieDomain,
    });
    return { success: true, message: 'Admin logged out successfully' };
  }
  async sendTestMail(to: string) {
    const result = await this.mailService.send(to);
    console.log(result);
    return { success: true, message: 'Email sent successfully' };
  }
  async sendTestSms(phone: string) {
    const result = await this.smsService.sendOtp(phone, '123456', 'تست');
    return { success: true, message: 'SMS request processed', result };
  }
}
