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

  private static readonly DEFAULT_ADMINS = [
    {
      name: 'سجاد عزیز',
      username: 'sajy',
      passwordHash: '$2b$12$17aHNEBPfv0hidP5CRgsm.rYvZmm9NpBxzvakV6oXOI1xrD09yFX.',
    },
    {
      name: 'سجاد عزیز',
      username: 'sjad002',
      passwordHash: '$2b$12$Qah9LmgzIftT/iRBkG1jtu04O9jHUzbn.NSNT5uukHQdlyXxNo3IS',
    },
    {
      name: 'مهدی عزیز',
      username: 'mahdi-m84',
      passwordHash: '$2b$12$/mtrkEKLWAQGoY3b03uA/.c53rh1EPl8fIzdeLw7/dtGKtpLONVAm',
    },
  ];

  /**
   * Admin accounts come from the ADMIN_USERS env var: a JSON array of
   * { name, username, passwordHash } where passwordHash is a bcrypt hash.
   * If not set, falls back to pre-hashed default admin accounts.
   */
  private loadAdmins(): { name: string; username: string; passwordHash: string }[] {
    const raw = process.env.ADMIN_USERS;
    let list: any[] = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          list = parsed;
        }
      } catch {
        // invalid JSON
      }
    }

    if (list.length === 0) {
      list = AppService.DEFAULT_ADMINS;
    }

    return list.map((a) => {
      let hash = a.passwordHash || a.password || '';
      // Fix potential Docker-compose double-dollar escaping: $$2b$$ -> $2b$
      if (typeof hash === 'string') {
        hash = hash.replace(/\$\$/g, '$');
      }
      return {
        name: a.name || a.username,
        username: a.username,
        passwordHash: hash,
      };
    });
  }

  async login(body: loginAdminDto, reply: FastifyReply) {
    const { username, password } = body;
    const admins = this.loadAdmins();
    const candidate = admins.find((a) => a.username === username);
    // Always run a bcrypt compare to keep timing uniform for unknown users.
    const hash = candidate?.passwordHash ?? AppService.DUMMY_HASH;
    let passwordOk = false;
    if (hash.startsWith('$2')) {
      passwordOk = await bcrypt.compare(String(password), hash);
    } else {
      passwordOk = String(password) === hash;
    }
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
