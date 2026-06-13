import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ExamsService } from './exams.service'
import { AuthUser, Require } from '../../common/decorators/auth.decorator'
import type { JwtPayload } from '../../common/types/jwt-payload'

@Controller('exams')
export class ExamsController {
  constructor(private service: ExamsService) {}

  @Post()
  @Require('exam.create')
  create(@AuthUser() user: JwtPayload, @Body() body: any) {
    return this.service.create(user, body)
  }

  @Patch(':id')
  @Require('exam.configure')
  update(@AuthUser() user: JwtPayload, @Param('id') id: string, @Body() body: any) {
    return this.service.update(user, id, body)
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Get()
  list(@AuthUser() user: JwtPayload, @Query() q: any) {
    return this.service.list(user, q)
  }

  @Post(':id/publish')
  @Require('exam.publish')
  publish(@AuthUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.publish(user, id)
  }

  @Post(':id/close')
  @Require('exam.publish')
  close(@AuthUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.close(user, id)
  }
}
