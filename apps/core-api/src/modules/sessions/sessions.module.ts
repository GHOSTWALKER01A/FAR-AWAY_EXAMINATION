import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { SessionsController } from './sessions.controller'
import { SessionsService } from './sessions.service'
import { AiModule } from '../../ai/ai.module'

@Module({
  imports: [AiModule, BullModule.registerQueue({ name: 'grading' })],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
