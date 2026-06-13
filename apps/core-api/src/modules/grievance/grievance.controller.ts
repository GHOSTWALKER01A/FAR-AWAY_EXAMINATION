import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { GrievanceService } from './grievance.service'
import { AuthUser, Require } from '../../common/decorators/auth.decorator'
import type { JwtPayload } from '../../common/types/jwt-payload'

@Controller()
export class GrievanceController {
  constructor(private service: GrievanceService) {}

  @Post('results/:id/grievance')
  raise(@AuthUser() user: JwtPayload, @Param('id') resultId: string, @Body() body: any) {
    return this.service.raise(user, resultId, body)
  }

  @Get('grievances')
  @Require('grievance.review')
  list(@Query('status') status: string) {
    return this.service.list(status)
  }

  @Post('grievances/:id/resolve')
  @Require('grievance.review')
  resolve(@AuthUser() actor: JwtPayload, @Param('id') id: string, @Body() body: any) {
    return this.service.resolve(actor, id, body)
  }
}
