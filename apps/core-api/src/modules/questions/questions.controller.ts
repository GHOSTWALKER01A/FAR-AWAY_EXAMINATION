import { Body, Controller, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { QuestionsService } from './questions.service'
import { AuthUser, Require } from '../../common/decorators/auth.decorator'
import type { JwtPayload } from '../../common/types/jwt-payload'

@Controller('questions')
export class QuestionsController {
  constructor(private service: QuestionsService) {}

  @Post()
  @Require('question.author')
  create(@AuthUser() user: JwtPayload, @Body() body: any) {
    return this.service.create(user, body)
  }

  @Patch(':id')
  @Require('question.author')
  update(@AuthUser() user: JwtPayload, @Param('id') id: string, @Body() body: any) {
    return this.service.update(user, id, body)
  }

  @Get()
  @Require('question.bank.manage')
  list(@AuthUser() user: JwtPayload, @Query() q: any) {
    return this.service.list(user, q)
  }

  @Post('bulk/preview')
  @Require('question.bank.manage')
  @UseInterceptors(FileInterceptor('file'))
  bulkPreview(@AuthUser() user: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    return this.service.bulkPreview(user, file)
  }

  @Post('bulk/commit')
  @Require('question.bank.manage')
  bulkCommit(@AuthUser() user: JwtPayload, @Body() body: { previewId: string }) {
    return this.service.bulkCommit(user, body.previewId)
  }

  @Post('ai-draft')
  @Require('question.author')
  aiDraft(@AuthUser() user: JwtPayload, @Body() body: any) {
    return this.service.aiDraft(user, body)
  }
}
