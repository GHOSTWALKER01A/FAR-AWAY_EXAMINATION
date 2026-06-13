import { Body, Controller, Get, Post } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthUser } from '../../common/decorators/auth.decorator'
import { Public } from '../../common/decorators/public.decorator'
import type { JwtPayload } from '../../common/types/jwt-payload'

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  @Public()
  login(@Body() body: { email: string; password: string }) {
    return this.auth.login(body.email, body.password)
  }

  @Post('refresh')
  @Public()
  refresh(@Body() body: { refreshToken: string }) {
    return this.auth.refresh(body.refreshToken)
  }

  @Post('otp/request')
  @Public()
  requestOtp(@Body() body: { email: string }) {
    return this.auth.requestOtp(body.email)
  }

  @Post('otp/verify')
  @Public()
  verifyOtp(@Body() body: { email: string; otp: string }) {
    return this.auth.verifyOtp(body.email, body.otp)
  }

  /** Returns the decoded JWT claims for the currently logged-in user. */
  @Get('me')
  me(@AuthUser() user: JwtPayload) {
    return user
  }
}
