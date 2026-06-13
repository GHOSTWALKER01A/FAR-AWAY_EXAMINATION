import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class EvaluationService {
  constructor(private prisma: PrismaService) {}

  async runForExam(examId: string) {
    // Sessions submitted for this exam that have PENDING subjective responses
    const sessions = await this.prisma.examSession.findMany({
      where: { examId, status: 'SUBMITTED' }, select: { id: true },
    })
    return { queued: sessions.length, message: 'Grading jobs already dispatched at submission time' }
  }

  async reviewQueue(examId: string) {
    return this.prisma.evaluation.findMany({
      where: {
        status: 'SUGGESTED',
        response: { session: { examId } },
      },
      include: { response: { include: { question: { select: { stem: true, rubric: true, marks: true } } } } },
      orderBy: { confidence: 'asc' },   // lowest confidence first
      take: 50,
    })
  }

  async approve(actor: any, evaluationId: string) {
    const ev = await this.prisma.evaluation.findUnique({ where: { id: evaluationId } })
    if (!ev) throw new NotFoundException()
    return this.prisma.evaluation.update({
      where: { id: evaluationId },
      data: { status: 'APPROVED', grader: 'HUMAN', graderRef: actor.sub },
    })
  }

  async override(actor: any, evaluationId: string, dto: any) {
    const ev = await this.prisma.evaluation.findUnique({ where: { id: evaluationId } })
    if (!ev) throw new NotFoundException()
    return this.prisma.evaluation.update({
      where: { id: evaluationId },
      data: {
        status: 'OVERRIDDEN', grader: 'HUMAN',
        awarded: dto.awarded, criteria: dto.criteria ?? ev.criteria, graderRef: actor.sub,
      },
    })
  }
}
