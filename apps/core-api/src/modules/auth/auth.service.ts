import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../prisma/prisma.service'
import { RedisService } from '../../redis/redis.service'
import { compare, hash } from 'bcryptjs'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private cfg: ConfigService,
    private redis: RedisService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    // Generic message — prevents user enumeration
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials')
    const ok = await compare(password, user.passwordHash)
    if (!ok) throw new UnauthorizedException('Invalid credentials')
    return this.issueTokens(user)
  }

  async refresh(refreshToken: string) {
    let claims: any
    try {
      claims = await this.jwt.verifyAsync(refreshToken, {
        secret: this.cfg.get('JWT_SECRET') + '-refresh',
      })
    } catch {
      throw new UnauthorizedException('Invalid refresh token')
    }
    const user = await this.prisma.user.findUnique({ where: { id: claims.sub } })
    if (!user) throw new UnauthorizedException()
    return this.issueTokens(user)
  }

  async requestOtp(email: string) {
    const normalized = email.toLowerCase().trim()
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    await this.redis.client.set(`otp:${normalized}`, code, 'EX', 300)
    console.log(`[OTP] ${normalized} → ${code}`)   // dev logging; replace with email dispatch in prod
    const isDev = this.cfg.get('NODE_ENV') !== 'production'
    return { sent: true, ...(isDev ? { devOtp: '000000' } : {}) }
  }

  async verifyOtp(email: string, otp: string) {
    const normalized = email.toLowerCase().trim()
    const isDev = this.cfg.get('NODE_ENV') !== 'production'
    const masterOk = isDev && otp === '000000'

    if (!masterOk) {
      const stored = await this.redis.client.get(`otp:${normalized}`)
      if (!stored || stored !== otp) throw new BadRequestException('Invalid or expired OTP')
      await this.redis.client.del(`otp:${normalized}`)
    }

    let user = await this.prisma.user.findUnique({ where: { email: normalized } })
    if (!user) {
      // First OTP verify → auto-register the candidate.
      // Look up institution so the FK is never empty.
      const inst = await this.prisma.institution.findFirst({ orderBy: { createdAt: 'asc' } })
      if (!inst) throw new BadRequestException('No institution configured — run: npm run prisma:seed')
      user = await this.prisma.user.create({
        data: {
          institutionId: inst.id,
          role: 'CANDIDATE',
          name: normalized.split('@')[0],
          email: normalized,
          emailVerified: true,
        },
      })
    } else {
      await this.prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } })
    }

    return this.issueTokens(user)
  }

  private issueTokens(user: any) {
    // Include email + name so the frontend can use decoded claims without a separate /users/me call
    const payload = {
      sub: user.id,
      role: user.role,
      institutionId: user.institutionId,
      perms: user.permissions ?? [],
      email: user.email,
      name: user.name,
    }
    const accessToken = this.jwt.sign(payload, { expiresIn: this.cfg.get('JWT_ACCESS_TTL') ?? '900s' })
    const refreshToken = this.jwt.sign(payload, {
      secret: this.cfg.get('JWT_SECRET') + '-refresh',
      expiresIn: this.cfg.get('JWT_REFRESH_TTL') ?? '30d',
    })
    return { accessToken, refreshToken }
  }
}
