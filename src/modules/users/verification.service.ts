// verification.service.ts
import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import * as crypto from 'crypto';

@Injectable()
export class VerificationService {
  private readonly OTP_EXPIRY = 10 * 60 * 1000; // 10 minutes in milliseconds
  private readonly RESEND_COOLDOWN = 60 * 1000; // 60 seconds

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async createRegistrationSession(userData: any): Promise<string> {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const otp = crypto.randomInt(100000, 999999).toString();

    await this.cacheManager.set(`reg:${sessionId}`, {
      userData,
      otp,
      attempts: 0,
      createdAt: Date.now()
    }, this.OTP_EXPIRY);

    return sessionId;
  }

  async getOtpForSession(sessionId: string): Promise<string | null> {
    const session = await this.cacheManager.get(`reg:${sessionId}`) as any;
    return session?.otp || null;
  }

  async verifySession(sessionId: string, userOtp: string): Promise<{ isValid: boolean; userData?: any }> {
    const session = await this.cacheManager.get(`reg:${sessionId}`) as any;

    if (!session) {
      return { isValid: false };
    }

    const { userData, otp, attempts, createdAt } = session;

    // Check expiration
    if (Date.now() - createdAt > this.OTP_EXPIRY) {
      await this.cacheManager.del(`reg:${sessionId}`);
      return { isValid: false };
    }

    // Check attempts
    if (attempts >= 3) {
      await this.cacheManager.del(`reg:${sessionId}`);
      return { isValid: false };
    }

    // Calculate remaining TTL
    const remainingTTL = this.OTP_EXPIRY - (Date.now() - createdAt);

    // Update attempts
    await this.cacheManager.set(`reg:${sessionId}`, {
      ...session,
      attempts: attempts + 1
    }, remainingTTL);

    if (otp !== userOtp) {
      return { isValid: false };
    }

    // Clear session on success
    await this.cacheManager.del(`reg:${sessionId}`);

    return { isValid: true, userData };
  }

  async getSession(sessionId: string): Promise<any> {
    return await this.cacheManager.get(`reg:${sessionId}`);
  }

  async regenerateOtp(sessionId: string): Promise<string> {
    const session = await this.cacheManager.get(`reg:${sessionId}`) as any;

    if (!session) {
      throw new Error('Session not found');
    }

    // Enforce a cooldown between OTP issuances so resend can't be used to
    // reset the attempt counter for rapid-fire guessing.
    const lastSentAt = session.lastSentAt ?? session.createdAt;
    const elapsed = Date.now() - lastSentAt;
    if (elapsed < this.RESEND_COOLDOWN) {
      const wait = Math.ceil((this.RESEND_COOLDOWN - elapsed) / 1000);
      throw new HttpException(
        `Please wait ${wait} seconds before requesting a new code`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const newOtp = crypto.randomInt(100000, 1000000).toString();
    const remainingTTL = this.OTP_EXPIRY - (Date.now() - session.createdAt);

    await this.cacheManager.set(`reg:${sessionId}`, {
      ...session,
      otp: newOtp,
      lastSentAt: Date.now(),
      attempts: 0 // Reset attempts (only after cooldown)
    }, remainingTTL);

    return newOtp;
  }

  async clearSession(sessionId: string): Promise<void> {
    await this.cacheManager.del(`reg:${sessionId}`);
  }
}
