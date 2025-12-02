// email.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class EmailPipe implements PipeTransform {
  transform(value: any) {
    const email = value;

    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Invalid email address');
    }

    // Optional: Normalize the email
    return email.toLowerCase().trim();
  }

  private isValidEmail(email: string): boolean {
    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
