import { Process, Processor } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { Job } from 'bull'
import { PrismaService } from '../../prisma/prisma.service'

@Processor('calibration')
export class CalibrationProcessor {
  private readonly logger = new Logger(CalibrationProcessor.name)

  constructor(private prisma: PrismaService) {}

  @Process('calibrate')
  async calibrate(job: Job<{ questionId: string }>) {
    const { questionId } = job.data
    this.logger.log(`Calibrating question ${questionId}`)
    // In production: compute p-value + point-biserial, then call FastAPI /calibration
    // to fit IRT params via EM algorithm. For now, mark as FIELD_TEST until full calibration.
    await this.prisma.question.updateMany({
      where: { id: questionId, calibrationStatus: 'UNCALIBRATED' },
      data: { calibrationStatus: 'FIELD_TEST' },
    })
  }
}
