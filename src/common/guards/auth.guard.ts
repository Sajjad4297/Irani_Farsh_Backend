import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException
} from '@nestjs/common';
import { verifyUserToken } from '../utils/token'; // YOUR verify function
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req: Request = context.switchToHttp().getRequest();

    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization required');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyUserToken(token);

    if (!decoded) {
      throw new ForbiddenException('Invalid or expired token');
    }

    // Attach user to request (same as Express)
    (req as any).user = decoded;

    return true;
  }
}
