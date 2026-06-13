import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import type { JwtPayload } from '../../common/types/jwt-payload'

@Injectable()
export class ExamQuestionsService {
  constructor(private prisma: PrismaService) {}

  async list(examId: string) {
    return this.prisma.examQuestion.findMany({
      where: { examId },
      orderBy: { order: 'asc' },
      include: { question: true },
    })
  }

  async attach(caller: JwtPayload, examId: string, dto: { questionId: string; order: number; weight?: number; sectionId?: string }) {
    await this.assertEditable(caller, examId)
    const question = await this.prisma.question.findUnique({ where: { id: dto.questionId } })
    if (!question) throw new NotFoundException('Question not found')
    if (question.institutionId !== caller.institutionId) throw new BadRequestException('Question belongs to a different institution')

    const existing = await this.prisma.examQuestion.findUnique({
      where: { examId_questionId: { examId, questionId: dto.questionId } },
    })
    if (existing) throw new ConflictException('Question already attached to this exam')

    return this.prisma.examQuestion.create({
      data: { examId, questionId: dto.questionId, order: dto.order, weight: dto.weight ?? 1, sectionId: dto.sectionId },
      include: { question: true },
    })
  }

  async detach(caller: JwtPayload, examId: string, questionId: string) {
    await this.assertEditable(caller, examId)
    const existing = await this.prisma.examQuestion.findUnique({
      where: { examId_questionId: { examId, questionId } },
    })
    if (!existing) throw new NotFoundException('Question not in this exam')
    await this.prisma.examQuestion.delete({ where: { examId_questionId: { examId, questionId } } })
    return { detached: true }
  }

  async reorder(caller: JwtPayload, examId: string, items: { questionId: string; order: number }[]) {
    await this.assertEditable(caller, examId)
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.examQuestion.update({
          where: { examId_questionId: { examId, questionId: item.questionId } },
          data: { order: item.order },
        }),
      ),
    )
    return { updated: items.length }
  }

  private async assertEditable(caller: JwtPayload, examId: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } })
    if (!exam) throw new NotFoundException('Exam not found')
    if (exam.institutionId !== caller.institutionId) throw new NotFoundException('Exam not found')
    if (exam.status !== 'DRAFT') throw new BadRequestException(`Exam is ${exam.status} — cannot modify a published exam`)
    return exam
  }
}
