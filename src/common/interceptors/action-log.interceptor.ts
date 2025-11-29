import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
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

@Injectable()
export class ActionLogInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        let actor: { role: string, identifier: string };
        if (request.user) {
            actor = {
                role: 'user',
                identifier: request.user.email,
            };
        } else if (request.admin) {
            actor = {
                role: 'admin',
                identifier: request.admin,
            }
        } else {
            return next.handle(); //if no actor, don't log
        }


        const logDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

        const logFile = actor.role === 'admin'
            ? path.join(logDir, 'admin-actions.log')
            : path.join(logDir, 'user-actions.log');

        const identifier = actor.role === 'admin'
            ? `Admin: ${actor.identifier}`
            : `User:(${actor.identifier})`;
        const now = getJalaliTimestamp();

        const log = `[${now}] ${request.method} ${request.url}
Actor: ${identifier}
Body: ${JSON.stringify(request.body)}
`;

        const startTime = Date.now();

        return next.handle().pipe(
            tap(() => {
                const duration = Date.now() - startTime;
                fs.promises.appendFile(logFile, log + `Took: ${duration}ms\n\n`).catch(console.error);
            }),
        );
    }
}
