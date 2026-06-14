import { BadRequestException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Anthropic from '@anthropic-ai/sdk'
import { PrismaService } from '../../prisma/prisma.service'
import { RedisService } from '../../redis/redis.service'
import { AiClient } from '../../ai/ai.client'

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name)
  private anthropic: Anthropic

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private ai: AiClient,
    private cfg: ConfigService,
  ) {
    this.anthropic = new Anthropic({ apiKey: this.cfg.get<string>('ANTHROPIC_API_KEY') ?? '' })
  }

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
      const rowData = { ...r, institutionId: actor.institutionId, provenance: 'BULK' }
      if (rowData.marks) rowData.marks = parseFloat(rowData.marks)
      valid.push(rowData)
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

  async aiDraft(_actor: any, dto: any) {
    const anthropicKey = this.cfg.get<string>('ANTHROPIC_API_KEY')
    const geminiKey = this.cfg.get<string>('GEMINI_API_KEY')

    if (!anthropicKey && !geminiKey) {
      throw new ServiceUnavailableException('No AI API key configured. Set ANTHROPIC_API_KEY or GEMINI_API_KEY in .env')
    }

    const { topic, count = 5, difficulty = 'MEDIUM', type = 'MCQ', language = 'English' } = dto
    const needsOptions = type === 'MCQ' || type === 'MULTI_SELECT'

    const optionSchema = needsOptions
      ? `"options": [{"id":"o1","text":"..."},{"id":"o2","text":"..."},{"id":"o3","text":"..."},{"id":"o4","text":"..."}],
    "correctKey": {"optionIds":${type === 'MCQ' ? '["o1"]' : '["o1","o3"]'}},`
      : ''

    const prompt = `Generate exactly ${count} ${difficulty} difficulty ${type} questions about "${topic}" in ${language}.

Respond with ONLY a JSON array, no markdown fences, no explanation:
[
  {
    "stem": "Question text",
    "type": "${type}",
    "difficulty": "${difficulty}",
    "marks": 4,
    ${optionSchema}
    "provenance": "AI"
  }
]

Rules:
- MCQ: 4 options, correctKey.optionIds has exactly 1 correct id
- MULTI_SELECT: 4 options, correctKey.optionIds has 2–3 correct ids
- SHORT/LONG/CODE: omit options and correctKey entirely
- Every object must have provenance: "AI"
- Return exactly ${count} items`

    let text = ''

    // Try Anthropic first if key is present
    if (anthropicKey) {
      try {
        const msg = await this.anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
        })
        text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
        this.logger.log('AI draft via Anthropic')
      } catch (e: any) {
        const reason = e?.error?.error?.message ?? e?.message ?? ''
        this.logger.warn(`Anthropic failed: ${reason} — falling back to Gemini`)
        // Fall through to Gemini if key exists
        if (!geminiKey) {
          throw new ServiceUnavailableException(`AI generation failed: ${reason}`)
        }
      }
    }

    // Use Gemini (free tier) if Anthropic didn't produce output
    if (!text && geminiKey) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
            }),
          },
        )
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          const reason = (err as any)?.error?.message ?? `HTTP ${res.status}`
          this.logger.error(`Gemini API error: ${reason}`)
          throw new ServiceUnavailableException(`AI generation failed: ${reason}`)
        }
        const body = await res.json() as any
        text = body?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''
        this.logger.log('AI draft via Gemini')
      } catch (e: any) {
        if (e instanceof ServiceUnavailableException) throw e
        throw new ServiceUnavailableException(`Gemini request failed: ${e?.message ?? 'Unknown error'}`)
      }
    }

    // Strip markdown fences Gemini sometimes adds
    const json = text.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim()
    let drafts: any[]
    try {
      drafts = JSON.parse(json)
    } catch {
      this.logger.error(`Failed to parse AI response: ${text.slice(0, 300)}`)
      throw new ServiceUnavailableException('AI returned malformed JSON — try again')
    }

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
