import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { RedisService } from '../../redis/redis.service'
import { AiClient } from '../../ai/ai.client'

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService, private redis: RedisService, private ai: AiClient) {}

  async create(actor: any, dto: any) {
    if (['SHORT', 'LONG', 'CODE'].includes(dto.type) && !dto.rubric)
      throw new BadRequestException('Subjective questions require a rubric')
    return this.prisma.question.create({
      data: {
        institutionId: actor.institutionId, type: dto.type, stem: dto.stem,
        options: dto.options, correctKey: dto.correctKey, marks: dto.marks ?? 1,
        difficulty: dto.difficulty ?? 'MEDIUM', topicTags: dto.topicTags ?? [],
        rubric: dto.rubric, irtA: dto.irtA, irtB: dto.irtB, provenance: 'MANUAL',
      },
    })
  }

  async update(actor: any, id: string, dto: any) {
    const q = await this.prisma.question.findUnique({ where: { id } })
    if (!q) throw new NotFoundException()
    const usedInActive = await this.prisma.examQuestion.findFirst({
      where: { questionId: id, exam: { status: { in: ['LIVE', 'CLOSED', 'RESULTS_PUBLISHED'] } } },
    })
    if (!usedInActive) return this.prisma.question.update({ where: { id }, data: dto })
    // Version on edit — freeze old row, create new latest
    return this.prisma.$transaction(async (tx) => {
      await tx.question.update({ where: { id }, data: { isLatest: false } })
      return tx.question.create({
        data: {
          ...dto, institutionId: q.institutionId, type: q.type,
          rootId: q.rootId ?? q.id, version: q.version + 1, isLatest: true,
          calibrationStatus: 'UNCALIBRATED', responseCount: 0, irtA: null, irtB: null,
        },
      })
    })
  }

  async list(actor: any, q: any) {
    const where: any = { institutionId: actor.institutionId, isLatest: true }
    if (q.difficulty) where.difficulty = q.difficulty
    if (q.type) where.type = q.type
    if (q.topic) where.topicTags = { has: q.topic }
    if (q.calibration) where.calibrationStatus = q.calibration
    if (q.search) where.stem = { contains: q.search, mode: 'insensitive' }
    const page = Number(q.page ?? 1); const limit = Number(q.limit ?? 50)
    const [items, total] = await this.prisma.$transaction([
      this.prisma.question.findMany({ where, skip: (page - 1) * limit, take: limit }),
      this.prisma.question.count({ where }),
    ])
    return { items, total, page, limit }
  }

  async bulkPreview(actor: any, file: Express.Multer.File) {
    const rows = this.parseCSV(file.buffer.toString())
    const valid: any[] = []; const errors: any[] = []
    rows.forEach((r, i) => {
      if (!r.stem?.trim()) return errors.push({ row: i + 1, error: 'Missing stem' })
      if (!r.type) return errors.push({ row: i + 1, error: 'Missing type' })
      valid.push({ ...r, institutionId: actor.institutionId, provenance: 'BULK' })
    })
    const previewId = await this.redis.stashPreview(actor.institutionId, valid)
    return { previewId, total: rows.length, valid: valid.length, errors }
  }

  async bulkCommit(actor: any, previewId: string) {
    const rows = await this.redis.popPreview(actor.institutionId, previewId)
    if (!rows) throw new BadRequestException('Preview expired — please re-upload')
    await this.prisma.question.createMany({ data: rows })
    return { committed: rows.length }
  }

  async aiDraft(actor: any, dto: any) {
    const drafts = await this.ai.generateQuestions({
      topic: dto.topic, count: dto.count ?? 5,
      difficulty: dto.difficulty ?? 'MEDIUM', type: dto.type ?? 'MCQ', language: dto.language ?? 'English',
    })
    return { drafts, note: 'Review and edit before saving. AI provenance will be flagged.' }
  }

  private parseCSV(content: string): any[] {
    const lines = content.split('\n').map((l) => l.trim()).filter(Boolean)
    if (!lines.length) return []
    const headers = lines[0].split(',').map((h) => h.trim())
    return lines.slice(1).map((line) => {
      const vals = line.split(',')
      return Object.fromEntries(headers.map((h, i) => [h, vals[i]?.trim()]))
    })
  }
}
