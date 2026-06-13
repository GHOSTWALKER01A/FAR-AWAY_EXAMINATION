import { Body, Controller, Delete, Get, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { EnrolmentService } from './enrolment.service'
import { AuthGuard } from '../../common/guards/auth.guard'
import { AuthUser, Require } from '../../common/decorators/auth.decorator'

@Controller('exams/:examId')
@UseGuards(AuthGuard)
export class EnrolmentController {
  constructor(private service: EnrolmentService) {}

  @Post('roster')
  @Require('roster.manage')
  @UseInterceptors(FileInterceptor('file'))
  importRoster(@AuthUser() user: any, @Param('examId') examId: string, @UploadedFile() file: Express.Multer.File) {
    return this.service.importRoster(user, examId, file)
  }

  @Post('register')
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
