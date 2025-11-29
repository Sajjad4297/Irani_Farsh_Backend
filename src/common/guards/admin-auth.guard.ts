import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { verifyAdminToken } from "../utils/token";


@Injectable()
export class AdminAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const req: FastifyRequest = context.switchToHttp().getRequest();
        const token = req.cookies?.token;
        if (!token) {
            throw new ForbiddenException('Admin not logged in');
        }
        const decoded = verifyAdminToken(token);

        if (!decoded) {
            throw new ForbiddenException('Invalid or expired token');
        }

        // Attach user to request
        (req as any).admin = decoded;

        return true;
    }
}
