import { Process, Processor } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { Job } from 'bull'
import { PrismaService } from '../../prisma/prisma.service'
import { AiClient } from '../../ai/ai.client'

@Processor('grading')
export class GradingProcessor {
  private readonly logger = new Logger(GradingProcessor.name)

  constructor(private prisma: PrismaService, private ai: AiClient) {}

  @Process('grade-session')
  async gradeSession(job: Job<{ sessionId: string }>) {
    const { sessionId } = job.data
    this.logger.log(`Grading session ${sessionId}`)

    // Get latest response per question (append-only → highest sequenceNo wins)
    const responses = await this.prisma.$queryRaw<any[]>`
      SELECT DISTINCT ON (r.question_id) r.*, q.type, q.correct_key, q.marks, q.rubric, q.stem
      FROM responses r
      JOIN questions q ON q.id = r.question_id
      WHERE r.session_id = ${sessionId}::uuid
      ORDER BY r.question_id, r.sequence_no DESC
    `

    let totalMarks = 0; let maxMarks = 0

    for (const r of responses) {
      maxMarks += Number(r.marks)
      if (r.is_correct !== null) {
        totalMarks += Number(r.awarded_marks ?? 0)
        continue
      }
      // subjective → AI ensemble grading
      if (['SHORT', 'LONG', 'CODE'].includes(r.type)) {
        try {
          const out = await this.ai.gradeSubjective({
            question_stem: r.stem,
            rubric: r.rubric ?? {},
            max_marks: r.marks,
            student_answer: r.answer,
            ensemble: true,
          })
          await this.prisma.evaluation.create({
            data: {
              responseId: r.id,
              grader: 'AI',
              awarded: out.awarded,
              maxMarks: r.marks,
              criteria: out.criteria,
              confidence: out.confidence,
              status: 'SUGGESTED',
              graderRef: out.model,
            },
          })
          totalMarks += out.awarded
        } catch (e) {
          this.logger.error(`Grading failed for response ${r.id}: ${e.message}`)
          // Leave PENDING — surfaces in human review queue
        }
      }
    }

    // Write provisional result
    await this.prisma.result.upsert({
      where: { sessionId },
      update: { totalMarks, maxMarks, status: 'PROVISIONAL' },
      create: { sessionId, totalMarks, maxMarks, status: 'PROVISIONAL' },
    })
    this.logger.log(`Session ${sessionId} graded: ${totalMarks}/${maxMarks}`)
  }
}
