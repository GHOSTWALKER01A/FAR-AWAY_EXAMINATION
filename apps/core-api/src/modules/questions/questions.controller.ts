import { Body, Controller, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { QuestionsService } from './questions.service'
import { AuthGuard } from '../../common/guards/auth.guard'
import { AuthUser, Require } from '../../common/decorators/auth.decorator'

@Controller('questions')
@UseGuards(AuthGuard)
export class QuestionsController {
  constructor(private service: QuestionsService) {}

  @Post()
  @Require('question.author')
  create(@AuthUser() user: any, @Body() body: any) {
    return this.service.create(user, body)
  }

  @Patch(':id')
  @Require('question.author')
  update(@AuthUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.service.update(user, id, body)
  }

  @Get()
  @Require('question.bank.manage')
  list(@AuthUser() user: any, @Query() q: any) {
    return this.service.list(user, q)
  }

  @Post('bulk/preview')
  @Require('question.bank.manage')
  @UseInterceptors(FileInterceptor('file'))
  bulkPreview(@AuthUser() user: any, @UploadedFile() file: Express.Multer.File) {
    return this.service.bulkPreview(user, file)
  }

  @Post('bulk/commit')
  @Require('question.bank.manage')
  bulkCommit(@AuthUser() user: any, @Body() body: { previewId: string }) {
    return this.service.bulkCommit(user, body.previewId)
  }

  @Post('ai-draft')
  @Require('question.author')
  aiDraft(@AuthUser() user: any, @Body() body: any) {
    return this.service.aiDraft(user, body)
  }
}
