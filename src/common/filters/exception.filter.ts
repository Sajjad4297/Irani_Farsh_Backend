import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

@Catch(HttpException)
export class MyExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const status = exception.getStatus();
    const res = exception.getResponse() as
      | string
      | { message: any; error?: string; statusCode?: number };

    let message: string | string[] = typeof res === 'string' ? res : (res.message ?? res);

    response.code(status).send({
      success: false,
      statusCode: status,
      message
    });
  }
}
