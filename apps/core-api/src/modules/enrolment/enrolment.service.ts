import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class EnrolmentService {
  constructor(private prisma: PrismaService) {}

  async importRoster(actor: any, examId: string, file: Express.Multer.File) {
    const rows = this.parseCSV(file.buffer.toString())
    const errors: any[] = []; const seen = new Set<string>()
    const valid: any[] = []

    rows.forEach((r, i) => {
      const email = r.email?.trim().toLowerCase()
      if (!email || !email.includes('@')) return errors.push({ row: i + 1, error: 'Invalid email' })
      if (seen.has(email)) return errors.push({ row: i + 1, error: 'Duplicate in file' })
      seen.add(email); valid.push({ ...r, email })
    })

    let created = 0
    for (const r of valid) {
      const user = await this.prisma.user.upsert({
        where: { email: r.email },
        update: {},
        create: { institutionId: actor.institutionId, role: 'CANDIDATE', name: r.name ?? r.email, email: r.email, phone: r.phone },
      })
      const enr = await this.prisma.enrolment.upsert({
        where: { examId_userId: { examId, userId: user.id } },
        update: {},
        create: { examId, userId: user.id },
      })
      if (enr) created++
    }
    return { created, errors }
  }

  async selfRegister(examId: string, dto: any) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } })
    if (!exam || !['LIVE', 'SCHEDULED'].includes(exam.status)) throw new BadRequestException('Registration is closed')
    if (exam.registrationType !== 'OPEN') throw new BadRequestException('Pre-registered exam — contact admin')
    const count = await this.prisma.enrolment.count({ where: { examId, status: 'ENROLLED' } })
    const status = exam.seatCap && count >= exam.seatCap ? 'WAITLISTED' : 'ENROLLED'
    const user = await this.prisma.user.upsert({
      where: { email: dto.email.toLowerCase() },
      update: {},
      create: { institutionId: exam.institutionId, role: 'CANDIDATE', name: dto.name, email: dto.email, emailVerified: true },
    })
    return this.prisma.enrolment.upsert({
      where: { examId_userId: { examId, userId: user.id } },
      update: {},
      create: { examId, userId: user.id, status, slotAt: dto.slotAt ? new Date(dto.slotAt) : undefined },
    })
  }

  async list(examId: string) {
    return this.prisma.enrolment.findMany({ where: { examId }, include: { user: { select: { name: true, email: true } } } })
  }

  async cancel(examId: string, userId: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.enrolment.update({ where: { examId_userId: { examId, userId } }, data: { status: 'CANCELLED' } })
      const next = await tx.enrolment.findFirst({ where: { examId, status: 'WAITLISTED' }, orderBy: { createdAt: 'asc' } })
      if (next) await tx.enrolment.update({ where: { id: next.id }, data: { status: 'ENROLLED' } })
    })
    return { cancelled: true }
  }

  private parseCSV(content: string) {
    const lines = content.split('\n').map((l) => l.trim()).filter(Boolean)
    if (!lines.length) return []
    const headers = lines[0].split(',').map((h) => h.trim())
    return lines.slice(1).map((line) => {
      const vals = line.split(',')
      return Object.fromEntries(headers.map((h, i) => [h, vals[i]?.trim()]))
    })
  }
}
