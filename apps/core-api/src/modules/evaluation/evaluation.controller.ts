import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { EvaluationService } from './evaluation.service'
import { AuthGuard } from '../../common/guards/auth.guard'
import { AuthUser, Require } from '../../common/decorators/auth.decorator'

@Controller('evaluations')
@UseGuards(AuthGuard)
export class EvaluationController {
  constructor(private service: EvaluationService) {}

  @Post('run/:examId')
  @Require('evaluation.grade_manual')
  run(@Param('examId') examId: string) {
    return this.service.runForExam(examId)
  }

  @Get('review-queue')
  @Require('evaluation.grade_manual')
  reviewQueue(@Query('examId') examId: string) {
    return this.service.reviewQueue(examId)
  }

  @Post(':id/approve')
  @Require('evaluation.override_ai')
  approve(@AuthUser() actor: any, @Param('id') id: string) {
    return this.service.approve(actor, id)
  }

  @Post(':id/override')
  @Require('evaluation.override_ai')
  override(@AuthUser() actor: any, @Param('id') id: string, @Body() body: any) {
    return this.service.override(actor, id, body)
  }
}
