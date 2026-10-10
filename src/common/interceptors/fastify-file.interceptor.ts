import {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { MultipartValue } from '@fastify/multipart';

/** Detect image type from magic bytes. Returns null if not jpeg/png/webp. */
function detectImageType(buf: Buffer): { mime: string; ext: string } | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { mime: 'image/jpeg', ext: '.jpg' };
  }
  if (
    buf.length >= 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { mime: 'image/png', ext: '.png' };
  }
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { mime: 'image/webp', ext: '.webp' };
  }
  return null;
}

@Injectable()
export class FastifyFileInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();

    if (!req.isMultipart || !req.isMultipart()) {
      if (!req.files) req.files = {};
      return next.handle();
    }

    const files = {};
    const body = {};

    for await (const part of req.parts()) {
      if (part.type === 'file') {
        const buffer = await part.toBuffer();
        // Never trust the client-supplied mimetype/extension: derive both from content.
        const detected = detectImageType(buffer);
        const ext = detected ? detected.ext : '';
        const file = {
          buffer,
          filename: `upload${ext}`,
          mimetype: detected ? detected.mime : 'application/octet-stream',
          size: buffer.length,
          ext,
        };

        files[part.fieldname] = files[part.fieldname] || [];
        files[part.fieldname].push(file);
      } else {
        body[part.fieldname] = (part as MultipartValue).value;
      }
    }

    req.body = body;
    req.files = files;

    return next.handle();
  }
}
