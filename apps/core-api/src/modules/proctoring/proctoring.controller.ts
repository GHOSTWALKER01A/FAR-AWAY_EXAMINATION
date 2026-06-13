import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { AuthUser, Require } from '../../common/decorators/auth.decorator'
import { PrismaService } from '../../prisma/prisma.service'
import { RiskService } from './risk.service'
import type { JwtPayload } from '../../common/types/jwt-payload'

@Controller()
export class ProctoringController {
  constructor(private prisma: PrismaService, private risk: RiskService) {}

  @Post('sessions/:id/events')
  async batchEvents(@Param('id') sessionId: string, @Body() body: { events: any[] }) {
    if (body.events?.length) {
      await this.prisma.proctoringEvent.createMany({
        data: body.events.map((e) => ({
          sessionId, type: e.type, severity: e.severity ?? 0.5,
          confidence: e.confidence ?? 1.0, payload: e.payload ?? {},
          occurredAt: new Date(e.occurredAt ?? Date.now()),
        })),
      })
      await this.risk.recompute(sessionId, {})
    }
    return { accepted: body.events?.length ?? 0 }
  }

  @Get('proctor/live')
  @Require('session.monitor')
  async liveFeed(@Query('examId') examId: string) {
    return this.prisma.examSession.findMany({
      where: { examId, status: 'IN_PROGRESS' },
      include: { riskScore: true, user: { select: { name: true, email: true } } },
      orderBy: [{ riskScore: { score: 'desc' } }],
    })
  }

  @Post('sessions/:id/flag')
  @Require('session.flag')
  async flag(@AuthUser() actor: JwtPayload, @Param('id') sessionId: string, @Body() body: { note: string }) {
    await this.prisma.auditLog.create({
      data: { actorId: actor.sub, action: 'SESSION_FLAGGED', entityType: 'ExamSession', entityId: sessionId, after: { note: body.note } },
    })
    return { ok: true }
  }

  @Post('sessions/:id/extend-time')
  @Require('session.extend_time')
  async extendTime(@AuthUser() actor: JwtPayload, @Param('id') sessionId: string, @Body() body: { seconds: number }) {
    const session = await this.prisma.examSession.findUnique({ where: { id: sessionId } })
    if (!session) return { error: 'Session not found' }
    const newDeadline = new Date(session.deadlineAt!.getTime() + body.seconds * 1000)
    await this.prisma.examSession.update({
      where: { id: sessionId },
      data: { deadlineAt: newDeadline, extraTimeSeconds: { increment: body.seconds } },
    })
    await this.prisma.auditLog.create({
      data: { actorId: actor.sub, action: 'TIME_EXTENDED', entityType: 'ExamSession', entityId: sessionId, after: { seconds: body.seconds } },
    })
    return { newDeadline: newDeadline.toISOString() }
  }
}
