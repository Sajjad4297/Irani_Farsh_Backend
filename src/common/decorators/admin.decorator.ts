import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Admin = createParamDecorator((data, ctx: ExecutionContext) : string => {
  const req = ctx.switchToHttp().getRequest();
  return req.admin;
});
