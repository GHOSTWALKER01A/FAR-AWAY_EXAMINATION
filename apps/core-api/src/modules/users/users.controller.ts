import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { UsersService } from './users.service'
import { AuthUser } from '../../common/decorators/auth.decorator'
import { Require } from '../../common/decorators/auth.decorator'
import type { JwtPayload } from '../../common/types/jwt-payload'

@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}

  @Get()
  @Require('roster.manage')
  list(@AuthUser() user: JwtPayload, @Query() q: any) {
    return this.service.list(user, q)
  }

  @Post('invite')
  @Require('roster.manage')
  invite(@AuthUser() user: JwtPayload, @Body() body: any) {
    return this.service.invite(user, body)
  }

  @Patch(':id/role')
  @Require('roster.manage')
  changeRole(@AuthUser() user: JwtPayload, @Param('id') id: string, @Body() body: { role: string }) {
    return this.service.changeRole(user, id, body.role)
  }

  @Get('me')
  me(@AuthUser() user: JwtPayload) {
    return this.service.getMe(user.sub)
  }

  @Get(':id')
  @Require('roster.manage')
  getById(@AuthUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.getById(user, id)
  }

  @Patch(':id')
  update(@AuthUser() user: JwtPayload, @Param('id') id: string, @Body() body: any) {
    return this.service.update(user, id, body)
  }

  @Patch(':id/password')
  setPassword(@AuthUser() user: JwtPayload, @Param('id') id: string, @Body() body: { password: string }) {
    return this.service.setPassword(user, id, body.password)
  }

  @Delete(':id')
  @Require('roster.manage')
  deactivate(@AuthUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.deactivate(user, id)
  }
}
