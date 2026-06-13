import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { AuthGuard } from '../../common/guards/auth.guard'
import { AuthUser, Require } from '../../common/decorators/auth.decorator'
import { PrismaService } from '../../prisma/prisma.service'
import { RiskService } from './risk.service'

@Controller()
@UseGuards(AuthGuard)
export class ProctoringController {
  constructor(private prisma: PrismaService, private risk: RiskService) {}

  @Post('sessions/:id/events')
  async batchEvents(@Param('id') sessionId: string, @Body() body: { events: any[] }) {
    // REST fallback for when WebSocket connection drops
    if (body.events?.length) {
      await this.prisma.proctoringEvent.createMany({
        data: body.events.map((e) => ({
          sessionId, type: e.type, severity: e.severity ?? 0.5,
          confidence: e.confidence ?? 1.0, payload: e.payload ?? {}, occurredAt: new Date(e.occurredAt ?? Date.now()),
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
  async flag(@AuthUser() actor: any, @Param('id') sessionId: string, @Body() body: { note: string }) {
    return this.prisma.auditLog.create({
      data: { actorId: actor.sub, action: 'SESSION_FLAGGED', entityType: 'ExamSession', entityId: sessionId, after: { note: body.note } },
    })
  }

  @Post('sessions/:id/extend-time')
  @Require('session.extend_time')
  async extendTime(@AuthUser() actor: any, @Param('id') sessionId: string, @Body() body: { seconds: number }) {
    const session = await this.prisma.examSession.findUnique({ where: { id: sessionId } })
    if (!session) return { error: 'Session not found' }
    const newDeadline = new Date(session.deadlineAt!.getTime() + body.seconds * 1000)
    await this.prisma.examSession.update({ where: { id: sessionId }, data: { deadlineAt: newDeadline, extraTimeSeconds: { increment: body.seconds } } })
    await this.prisma.auditLog.create({
      data: { actorId: actor.sub, action: 'TIME_EXTENDED', entityType: 'ExamSession', entityId: sessionId, after: { seconds: body.seconds } },
    })
    return { newDeadline }
  }
}
