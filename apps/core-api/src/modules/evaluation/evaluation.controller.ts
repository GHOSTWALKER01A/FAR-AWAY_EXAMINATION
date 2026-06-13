import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { EvaluationService } from './evaluation.service'
import { AuthUser, Require } from '../../common/decorators/auth.decorator'
import type { JwtPayload } from '../../common/types/jwt-payload'

@Controller('evaluations')
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
  approve(@AuthUser() actor: JwtPayload, @Param('id') id: string) {
    return this.service.approve(actor, id)
  }

  @Post(':id/override')
  @Require('evaluation.override_ai')
  override(@AuthUser() actor: JwtPayload, @Param('id') id: string, @Body() body: any) {
    return this.service.override(actor, id, body)
  }
}
