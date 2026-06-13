import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { SectionsService } from './sections.service'
import { AuthUser, Require } from '../../common/decorators/auth.decorator'
import type { JwtPayload } from '../../common/types/jwt-payload'

@Controller('exams/:examId/sections')
export class SectionsController {
  constructor(private service: SectionsService) {}

  @Get()
  list(@Param('examId') examId: string) {
    return this.service.list(examId)
  }

  @Post()
  @Require('exam.configure')
  create(@AuthUser() user: JwtPayload, @Param('examId') examId: string, @Body() body: any) {
    return this.service.create(user, examId, body)
  }

  @Patch(':sectionId')
  @Require('exam.configure')
  update(@AuthUser() user: JwtPayload, @Param('examId') examId: string, @Param('sectionId') sectionId: string, @Body() body: any) {
    return this.service.update(user, examId, sectionId, body)
  }

  @Delete(':sectionId')
  @Require('exam.configure')
  remove(@AuthUser() user: JwtPayload, @Param('examId') examId: string, @Param('sectionId') sectionId: string) {
    return this.service.remove(user, examId, sectionId)
  }
}
