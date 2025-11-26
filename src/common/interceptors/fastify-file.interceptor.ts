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
import path from 'path';

@Injectable()
export class FastifyFileInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();

    if (!req.isMultipart())
      throw new HttpException('Form must be multipart/form-data', HttpStatus.BAD_REQUEST);

    const files = {};
    const body = {};

    for await (const part of req.parts()) {
      if (part.type === 'file') {
        const buffer = await part.toBuffer();
        const file = {
          buffer,
          filename: part.filename,
          mimetype: part.mimetype,
          size: buffer.length,
          ext: path.extname(part.filename),
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
