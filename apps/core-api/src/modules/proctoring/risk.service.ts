import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

const DEFAULT_WEIGHTS: Record<string, number> = {
  TAB_SWITCH: 0.15, WINDOW_BLUR: 0.1, FULLSCREEN_EXIT: 0.1,
  COPY: 0.2, PASTE: 0.25, RIGHT_CLICK: 0.05,
  FACE_MISSING: 0.3, MULTIPLE_FACES: 0.4, GAZE_AWAY: 0.1,
  NETWORK_DROP: 0.05, DEVTOOLS_OPEN: 0.35,
}

@Injectable()
export class RiskService {
  constructor(private prisma: PrismaService) {}

  async recompute(sessionId: string, examConfig: any) {
    const events = await this.prisma.proctoringEvent.findMany({ where: { sessionId } })
    const weights = (examConfig?.proctoringConfig as any)?.weights ?? DEFAULT_WEIGHTS
    const high = (examConfig?.proctoringConfig as any)?.highThreshold ?? 0.7
    const med = (examConfig?.proctoringConfig as any)?.medThreshold ?? 0.3
    const breakdown: Record<string, number> = {}
    let score = 0
    for (const e of events) {
      const w = weights[e.type] ?? 0.1
      const contribution = w * e.severity * e.confidence
      score += contribution
      breakdown[e.type] = (breakdown[e.type] ?? 0) + contribution
    }
    score = Math.min(1, score)
    const bucket = score >= high ? 'HIGH' : score >= med ? 'MEDIUM' : 'LOW'
    await this.prisma.sessionRiskScore.upsert({
      where: { sessionId },
      update: { score, bucket, breakdown, computedAt: new Date() },
      create: { sessionId, score, bucket, breakdown },
    })
    return { score, bucket, breakdown }
  }
}
