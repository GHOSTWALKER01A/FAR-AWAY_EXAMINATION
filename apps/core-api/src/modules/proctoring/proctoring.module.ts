import { Module } from '@nestjs/common'
import { ProctoringGateway } from './proctoring.gateway'
import { RiskService } from './risk.service'
import { ProctoringController } from './proctoring.controller'

@Module({ controllers: [ProctoringController], providers: [ProctoringGateway, RiskService] })
export class ProctoringModule {}
