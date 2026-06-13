import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ExamsService } from './exams.service'
import { AuthGuard } from '../../common/guards/auth.guard'
import { AuthUser, Require } from '../../common/decorators/auth.decorator'

@Controller('exams')
@UseGuards(AuthGuard)
export class ExamsController {
  constructor(private service: ExamsService) {}

  @Post()
  @Require('exam.create')
  create(@AuthUser() user: any, @Body() body: any) {
    return this.service.create(user, body)
  }

  @Patch(':id')
  @Require('exam.configure')
  update(@AuthUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.service.update(user, id, body)
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Get()
  list(@AuthUser() user: any, @Query() q: any) {
    return this.service.list(user, q)
  }

  @Post(':id/publish')
  @Require('exam.publish')
  publish(@AuthUser() user: any, @Param('id') id: string) {
    return this.service.publish(user, id)
  }

  @Post(':id/close')
  @Require('exam.publish')
  close(@AuthUser() user: any, @Param('id') id: string) {
    return this.service.close(user, id)
  }
}
