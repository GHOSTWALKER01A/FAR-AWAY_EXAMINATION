import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { ProctoringGateway } from './proctoring.gateway'
import { RiskService } from './risk.service'
import { ProctoringController } from './proctoring.controller'

@Module({
  // AuthModule exports JwtModule → gives ProctoringGateway access to JwtService
  imports: [AuthModule],
  controllers: [ProctoringController],
  providers: [ProctoringGateway, RiskService],
})
export class ProctoringModule {}
