import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class GrievanceService {
  constructor(private prisma: PrismaService) {}

  async raise(user: any, resultId: string, dto: any) {
    const result = await this.prisma.result.findUnique({ where: { id: resultId }, include: { session: true } })
    if (!result) throw new NotFoundException('Result not found')
    if (result.session.userId !== user.sub) throw new BadRequestException('Not your result')
    if (result.status !== 'FINAL') throw new BadRequestException('Results not yet published')
    return this.prisma.grievance.create({ data: { resultId, questionId: dto.questionId, reason: dto.reason } })
  }

  async list(status?: string) {
    const where: any = {}
    if (status) where.status = status
    return this.prisma.grievance.findMany({
      where, include: { result: { include: { session: { include: { user: { select: { name: true, email: true } } } } } } },
      orderBy: { createdAt: 'asc' },
    })
  }

  async resolve(actor: any, grievanceId: string, dto: { upheld: boolean; note: string; adjustedMarks?: number }) {
    const g = await this.prisma.grievance.findUnique({ where: { id: grievanceId }, include: { result: true } })
    if (!g) throw new NotFoundException()

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.grievance.update({
        where: { id: grievanceId },
        data: { status: dto.upheld ? 'UPHELD' : 'REJECTED', reviewerId: actor.sub, resolution: dto.note, resolvedAt: new Date() },
      })

      if (dto.upheld && dto.adjustedMarks !== undefined) {
        // Re-compute this session's result after adjustment
        const allResults = await tx.result.findMany({ where: { session: { examId: (g.result as any).session?.examId } }, orderBy: [{ totalMarks: 'desc' }, { createdAt: 'asc' }] })
        let rank = 0; let prev: number | null = null
        for (let i = 0; i < allResults.length; i++) {
          if (allResults[i].totalMarks !== prev) { rank = i + 1; prev = allResults[i].totalMarks }
          await tx.result.update({ where: { id: allResults[i].id }, data: { rank, percentile: ((allResults.length - rank) / allResults.length) * 100 } })
        }
      }

      await tx.auditLog.create({
        data: { actorId: actor.sub, action: 'GRIEVANCE_RESOLVED', entityType: 'Grievance', entityId: grievanceId, after: dto },
      })
      return updated
    })
  }
}
