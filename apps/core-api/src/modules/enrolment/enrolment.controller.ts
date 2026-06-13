import { Body, Controller, Delete, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { EnrolmentService } from './enrolment.service'
import { AuthUser, Require } from '../../common/decorators/auth.decorator'
import { Public } from '../../common/decorators/public.decorator'
import type { JwtPayload } from '../../common/types/jwt-payload'

@Controller('exams/:examId')
export class EnrolmentController {
  constructor(private service: EnrolmentService) {}

  @Post('roster')
  @Require('roster.manage')
  @UseInterceptors(FileInterceptor('file'))
  importRoster(@AuthUser() user: JwtPayload, @Param('examId') examId: string, @UploadedFile() file: Express.Multer.File) {
    return this.service.importRoster(user, examId, file)
  }

  /** Open self-registration — publicly accessible (no auth required). */
  @Post('register')
  @Public()
  register(@Param('examId') examId: string, @Body() body: any) {
    return this.service.selfRegister(examId, body)
  }

  @Get('enrolments')
  list(@Param('examId') examId: string) {
    return this.service.list(examId)
  }

  @Delete('enrolments/:userId')
  @Require('roster.manage')
  cancel(@Param('examId') examId: string, @Param('userId') userId: string) {
    return this.service.cancel(examId, userId)
  }
}
