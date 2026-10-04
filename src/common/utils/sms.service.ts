import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import 'dotenv/config';

export function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.trim().replace(/[\s-]/g, '');
  if (cleaned.startsWith('+98')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('0098')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('98') && cleaned.length === 12) {
    cleaned = '0' + cleaned.slice(2);
  } else if (!cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }
  return cleaned;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiKey = process.env.FARAZSMS_API_KEY;
  private readonly lineNumber =
    process.env.FARAZSMS_LINE_NUMBER || '2191307530';
  private readonly baseUrl = (
    process.env.FARAZSMS_BASE_URL || 'https://api.iranpayamak.com'
  ).replace(/\/+$/, '');

  /**
   * Send OTP SMS via FarazSMS / IranPayamak simple SMS API
   */
  async sendOtp(phone: string, otpCode: string, firstName: string = 'کاربر') {
    const normalized = normalizePhoneNumber(phone);
    const text = `کاربر گرامی ${firstName}\nکد تایید شما در ایرانی فرش: ${otpCode}\nاین کد تا ۱۰ دقیقه معتبر است.`;

    return this.sendSms(normalized, text);
  }

  /**
   * Send simple SMS message to one or multiple recipients
   */
  async sendSms(recipients: string | string[], text: string) {
    const recipientList = (
      Array.isArray(recipients) ? recipients : [recipients]
    ).map(normalizePhoneNumber);

    if (!this.apiKey) {
      this.logger.warn(
        `[FarazSMS] FARAZSMS_API_KEY is not configured. Mocking SMS to [${recipientList.join(', ')}]:\n"${text}"`,
      );
      return {
        status: 'success',
        mock: true,
        recipients: recipientList,
        text,
      };
    }

    try {
      const url = `${this.baseUrl}/ws/v1/sms/simple`;
      const payload = {
        text,
        line_number: this.lineNumber,
        recipients: recipientList,
        number_format: 'english',
        schedule: null,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Api-Key': this.apiKey,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `[FarazSMS] HTTP ${response.status} from ${url}: ${errorText}`,
        );
        throw new InternalServerErrorException(
          'Failed to send SMS through provider',
        );
      }

      const result: any = await response.json();
      if (result?.status && result.status !== 'success') {
        this.logger.error(
          `[FarazSMS] Response error: ${JSON.stringify(result)}`,
        );
        throw new InternalServerErrorException(
          'SMS provider rejected the request',
        );
      }

      return result;
    } catch (error: any) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(
        `[FarazSMS] Network or execution error: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('SMS service connection failure');
    }
  }
}
