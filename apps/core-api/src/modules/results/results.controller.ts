import { Controller, Get, Param, Post } from '@nestjs/common'
import { ResultsService } from './results.service'
import { AuthUser, Require } from '../../common/decorators/auth.decorator'
import { Public } from '../../common/decorators/public.decorator'
import type { JwtPayload } from '../../common/types/jwt-payload'

@Controller()
export class ResultsController {
  constructor(private service: ResultsService) {}

  @Post('exams/:id/results/publish')
  @Require('evaluation.publish_results')
  publish(@AuthUser() actor: JwtPayload, @Param('id') examId: string) {
    return this.service.publish(actor, examId)
  }

  /** Public scoreboard — visible without authentication. */
  @Get('exams/:id/scoreboard')
  @Public()
  scoreboard(@Param('id') examId: string) {
    return this.service.scoreboard(examId)
  }

  @Get('sessions/:id/report')
  report(@AuthUser() user: JwtPayload, @Param('id') sessionId: string) {
    return this.service.report(user, sessionId)
  }
}
