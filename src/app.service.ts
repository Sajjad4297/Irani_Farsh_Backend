import { BadRequestException, Injectable } from '@nestjs/common';
import { loginAdminDto } from './app.controller';
import { generateAdminToken, verifyAdminToken } from './common/utils/token';
import { FastifyReply, FastifyRequest } from 'fastify';
import { MailService } from './common/utils/mail.service';
import { SmsService } from './common/utils/sms.service';

@Injectable()
export class AppService {
  constructor(
    private readonly mailService: MailService,
    private readonly smsService: SmsService,
  ) {}
  login(body: loginAdminDto, reply: FastifyReply) {
    const { username, password } = body;
    const admins = [
      {
        name: 'سجاد عزیز',
        username: 'sajy',
        password: '@Sajjad2005',
      },
      {
        name: 'سجاد عزیز',
        username: 'sjad002',
        password: 'Sajjad1384@@',
      },
      {
        name: 'مهدی عزیز',
        username: 'mahdi-m84',
        password: 'Mahdi1384',
      },
    ];
    const admin = admins.find(
      (a) => a.username === username && a.password === password,
    );
    if (admin) {
      const token = generateAdminToken(admin.username);
      reply.setCookie('token', token, {
        httpOnly: true,
        signed: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 1,
        path: '/',
        domain: '.sajlab.ir', // <-- required for cross-subdomain cookie
      });
      reply.setCookie('adminName', admin.name, {
        httpOnly: false,
        signed: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 1,
        path: '/',
        domain: '.sajlab.ir', // <-- required for cross-subdomain cookie
      });

      return { success: true, message: 'Admin logged in successfully' };
    }

    throw new BadRequestException('Invalid username or password');
  }
  async logout(request: FastifyRequest, reply: FastifyReply) {
    const token = request.cookies?.token;
    if (!token) {
      throw new BadRequestException('Admin not logged in');
    }
    reply.clearCookie('token', {
      path: '/',
      domain: '.sajlab.ir',
    });

    reply.clearCookie('adminName', {
      path: '/',
      domain: '.sajlab.ir',
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
