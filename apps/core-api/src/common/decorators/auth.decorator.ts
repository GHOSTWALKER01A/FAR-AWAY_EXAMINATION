import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { JwtPayload, UserRole } from '../types/jwt-payload'

/** Require one or more fine-grained permissions on a route. */
export const Require = (...perms: string[]) => SetMetadata('perms', perms)

/** Require one of these roles (checked by the guard). */
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles)

/** Inject the verified JWT payload as a route parameter. */
export const AuthUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): JwtPayload => {
  const req = ctx.switchToHttp().getRequest()
  return req.user
})
