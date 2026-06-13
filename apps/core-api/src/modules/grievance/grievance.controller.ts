import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { GrievanceService } from './grievance.service'
import { AuthGuard } from '../../common/guards/auth.guard'
import { AuthUser, Require } from '../../common/decorators/auth.decorator'

@Controller()
@UseGuards(AuthGuard)
export class GrievanceController {
  constructor(private service: GrievanceService) {}

  @Post('results/:id/grievance')
  raise(@AuthUser() user: any, @Param('id') resultId: string, @Body() body: any) {
    return this.service.raise(user, resultId, body)
  }

  @Get('grievances')
  @Require('grievance.review')
  list(@Query('status') status: string) {
    return this.service.list(status)
  }

  @Post('grievances/:id/resolve')
  @Require('grievance.review')
  resolve(@AuthUser() actor: any, @Param('id') id: string, @Body() body: any) {
    return this.service.resolve(actor, id, body)
  }
}
