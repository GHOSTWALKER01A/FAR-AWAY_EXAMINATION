import {
  BadRequestException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { hash } from 'bcryptjs'
import type { JwtPayload } from '../../common/types/jwt-payload'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async list(caller: JwtPayload, query: { role?: string; search?: string; page?: number; limit?: number }) {
    const page = query.page ?? 1
    const limit = Math.min(query.limit ?? 20, 100)
    const skip = (page - 1) * limit
    const where: any = { institutionId: caller.institutionId }
    if (query.role) where.role = query.role
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ]
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, select: this.safeFields() }),
      this.prisma.user.count({ where }),
    ])
    return { items, total, page, limit }
  }

  async getById(caller: JwtPayload, id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: this.safeFields() })
    if (!user) throw new NotFoundException('User not found')
    if ((user as any).institutionId !== caller.institutionId) throw new ForbiddenException()
    return user
  }

  async getMe(callerId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: callerId }, select: this.safeFields() })
    if (!user) throw new NotFoundException()
    return user
  }

  async update(caller: JwtPayload, id: string, dto: { name?: string; phone?: string; accessibility?: object }) {
    const existing = await this.prisma.user.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException('User not found')
    const isOwn = existing.id === caller.sub
    const isAdmin = caller.role === 'ADMIN'
    if (!isOwn && !isAdmin) throw new ForbiddenException('Cannot modify another user')
    if (existing.institutionId !== caller.institutionId) throw new ForbiddenException()

    return this.prisma.user.update({
      where: { id },
      data: { name: dto.name, phone: dto.phone, accessibility: dto.accessibility as any },
      select: this.safeFields(),
    })
  }

  async setPassword(caller: JwtPayload, id: string, newPassword: string) {
    if (caller.sub !== id && caller.role !== 'ADMIN') throw new ForbiddenException()
    if (newPassword.length < 8) throw new BadRequestException('Password must be at least 8 characters')
    const passwordHash = await hash(newPassword, 10)
    await this.prisma.user.update({ where: { id }, data: { passwordHash } })
    return { updated: true }
  }

  async deactivate(caller: JwtPayload, id: string) {
    if (caller.role !== 'ADMIN') throw new ForbiddenException('Admin only')
    if (caller.sub === id) throw new BadRequestException('Cannot deactivate your own account')
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user || user.institutionId !== caller.institutionId) throw new NotFoundException('User not found')
    await this.prisma.user.delete({ where: { id } })
    return { deleted: true }
  }

  private safeFields() {
    return {
      id: true, institutionId: true, role: true, name: true, email: true,
      phone: true, accessibility: true, emailVerified: true,
      permissions: true, createdAt: true, updatedAt: true,
    }
  }
}
