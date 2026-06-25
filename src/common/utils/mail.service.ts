import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
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
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>کد تایید</title>

  <style>
    /* Responsive Fix */
    @media only screen and (max-width: 600px) {
        .container {
            width: 100% !important;
            border-radius: 0 !important;
        }
        .content {
            padding: 20px !important;
        }
        .otp-box {
            font-size: 30px !important;
        }
    }
  </style>
</head>

<body style="margin:0;padding:0;background:#f1f3f7;font-family:'Tahoma',sans-serif;direction:rtl;text-align:right;">

  <table width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding:20px;">

        <!-- Card -->
        <table width="600" class="container"
               style="background:white;max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 5px 25px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#2563eb;color:white;padding:24px;text-align:center;">
              <h1 style="margin:0;font-size:22px;font-weight:700;">ایرانی فرش</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="content" style="padding:32px;">

              <p style="font-size:18px;margin:0 0 12px 0;">
                سلام <strong>${firstName}</strong> عزیز،
              </p>

              <p style="font-size:15px;color:#555;margin-bottom:20px;">
                کد تایید ورود شما به سامانه ایرانی فرش:
              </p>

              <!-- OTP BOX -->
              <div style="text-align:center;margin:32px 0;">
                <div class="otp-box"
                     style="display:inline-block;background:#f0f7ff;border:1px solid #d2e5ff;padding:14px 28px;border-radius:12px;font-size:34px;font-weight:700;color:#2563eb;letter-spacing:4px;">
                  ${otpCode}
                </div>
              </div>

              <p style="font-size:14px;color:#777;margin-bottom:28px;text-align:center;">
                این کد تا <strong>۱۰ دقیقه</strong> معتبر است.
              </p>

              <p style="font-size:13px;color:#666;border-top:1px solid #eee;padding-top:20px;">
                اگر شما این درخواست را ارسال نکرده‌اید، لطفاً این ایمیل را نادیده بگیرید.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:18px 28px 28px 28px;font-size:12px;color:#999;text-align:center;background:#fafafa;">
              ایرانی فرش — ایران<br>
              <a href="https://sajlab.ir/unsubscribe" style="color:#777;text-decoration:none;">لغو اشتراک</a>
            </td>
          </tr>

        </table>
        <!-- End Card -->

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
