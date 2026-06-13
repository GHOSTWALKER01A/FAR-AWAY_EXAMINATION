import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthGuard } from '../../common/guards/auth.guard'
import { AuthUser } from '../../common/decorators/auth.decorator'

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.auth.login(body.email, body.password)
  }

  @Post('refresh')
  refresh(@Body() body: { refreshToken: string }) {
    return this.auth.refresh(body.refreshToken)
  }

  @Post('otp/request')
  requestOtp(@Body() body: { email: string }) {
    return this.auth.requestOtp(body.email)
  }

  @Post('otp/verify')
  verifyOtp(@Body() body: { email: string; otp: string }) {
    return this.auth.verifyOtp(body.email, body.otp)
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@AuthUser() user: any) {
    return user
  }
}
