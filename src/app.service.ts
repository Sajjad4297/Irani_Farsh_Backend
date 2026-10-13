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
   * Admin accounts come from the DEFAULT_ADMINS list plus any valid
   * overrides / extra accounts in the ADMIN_USERS env var.
   */
  private loadAdmins(): { name: string; username: string; passwordHash: string }[] {
    const adminsMap = new Map<string, { name: string; username: string; passwordHash: string }>();

    // 1. Preload built-in accounts
    for (const admin of AppService.DEFAULT_ADMINS) {
      adminsMap.set(admin.username.toLowerCase(), { ...admin });
    }

    // 2. Load from ADMIN_USERS env if valid
    const raw = process.env.ADMIN_USERS;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (!item.username) continue;
            let hash = item.passwordHash || item.password || '';
            if (typeof hash === 'string') {
              hash = hash.replace(/\$\$/g, '$');
            }
            // Ignore incomplete placeholders like '$2b$12$...'
            const isValidBcrypt = hash.startsWith('$2') && hash.length >= 50;
            const isPlain = !hash.startsWith('$2') && hash.length > 0;
            if (isValidBcrypt || isPlain) {
              adminsMap.set(item.username.toLowerCase(), {
                name: item.name || item.username,
                username: item.username,
                passwordHash: hash,
              });
            }
          }
        }
      } catch {
        // ignore invalid JSON
      }
    }

    return Array.from(adminsMap.values());
  }

  async login(body: loginAdminDto, reply: FastifyReply) {
    const { username, password } = body;
    const userClean = (username || '').trim().toLowerCase();
    const admins = this.loadAdmins();
    const candidate = admins.find((a) => a.username.toLowerCase() === userClean);

    let passwordOk = false;
    if (candidate) {
      if (candidate.passwordHash.startsWith('$2')) {
        passwordOk = await bcrypt.compare(String(password), candidate.passwordHash);
      } else {
        passwordOk = String(password) === candidate.passwordHash;
      }
    } else {
      // Dummy compare for uniform timing against username enumeration
      await bcrypt.compare(String(password), AppService.DUMMY_HASH);
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
