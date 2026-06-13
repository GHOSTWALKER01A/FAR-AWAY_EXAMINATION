import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ResultsService } from './results.service'
import { AuthGuard } from '../../common/guards/auth.guard'
import { AuthUser, Require } from '../../common/decorators/auth.decorator'

@Controller()
@UseGuards(AuthGuard)
export class ResultsController {
  constructor(private service: ResultsService) {}

  @Post('exams/:id/results/publish')
  @Require('evaluation.publish_results')
  publish(@AuthUser() actor: any, @Param('id') examId: string) {
    return this.service.publish(actor, examId)
  }

  @Get('exams/:id/scoreboard')
  scoreboard(@Param('id') examId: string) {
    return this.service.scoreboard(examId)
  }

  @Get('sessions/:id/report')
  report(@AuthUser() user: any, @Param('id') sessionId: string) {
    return this.service.report(user, sessionId)
  }
}
