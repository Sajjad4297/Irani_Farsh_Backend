import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Files = createParamDecorator(
  (_, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req.files || {};
  }
);
