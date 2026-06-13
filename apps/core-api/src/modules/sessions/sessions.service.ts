import {
  BadRequestException, ConflictException, ForbiddenException,
  Injectable, Logger, NotFoundException,
} from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { PrismaService } from '../../prisma/prisma.service'
import { RedisService } from '../../redis/redis.service'
import { LockService } from '../../redis/lock.service'
import { AiClient } from '../../ai/ai.client'

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name)

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private lock: LockService,
    private ai: AiClient,
    @InjectQueue('grading') private gradingQueue: Queue,
  ) {}

  async precheck(user: any, examId: string, body: any) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } })
    if (!exam) throw new NotFoundException('Exam not found')
    if (exam.status !== 'LIVE') throw new BadRequestException('Exam is not live')
    const procCfg = exam.proctoringConfig as any
    const checks = {
      examLive: true,
      cameraRequired: !!procCfg?.requireCamera,
      cameraGranted: body.cameraGranted ?? false,
      networkOk: body.networkOk ?? true,
      browserCompatible: body.browserCompatible ?? true,
    }
    const canProceed = !checks.cameraRequired || checks.cameraGranted
    if (!canProceed) throw new BadRequestException('Camera permission required for this exam')
    return checks
  }

  async start(user: any, examId: string, deviceToken: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } })
    if (!exam) throw new NotFoundException('Exam not found')
    if (exam.status !== 'LIVE') throw new BadRequestException('Exam is not live')
    const now = new Date()
    if (exam.startAt && now < exam.startAt) throw new BadRequestException('Exam has not started yet')
    if (exam.endAt && now > exam.endAt) throw new BadRequestException('Exam registration window has closed')

    const enr = await this.prisma.enrolment.findUnique({
      where: { examId_userId: { examId, userId: user.sub } },
    })
    if (!enr || enr.status === 'CANCELLED') throw new ForbiddenException('Not enrolled in this exam')

    await this.lock.acquireSession(examId, user.sub, deviceToken)

    const accessExtra = ((user.accessibility?.extraTimePct ?? 0) / 100) * exam.durationSeconds
    const personal = now.getTime() + (exam.durationSeconds + accessExtra) * 1000
    const cap = exam.endAt?.getTime() ?? Infinity
    const deadlineAt = new Date(Math.min(personal, cap))

    const session = await this.prisma.examSession.upsert({
      where: { examId_userId: { examId, userId: user.sub } },
      create: {
        examId, userId: user.sub, status: 'IN_PROGRESS',
        startedAt: now, deadlineAt, activeDeviceToken: deviceToken, lastHeartbeatAt: now,
        extraTimeSeconds: Math.round(accessExtra),
      },
      update: { status: 'IN_PROGRESS', activeDeviceToken: deviceToken, lastHeartbeatAt: now },
    })
    await this.redis.setSessionState(session.id, { theta: 0, se: 99, served: [], deadline: deadlineAt.toISOString() })
    return { sessionId: session.id, deadlineAt, remainingSeconds: Math.floor((deadlineAt.getTime() - now.getTime()) / 1000) }
  }

  async nextItem(user: any, sessionId: string) {
    const session = await this.loadOwnedActive(user, sessionId)
    this.assertWithinTime(session)
    const exam = await this.prisma.exam.findUnique({ where: { id: session.examId } })
    const state = await this.redis.getSessionState(sessionId)

    if (exam!.mode === 'FIXED') {
      const answered = state.served ?? []
      const next = await this.prisma.examQuestion.findFirst({
        where: { examId: session.examId, questionId: { notIn: answered } },
        orderBy: { order: 'asc' },
        include: { question: true },
      })
      if (!next) return { done: true }
      return this.sanitize(next.question)
    }

    if (exam!.mode === 'ADAPTIVE') {
      try {
        const candidates = await this.getAdaptiveCandidates(exam!, state.served ?? [])
        if (!candidates.length) return { done: true }
        const pick = await this.ai.selectNextItem({
          theta: state.theta, se: state.se,
          administered: state.served,
          candidates: candidates.map((c: any) => ({ id: c.id, a: c.irtA, b: c.irtB, c: c.irtC, topic: c.topicTags, difficulty: c.difficulty })),
          config: exam!.adaptiveConfig,
        })
        if (pick.stop) return { done: true, theta: pick.theta, se: pick.se }
        const q = candidates.find((c: any) => c.id === pick.question_id)
        if (!q) return { done: true }
        await this.prisma.question.update({ where: { id: q.id }, data: { exposureCount: { increment: 1 } } })
        return this.sanitize(q)
      } catch {
        // Fallback: serve next unserved item by difficulty
        const served = state.served ?? []
        const fallback = await this.prisma.question.findFirst({
          where: { id: { notIn: served }, calibrationStatus: 'CALIBRATED' },
          orderBy: { difficulty: 'asc' },
        })
        return fallback ? this.sanitize(fallback) : { done: true }
      }
    }

    // RANDOMISED: draw from bank respecting blueprint
    const served = state.served ?? []
    const q = await this.prisma.question.findFirst({
      where: { institutionId: exam!.institutionId, id: { notIn: served }, isLatest: true },
      orderBy: [{ difficulty: 'asc' }],
    })
    return q ? this.sanitize(q) : { done: true }
  }

  async answer(user: any, sessionId: string, dto: any) {
    const session = await this.loadOwnedActive(user, sessionId)
    this.assertWithinTime(session)

    // Idempotency — same nonce returns immediately
    const existing = await this.prisma.response.findUnique({
      where: { sessionId_clientNonce: { sessionId, clientNonce: dto.clientNonce } },
    })
    if (existing) return { accepted: true, deduped: true }

    const q = await this.prisma.question.findUnique({ where: { id: dto.questionId } })
    if (!q) throw new NotFoundException('Question not found')

    const exam = await this.prisma.exam.findUnique({ where: { id: session.examId } })

    const seq = await this.redis.nextSequence(sessionId)
    let isCorrect: boolean | null = null; let awardedMarks: number | null = null

    if (['MCQ', 'MULTI_SELECT', 'NUMERIC'].includes(q.type)) {
      const r = this.gradeObjective(q, dto.answer, exam as any)
      isCorrect = r.isCorrect; awardedMarks = r.awarded
    }

    await this.prisma.response.create({
      data: { sessionId, questionId: q.id, sequenceNo: seq, answer: dto.answer, isCorrect, awardedMarks, timeSpentMs: dto.timeSpentMs, clientNonce: dto.clientNonce },
    })

    // Update θ for adaptive mode
    if (exam?.mode === 'ADAPTIVE' && isCorrect !== null) {
      const state = await this.redis.getSessionState(sessionId)
      try {
        const upd = await this.ai.updateTheta({
          theta: state.theta,
          administered: [...(state.administered ?? []), { a: q.irtA ?? 1, b: q.irtB ?? 0, c: q.irtC ?? 0, correct: isCorrect }],
        })
        await this.redis.setSessionState(sessionId, { ...state, theta: upd.theta, se: upd.se, served: [...(state.served ?? []), q.id] })
      } catch {
        // Fallback: update served list without θ update; recalculate at submit
        const state2 = await this.redis.getSessionState(sessionId)
        await this.redis.setSessionState(sessionId, { ...state2, served: [...(state2.served ?? []), q.id] })
      }
    }
    return { accepted: true }
  }

  async heartbeat(user: any, sessionId: string, deviceToken: string) {
    const session = await this.loadOwnedActive(user, sessionId)
    if (session.activeDeviceToken !== deviceToken) throw new ConflictException('Session active on another device')
    await this.prisma.examSession.update({ where: { id: sessionId }, data: { lastHeartbeatAt: new Date() } })
    const remaining = Math.max(0, (session.deadlineAt!.getTime() - Date.now()) / 1000)
    return { remainingSeconds: Math.floor(remaining) }
  }

  async resume(user: any, examId: string, deviceToken: string) {
    const session = await this.prisma.examSession.findUnique({ where: { examId_userId: { examId, userId: user.sub } } })
    if (!session) throw new NotFoundException('No session to resume')
    if (['SUBMITTED', 'EXPIRED', 'ABANDONED'].includes(session.status)) throw new BadRequestException('Session has ended')
    await this.lock.acquireSession(examId, user.sub, deviceToken)
    await this.prisma.examSession.update({ where: { id: session.id }, data: { status: 'IN_PROGRESS', activeDeviceToken: deviceToken, lastHeartbeatAt: new Date() } })
    const answered = await this.prisma.response.findMany({ where: { sessionId: session.id }, select: { questionId: true } })
    return {
      sessionId: session.id,
      remainingSeconds: Math.max(0, Math.floor((session.deadlineAt!.getTime() - Date.now()) / 1000)),
      answeredCount: answered.length,
    }
  }

  async submit(user: any, sessionId: string) {
    const session = await this.loadOwnedActive(user, sessionId)
    await this.prisma.examSession.update({ where: { id: sessionId }, data: { status: 'SUBMITTED', submittedAt: new Date() } })
    await this.redis.clearSessionState(sessionId)
    await this.lock.releaseSession(session.examId, user.sub)
    // Fixed jobId ensures idempotent enqueue — double-submit won't double-grade
    await this.gradingQueue.add('grade-session', { sessionId }, { jobId: `grade-${sessionId}`, removeOnComplete: true })
    return { submitted: true }
  }

  // Reaper — mark dead sessions every 20s
  @Cron('*/20 * * * * *')
  async reapStale() {
    const grace = Number(process.env.SESSION_HEARTBEAT_TIMEOUT ?? 45) * 1000
    const cutoff = new Date(Date.now() - grace)
    await this.prisma.examSession.updateMany({ where: { status: 'IN_PROGRESS', lastHeartbeatAt: { lt: cutoff } }, data: { status: 'DISCONNECTED' } })
    await this.prisma.examSession.updateMany({
      where: { status: { in: ['IN_PROGRESS', 'DISCONNECTED'] }, deadlineAt: { lt: new Date(Date.now() - 120_000) } },
      data: { status: 'EXPIRED' },
    })
  }

  private async loadOwnedActive(user: any, sessionId: string) {
    const session = await this.prisma.examSession.findUnique({ where: { id: sessionId } })
    if (!session) throw new NotFoundException('Session not found')
    if (session.userId !== user.sub) throw new ForbiddenException()
    if (!['IN_PROGRESS'].includes(session.status)) throw new BadRequestException(`Session is ${session.status}`)
    return session
  }

  private assertWithinTime(session: any) {
    const grace = Number(process.env.EXAM_TIMER_GRACE_SECONDS ?? 120) * 1000
    if (Date.now() > session.deadlineAt!.getTime() + grace) throw new BadRequestException('Time is up')
  }

  private gradeObjective(q: any, answer: any, examConfig: any) {
    const key = q.correctKey as any
    let isCorrect = false; let awarded = 0
    const marking = examConfig?.markingConfig ?? {}

    if (q.type === 'MCQ') {
      isCorrect = JSON.stringify(answer?.optionIds?.sort()) === JSON.stringify(key?.optionIds?.sort())
      awarded = isCorrect ? q.marks : -(marking.negativePenalty ?? 0) * q.marks
    } else if (q.type === 'MULTI_SELECT') {
      const correct = new Set<string>(key?.optionIds ?? [])
      const given = new Set<string>(answer?.optionIds ?? [])
      const intersection = [...correct].filter((x) => given.has(x)).length
      isCorrect = intersection === correct.size && given.size === correct.size
      awarded = isCorrect ? q.marks : 0   // All-or-nothing; per-option scoring configurable
    } else if (q.type === 'NUMERIC') {
      const tol = key?.tolerance ?? 0
      isCorrect = Math.abs(Number(answer?.value) - Number(key?.value)) <= tol
      awarded = isCorrect ? q.marks : 0
    }
    return { isCorrect, awarded: Math.max(0, awarded) }
  }

  private sanitize(q: any) {
    const { correctKey, irtA, irtB, irtC, rubric, ...safe } = q
    return safe
  }

  private async getAdaptiveCandidates(exam: any, served: string[]) {
    return this.prisma.question.findMany({
      where: {
        institutionId: exam.institutionId,
        id: { notIn: served.length ? served : ['__none__'] },
        calibrationStatus: 'CALIBRATED',
        isLatest: true,
        exposureCount: { lt: (exam.adaptiveConfig as any)?.exposureCap ?? 999 },
      },
      take: 50,
    })
  }
}
