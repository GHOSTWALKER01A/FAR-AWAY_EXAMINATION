import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import type { JwtPayload } from '../../common/types/jwt-payload'

@Injectable()
export class SectionsService {
  constructor(private prisma: PrismaService) {}

  async list(examId: string) {
    return this.prisma.examSection.findMany({
      where: { examId },
      orderBy: { order: 'asc' },
      include: { _count: { select: { examQuestions: true } } },
    })
  }

  async create(caller: JwtPayload, examId: string, dto: { title: string; order: number; durationSeconds?: number; markingConfig?: object }) {
    await this.assertExamOwnership(caller, examId)
    return this.prisma.examSection.create({
      data: { examId, title: dto.title, order: dto.order, durationSeconds: dto.durationSeconds, markingConfig: dto.markingConfig as any ?? {} },
    })
  }

  async update(caller: JwtPayload, examId: string, sectionId: string, dto: { title?: string; order?: number; durationSeconds?: number; markingConfig?: object }) {
    await this.assertExamOwnership(caller, examId)
    const section = await this.prisma.examSection.findUnique({ where: { id: sectionId } })
    if (!section || section.examId !== examId) throw new NotFoundException('Section not found')
    return this.prisma.examSection.update({
      where: { id: sectionId },
      data: { title: dto.title, order: dto.order, durationSeconds: dto.durationSeconds, markingConfig: dto.markingConfig as any },
    })
  }

  async remove(caller: JwtPayload, examId: string, sectionId: string) {
    await this.assertExamOwnership(caller, examId)
    const section = await this.prisma.examSection.findUnique({ where: { id: sectionId } })
    if (!section || section.examId !== examId) throw new NotFoundException('Section not found')
    await this.prisma.examSection.delete({ where: { id: sectionId } })
    return { deleted: true }
  }

  private async assertExamOwnership(caller: JwtPayload, examId: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } })
    if (!exam) throw new NotFoundException('Exam not found')
    if (exam.institutionId !== caller.institutionId) throw new ForbiddenException()
    return exam
  }
}
