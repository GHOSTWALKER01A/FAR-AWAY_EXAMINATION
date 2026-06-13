import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common'
import { ExamQuestionsService } from './exam-questions.service'
import { AuthUser, Require } from '../../common/decorators/auth.decorator'
import type { JwtPayload } from '../../common/types/jwt-payload'

@Controller('exams/:examId/questions')
export class ExamQuestionsController {
  constructor(private service: ExamQuestionsService) {}

  @Get()
  list(@Param('examId') examId: string) {
    return this.service.list(examId)
  }

  @Post()
  @Require('exam.configure')
  attach(@AuthUser() user: JwtPayload, @Param('examId') examId: string, @Body() body: any) {
    return this.service.attach(user, examId, body)
  }

  @Delete(':questionId')
  @Require('exam.configure')
  detach(@AuthUser() user: JwtPayload, @Param('examId') examId: string, @Param('questionId') questionId: string) {
    return this.service.detach(user, examId, questionId)
  }

  @Post('reorder')
  @Require('exam.configure')
  reorder(@AuthUser() user: JwtPayload, @Param('examId') examId: string, @Body() body: { items: { questionId: string; order: number }[] }) {
    return this.service.reorder(user, examId, body.items)
  }
}
