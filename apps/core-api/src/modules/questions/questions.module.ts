import { Module } from '@nestjs/common'
import { QuestionsController } from './questions.controller'
import { QuestionsService } from './questions.service'
import { AiModule } from '../../ai/ai.module'

@Module({ imports: [AiModule], controllers: [QuestionsController], providers: [QuestionsService] })
export class QuestionsModule {}
