import {
  CanActivate, ExecutionContext, ForbiddenException,
  Injectable, UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Reflector } from '@nestjs/core'

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN:       ['*'],
  EXAMINER:    ['exam.create','exam.configure','exam.publish','question.author','question.bank.manage',
                'rubric.define','evaluation.grade_manual','evaluation.override_ai',
                'evaluation.publish_results','grievance.review','roster.manage'],
  INVIGILATOR: ['session.monitor','session.flag','session.extend_time'],
  CANDIDATE:   ['exam.take'],
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwt: JwtService, private reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest()
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) throw new UnauthorizedException('No token provided')

    let claims: any
    try {
      claims = await this.jwt.verifyAsync(token)
    } catch {
      throw new UnauthorizedException('Invalid or expired token')
    }
    req.user = claims

    const required: string[] = this.reflector.getAllAndOverride('perms', [ctx.getHandler(), ctx.getClass()]) ?? []
    if (required.length === 0) return true

    const granted = new Set([
      ...(ROLE_PERMISSIONS[claims.role] ?? []),
      ...(claims.perms ?? []),
    ])
    if (granted.has('*')) return true
    const ok = required.every((p) => granted.has(p))
    if (!ok) throw new ForbiddenException('Insufficient permissions')
    return true
  }
}
