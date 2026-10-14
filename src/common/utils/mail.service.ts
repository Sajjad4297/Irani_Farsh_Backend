import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import emailjs from '@emailjs/nodejs';
import 'dotenv/config';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private readonly serviceId = process.env.EMAILJS_SERVICE_ID;
    private readonly templateId = process.env.EMAILJS_TEMPLATE_ID;
    private readonly publicKey = process.env.EMAILJS_PUBLIC_KEY;
    private readonly privateKey = process.env.EMAILJS_PRIVATE_KEY;

    private isPlaceholder(value?: string): boolean {
        if (!value) return true;
        const lower = value.trim().toLowerCase();
        return (
            lower === '' ||
            lower.includes('your_') ||
            lower.includes('placeholder') ||
            lower.includes('replace_with') ||
            lower.startsWith('<') ||
            lower.length < 6
        );
    }

    private get isConfigured(): boolean {
        return !(
            this.isPlaceholder(this.serviceId) ||
            this.isPlaceholder(this.templateId) ||
            this.isPlaceholder(this.publicKey)
        );
    }

    /**
     * Send a one-time password to the user's email via EmailJS.
     *
     * The EmailJS template (dashboard) is expected to use these variables:
     *   {{to_email}}  - recipient address (set the template "To Email" field to {{to_email}})
     *   {{to_name}}   - recipient first name
     *   {{otp_code}}  - the one-time password
     */
    async sendOtp(to: string, otpCode: string = '262626', firstName: string = 'کاربر') {
        if (!this.isConfigured || process.env.EMAIL_MOCK === 'true') {
            this.logger.warn(
                `[EmailJS] [MOCK OTP] Email: ${to} | OTP: [${otpCode}]`,
            );
            return {
                status: 'success',
                mock: true,
                code: otpCode,
                to,
            };
        }

        try {
            const response = await emailjs.send(
                this.serviceId as string,
                this.templateId as string,
                {
                    to_email: to,
                    to_name: firstName,
                    otp_code: otpCode,
                },
                {
                    publicKey: this.publicKey as string,
                    privateKey: this.privateKey,
                },
            );

            return response;
        } catch (error: any) {
            this.logger.error(
                `[EmailJS] Failed to send OTP email: ${error?.text || error?.message || error}`,
                error?.stack,
            );
            this.logger.warn(
                `[EmailJS] [FALLBACK OTP LOG] Email: ${to} | OTP: [${otpCode}]`,
            );
            throw new InternalServerErrorException(
                'Failed to send verification email',
            );
        }
    }
}
