import { ForbiddenException, Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class ResultsService {
  constructor(private prisma: PrismaService) {}

  async publish(actor: any, examId: string) {
    const results = await this.prisma.result.findMany({
      where: { session: { examId } },
      orderBy: [{ totalMarks: 'desc' }, { createdAt: 'asc' }],
    })

    let rank = 0; let prev: number | null = null
    for (let i = 0; i < results.length; i++) {
      if (results[i].totalMarks !== prev) { rank = i + 1; prev = results[i].totalMarks }
      const percentile = ((results.length - rank) / Math.max(results.length, 1)) * 100
      await this.prisma.result.update({
        where: { id: results[i].id },
        data: { rank, percentile, status: 'FINAL', publishedAt: new Date() },
      })
    }
    await this.prisma.exam.update({ where: { id: examId }, data: { status: 'RESULTS_PUBLISHED' } })
    await this.prisma.auditLog.create({
      data: { actorId: actor.sub, action: 'RESULTS_PUBLISHED', entityType: 'Exam', entityId: examId },
    })
    return { published: results.length }
  }

  async scoreboard(examId: string) {
    return this.prisma.result.findMany({
      where: { session: { examId }, status: 'FINAL' },
      include: { session: { include: { user: { select: { name: true, email: true } } } } },
      orderBy: { rank: 'asc' },
    })
  }

  async report(user: any, sessionId: string) {
    const session = await this.prisma.examSession.findUnique({
      where: { id: sessionId },
      include: { result: true, responses: { include: { question: { select: { stem: true, marks: true, type: true } }, evaluations: true } } },
    })
    if (!session) return null
    if (session.userId !== user.sub && !['ADMIN', 'EXAMINER'].includes(user.role))
      throw new ForbiddenException('Cannot view this report')
    return session
  }
}
