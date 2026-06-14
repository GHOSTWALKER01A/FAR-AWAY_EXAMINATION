import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { GradingProcessor } from './processors/grading.processor'
import { CalibrationProcessor } from './processors/calibration.processor'
import { AiModule } from '../ai/ai.module'

@Module({
  imports: [
    AiModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({ redis: cfg.get<string>('REDIS_URL') }),
    }),
    BullModule.registerQueue(
      { name: 'grading' },
      { name: 'generation' },
      { name: 'calibration' },
      { name: 'notification' },
    ),
  ],
  providers: [GradingProcessor, CalibrationProcessor],
  exports: [BullModule],
})
export class QueueModule {}
