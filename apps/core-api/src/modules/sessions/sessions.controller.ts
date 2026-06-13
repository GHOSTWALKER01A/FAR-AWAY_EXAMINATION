import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { SessionsService } from './sessions.service'
import { AuthGuard } from '../../common/guards/auth.guard'
import { AuthUser } from '../../common/decorators/auth.decorator'

@Controller()
@UseGuards(AuthGuard)
export class SessionsController {
  constructor(private service: SessionsService) {}

  @Post('sessions/:examId/precheck')
  precheck(@AuthUser() user: any, @Param('examId') examId: string, @Body() body: any) {
    return this.service.precheck(user, examId, body)
  }

  @Post('sessions/:examId/start')
  start(@AuthUser() user: any, @Param('examId') examId: string, @Body() body: any) {
    return this.service.start(user, examId, body.deviceToken)
  }

  @Get('sessions/:id/next-item')
  nextItem(@AuthUser() user: any, @Param('id') id: string) {
    return this.service.nextItem(user, id)
  }

  @Post('sessions/:id/answer')
  answer(@AuthUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.service.answer(user, id, body)
  }

  @Post('sessions/:id/heartbeat')
  heartbeat(@AuthUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.service.heartbeat(user, id, body.deviceToken)
  }

  @Post('sessions/:examId/resume')
  resume(@AuthUser() user: any, @Param('examId') examId: string, @Body() body: any) {
    return this.service.resume(user, examId, body.deviceToken)
  }

  @Post('sessions/:id/submit')
  submit(@AuthUser() user: any, @Param('id') id: string) {
    return this.service.submit(user, id)
  }
}
