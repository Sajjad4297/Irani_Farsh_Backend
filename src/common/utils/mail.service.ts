import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: 'mail.mizbanfalocal.com',   // SMTP server
            port: 465,
            secure: true, //SSL
            auth: {
                user: 'support@sajlab.ir',
                pass: '@Sajjad2005'
            }
        });
    }

    async send(to: string, otpCode: string = "262626", firstName = "کاربر") {
        const html = this.buildHtmlTemplate(firstName, otpCode);
        const text = this.buildTextTemplate(firstName, otpCode);

        return await this.transporter.sendMail({
            from: '"Irani Farsh" <support@sajlab.ir>', // ASCII safe
            to,
            subject: "کد تایید ایمیل شما - ایرانی فرش",
            html,
            text,
            headers: {
                "List-Unsubscribe": `<mailto:support@sajlab.ir>, <https://sajlab.ir/unsubscribe>`
            }
        });
    }

    private buildHtmlTemplate(firstName: string, otpCode: string): string {
        return `
<!doctype html>
<html lang="fa">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width">
  <title>کد تایید ایمیل</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f6;font-family:Tahoma,sans-serif;direction:rtl;text-align:right;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:24px;">
        <table width="600" style="background:#fff;max-width:600px;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:24px;text-align:center;">
              <h1 style="margin:0;font-size:22px;">ایرانی فرش</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px 8px 28px;">
              <p style="font-size:18px;margin:0;">سلام <strong>${firstName}</strong>،</p>
            </td>
          </tr>

          <tr>
            <td style="padding:12px 28px 20px 28px;">
              <p style="color:#555;margin-bottom:16px;">
                کد تایید ورود شما به سامانه ایرانی فرش:
              </p>

              <div style="text-align:center;margin:20px 0;">
                <span style="font-size:28px;font-weight:bold;color:#2563eb;">${otpCode}</span>
              </div>

              <p style="font-size:14px;color:#777;">
                این کد تنها برای ۱۰ دقیقه معتبر است.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 28px;border-top:1px solid #eee;font-size:13px;color:#666;">
              اگر شما این درخواست را انجام ندادید، لطفاً این ایمیل را نادیده بگیرید.
            </td>
          </tr>

          <tr>
            <td style="padding:18px 28px 28px 28px;font-size:12px;color:#999;">
              ایرانی فرش — ایران<br>
              <a href="https://sajlab.ir/unsubscribe" style="color:#999;">لغو اشتراک</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;
    }

    private buildTextTemplate(firstName: string, otpCode: string): string {
        return `
سلام ${firstName}،

کد تایید ورود شما به سامانه ایرانی فرش:

${otpCode}

این کد تنها برای ۱۰ دقیقه معتبر است.
اگر شما این درخواست را انجام ندادید، این ایمیل را نادیده بگیرید.

لغو اشتراک: https://sajlab.ir/unsubscribe
        `;
    }
}
