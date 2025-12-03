// verification.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import * as crypto from 'crypto';

@Injectable()
export class VerificationService {
  private readonly OTP_EXPIRY = 10 * 60 * 1000; // 10 minutes in milliseconds

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

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const remainingTTL = this.OTP_EXPIRY - (Date.now() - session.createdAt);

    await this.cacheManager.set(`reg:${sessionId}`, {
      ...session,
      otp: newOtp,
      attempts: 0 // Reset attempts
    }, remainingTTL);

    return newOtp;
  }

  async clearSession(sessionId: string): Promise<void> {
    await this.cacheManager.del(`reg:${sessionId}`);
  }
}
