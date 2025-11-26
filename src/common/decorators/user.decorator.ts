import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator((data, ctx: ExecutionContext) : { id: number; email: string } => {
  const req = ctx.switchToHttp().getRequest();
  return req.user;
});
