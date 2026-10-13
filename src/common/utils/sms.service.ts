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

    private isPlaceholderKey(key?: string): boolean {
        if (!key) return true;
        const lower = key.trim().toLowerCase();
        return (
            lower === '' ||
            lower.includes('your_') ||
            lower.includes('api_key') ||
            lower.includes('placeholder') ||
            lower.includes('replace_with') ||
            lower.startsWith('<') ||
            lower.length < 10
        );
    }

    /**
     * Send OTP SMS via FarazSMS / IranPayamak simple SMS API
     */
    async sendOtp(phone: string, otpCode: string, firstName: string = 'کاربر') {
        const normalized = normalizePhoneNumber(phone);
        const text = `کاربر گرامی ${firstName}\nکد تایید شما در ایرانی فرش: ${otpCode}`;

        return this.sendSms(normalized, text, otpCode, firstName);
    }

    /**
     * Send simple SMS message to one or multiple recipients
     */
    async sendSms(recipients: string | string[], text: string, otpCode?: string, firstName: string = "عزیز") {
        const recipientList = (
            Array.isArray(recipients) ? recipients : [recipients]
        ).map(normalizePhoneNumber);

        if (this.isPlaceholderKey(this.apiKey) || process.env.SMS_MOCK === 'true') {
            this.logger.warn(
                `[FarazSMS] [MOCK OTP] Phone: ${recipientList.join(', ')} | OTP: [${otpCode || text}]`,
            );
            return {
                status: 'success',
                mock: true,
                code: otpCode,
                recipients: recipientList,
                text,
            };
        }

        try {
            const url = `${this.baseUrl}/ws/v1/sms/pattern`;
            const payload = {
                "code": "SJ3FgPrE0C",
                "attributes": {
                    "var1": firstName,
                    "var2": otpCode
                },
                line_number: this.lineNumber,
                recipients: recipientList,
                number_format: 'english',
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Api-Key': (this.apiKey || '').trim(),
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'IraniFarshBackend/1.0',
                },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(10000),
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
            if (otpCode) {
                this.logger.warn(
                    `[FarazSMS] [FALLBACK OTP LOG] Phone: ${recipientList.join(', ')} | OTP: [${otpCode}]`,
                );
            }
            throw new InternalServerErrorException('SMS service connection failure');
        }
    }
}
