import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable, tap, catchError, of } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';
function getJalaliTimestamp(): string {
    const now = new Date();

    const parts = new Intl.DateTimeFormat('en-u-ca-persian', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).formatToParts(now);

    let y = '0000', m = '00', d = '00', h = '00', min = '00', s = '00';

    for (const part of parts) {
        switch (part.type) {
            case 'year': y = part.value; break;
            case 'month': m = part.value.padStart(2, '0'); break;
            case 'day': d = part.value.padStart(2, '0'); break;
            case 'hour': h = part.value.padStart(2, '0'); break;
            case 'minute': min = part.value.padStart(2, '0'); break;
            case 'second': s = part.value.padStart(2, '0'); break;
        }
    }

    return `${y}/${m}/${d}, ${h}:${min}:${s}`;
}

const SENSITIVE_KEYS = new Set([
    'password',
    'newpassword',
    'oldpassword',
    'confirmpassword',
    'otp',
    'code',
    'token',
]);

function redact(value: any): any {
    if (Array.isArray(value)) return value.map(redact);
    if (value && typeof value === 'object') {
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(value)) {
            out[k] = SENSITIVE_KEYS.has(k.toLowerCase()) ? '[REDACTED]' : redact(v);
        }
        return out;
    }
    return value;
}

/** Strip CR/LF so attackers can't forge log lines. */
function clean(value: unknown): string {
    return String(value ?? '').replace(/[\r\n]+/g, ' ');
}

@Injectable()
export class AuthAttemptLogInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        // Only intercept login/register routes
        if (!request.url.includes('/login') && !request.url.includes('/register')) {
            return next.handle();
        }

        const logDir = path.join(process.cwd(), 'logs');
        const logFile = path.join(logDir, 'auth-attempts.log');
        const write = (log: string) =>
            fs.promises
                .mkdir(logDir, { recursive: true })
                .then(() => fs.promises.appendFile(logFile, log))
                .catch(console.error);

        const now = getJalaliTimestamp();

        const method = request.method;
        const body = clean(JSON.stringify(redact(request.body || {})));
        const identifier = clean(
            request.body?.email || request.body?.phone || request.body?.username,
        );

        return next.handle().pipe(
            tap((response) => {
                // Success log
                write(`[${now}] ${method} ${request.url} SUCCESS
Identifier: ${identifier}
Body: ${body}\n-------------------------------------------\n`);
            }),
            catchError((err) => {
                // Failure log
                write(`[${now}] ${method} ${request.url} FAILURE
Identifier: ${identifier}
Body: ${body}
Error: ${clean(err.message)}\n-------------------------------------------\n`);

                throw err; // rethrow so controller still returns error
            }),
        );
    }
}
