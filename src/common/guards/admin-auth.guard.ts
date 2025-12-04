import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { verifyAdminToken } from "../utils/token";


@Injectable()
export class AdminAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const req: FastifyRequest = context.switchToHttp().getRequest();
        const signedToken: any = req.cookies?.token;
        
        if (!signedToken) {
            throw new ForbiddenException('Admin not logged in');
        }

        const result = req.unsignCookie(signedToken);


        if (!result.valid) {
            throw new UnauthorizedException("Invalid cookie signature");
        }
        const token = result.value;

        const decoded = verifyAdminToken(token);

        if (!decoded) {
            throw new ForbiddenException('Invalid or expired token');
        }

        // Attach user to request
        (req as any).admin = decoded;

        return true;
    }
}
