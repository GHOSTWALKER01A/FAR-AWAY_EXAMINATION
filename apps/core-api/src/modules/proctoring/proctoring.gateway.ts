import {
  ConnectedSocket, MessageBody, OnGatewayConnection,
  SubscribeMessage, WebSocketGateway, WebSocketServer,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../../prisma/prisma.service'
import { RiskService } from './risk.service'

@WebSocketGateway({ namespace: '/ws/proctor', cors: true })
export class ProctoringGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server

  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
    private risk: RiskService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token
      const claims = await this.jwt.verifyAsync(token)
      client.data.user = claims
      if (claims.role === 'INVIGILATOR') {
        const examId = client.handshake.query.examId as string
        client.join(`invig:${examId}`)
      }
    } catch {
      client.disconnect(true)
    }
  }

  @SubscribeMessage('proctor:events')
  async onEvents(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { sessionId: string; events: any[] },
  ) {
    const user = client.data.user
    if (!user) return { ok: false }

    const session = await this.prisma.examSession.findFirst({
      where: { id: body.sessionId, userId: user.sub },
      include: { exam: true },
    })
    if (!session) return { ok: false, error: 'Session not found' }

    // Reject events with timestamps outside the live window (anti-spoofing)
    const windowMs = 60_000
    const valid = body.events.filter((e) => {
      const diff = Math.abs(Date.now() - new Date(e.occurredAt).getTime())
      return diff <= windowMs
    })

    if (valid.length) {
      await this.prisma.proctoringEvent.createMany({
        data: valid.map((e) => ({
          sessionId: session.id, type: e.type, severity: e.severity ?? 0.5,
          confidence: e.confidence ?? 1.0, snapshotRef: e.snapshotRef,
          payload: e.payload ?? {}, occurredAt: new Date(e.occurredAt),
        })),
      })
    }

    const updated = await this.risk.recompute(session.id, session.exam as any)

    // Fan out to invigilators watching this exam
    this.server.to(`invig:${session.examId}`).emit('proctor:update', {
      sessionId: session.id, userId: user.sub,
      score: updated.score, bucket: updated.bucket, latest: valid,
    })

    // Warn candidate on first escalation — never auto-fail
    return { ok: true, warn: updated.bucket === 'MEDIUM', alert: updated.bucket === 'HIGH' }
  }

  @SubscribeMessage('invig:message')
  async onInvigMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { sessionId: string; text: string },
  ) {
    if (client.data.user?.role !== 'INVIGILATOR') return { ok: false }
    this.server.to(`session:${body.sessionId}`).emit('invig:message', { text: body.text })
    return { ok: true }
  }
}
