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
    // Generic error — no user enumeration
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
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    await this.redis.client.set(`otp:${email}`, code, 'EX', 300)
    // TODO: dispatch via notification service (email/SMS)
    console.log(`OTP for ${email}: ${code}`)   // dev only
    return { sent: true }
  }

  async verifyOtp(email: string, otp: string) {
    const stored = await this.redis.client.get(`otp:${email}`)
    if (!stored || stored !== otp) throw new BadRequestException('Invalid or expired OTP')
    await this.redis.client.del(`otp:${email}`)
    let user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) {
      user = await this.prisma.user.create({
        data: { institutionId: '', role: 'CANDIDATE', name: email, email, emailVerified: true },
      })
    } else {
      await this.prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } })
    }
    return this.issueTokens(user)
  }

  private issueTokens(user: any) {
    const payload = { sub: user.id, role: user.role, institutionId: user.institutionId, perms: user.permissions }
    const accessToken = this.jwt.sign(payload, { expiresIn: this.cfg.get('JWT_ACCESS_TTL') })
    const refreshToken = this.jwt.sign(payload, {
      secret: this.cfg.get('JWT_SECRET') + '-refresh',
      expiresIn: this.cfg.get('JWT_REFRESH_TTL'),
    })
    return { accessToken, refreshToken }
  }
}
