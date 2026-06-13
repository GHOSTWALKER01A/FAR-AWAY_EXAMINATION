import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  async create(actor: any, dto: any) {
    this.validateMarkingConfig(dto.markingConfig)
    return this.prisma.exam.create({
      data: {
        institutionId: actor.institutionId,
        title: dto.title,
        description: dto.description,
        mode: dto.mode,
        status: 'DRAFT',
        registrationType: dto.registrationType,
        durationSeconds: dto.durationSeconds,
        seatCap: dto.seatCap,
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
        publishAt: dto.publishAt ? new Date(dto.publishAt) : undefined,
        proctoringConfig: dto.proctoringConfig ?? {},
        markingConfig: dto.markingConfig ?? {},
        adaptiveConfig: dto.adaptiveConfig ?? {},
        blueprint: dto.blueprint ?? {},
      },
    })
  }

  async update(actor: any, id: string, dto: any) {
    await this.assertEditable(id)
    return this.prisma.exam.update({ where: { id }, data: { ...dto, updatedAt: new Date() } })
  }

  async findOne(id: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id }, include: { sections: true } })
    if (!exam) throw new NotFoundException('Exam not found')
    return exam
  }

  async list(actor: any, q: any) {
    const page = Number(q.page ?? 1); const limit = Number(q.limit ?? 20)
    const where: any = { institutionId: actor.institutionId }
    if (q.status) where.status = q.status
    if (q.mode) where.mode = q.mode
    const [items, total] = await this.prisma.$transaction([
      this.prisma.exam.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.exam.count({ where }),
    ])
    return { items, total, page, limit, __meta: { total, page, limit } }
  }

  async publish(actor: any, id: string) {
    const exam = await this.assertEditable(id)
    await this.assertPublishable(exam)
    const now = new Date()
    const isScheduled = exam.publishAt && exam.publishAt > now
    return this.prisma.exam.update({ where: { id }, data: { status: isScheduled ? 'SCHEDULED' : 'LIVE' } })
  }

  async close(actor: any, id: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id } })
    if (!exam) throw new NotFoundException()
    if (!['LIVE', 'SCHEDULED'].includes(exam.status)) throw new BadRequestException('Cannot close')
    return this.prisma.exam.update({ where: { id }, data: { status: 'CLOSED' } })
  }

  async assertEditable(id: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id } })
    if (!exam) throw new NotFoundException('Exam not found')
    if (exam.status !== 'DRAFT') throw new BadRequestException(`Exam is ${exam.status} — only DRAFT is editable`)
    return exam
  }

  private async assertPublishable(exam: any) {
    if (!exam.startAt || !exam.endAt || new Date(exam.startAt) >= new Date(exam.endAt))
      throw new BadRequestException('Invalid or missing time window (startAt must be before endAt)')
    if (exam.durationSeconds <= 0) throw new BadRequestException('Duration must be positive')
    if (exam.mode === 'FIXED') {
      const count = await this.prisma.examQuestion.count({ where: { examId: exam.id } })
      if (count === 0) throw new BadRequestException('Fixed exam has no questions attached')
    }
  }

  private validateMarkingConfig(cfg: any) {
    if (!cfg) return
    if (cfg.negativePenalty && cfg.negativePenalty > 1)
      throw new BadRequestException('Negative penalty cannot exceed question marks (>1 ratio)')
  }

  // Scheduled-publish reaper — fires every 30s
  @Cron('*/30 * * * * *')
  async activateDueExams() {
    const now = new Date()
    const due = await this.prisma.exam.findMany({
      where: { status: 'SCHEDULED', publishAt: { lte: now } },
      select: { id: true },
    })
    if (due.length)
      await this.prisma.exam.updateMany({ where: { id: { in: due.map((d) => d.id) } }, data: { status: 'LIVE' } })
  }
}
