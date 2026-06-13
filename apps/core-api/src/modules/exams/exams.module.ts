import { Module } from '@nestjs/common'
import { ExamsController } from './exams.controller'
import { ExamsService } from './exams.service'
import { ExamQuestionsController } from './exam-questions.controller'
import { ExamQuestionsService } from './exam-questions.service'

@Module({
  controllers: [ExamsController, ExamQuestionsController],
  providers: [ExamsService, ExamQuestionsService],
  exports: [ExamsService],
})
export class ExamsModule {}
